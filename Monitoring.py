####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

import os
import subprocess
import platform

from twisted.internet.defer import inlineCallbacks, returnValue
from autobahn.twisted.util import sleep
from autobahn.twisted.wamp import ApplicationSession

from pygtail import Pygtail
import json
from datetime import datetime
import sys
import sqlite3

PGC_HOME = os.getenv("PGC_HOME", "")
PGC_LOGS = os.getenv("PGC_LOGS", "")

pgc_scripts_path = os.path.join(PGC_HOME, 'hub', 'scripts')
if pgc_scripts_path not in sys.path:
  sys.path.append(pgc_scripts_path)

pgclib_scripts_path = os.path.join(PGC_HOME, 'hub', 'scripts','lib')
if pgclib_scripts_path not in sys.path:
  sys.path.append(pgclib_scripts_path)

import util
from PgInstance import PgInstance

this_uname = str(platform.system())

#if this_uname == "Darwin":
#    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib', 'osx'))
#elif this_uname == "Linux":
#    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib', 'linux'))

import psutil

db_local = PGC_HOME + os.sep + "conf" + os.sep + "pgc_local.db"


class Monitoring(object):
    """
    This class exposes all the actions for the components in the methods defined.
    """
    def __init__(self, appsession=ApplicationSession):
        self.session = appsession
        self.process = ""
        self.graphs_stats = []
        self.disks_before = None
        self.latest_stats = {}
        self.db_stats = {}
        self.latest_db_stats = {}
        self.previous_db_stats = {}
        self.previous_cpu_timestamp = 0
        self.db_activity = {}
        self.pgpassfiles = {}

    def save_graphs_data(self):
        stats_timestamp = datetime.utcnow()
        stats_time = stats_timestamp.strftime('%Y/%m/%d %H:%M:%S')
        if self.disks_before:
            time_diff = stats_timestamp - self.previous_cpu_timestamp
            diff_seconds = time_diff.seconds
            disks_after = psutil.disk_io_counters()
            disks_read_per_sec = (((int(disks_after.read_bytes) -
                                    int(self.disks_before.read_bytes))/1024)/1024)/diff_seconds
            disks_write_per_sec = (((int(disks_after.write_bytes) -
                                     int(self.disks_before.write_bytes))/1024)/1024)/diff_seconds
            self.disks_before = disks_after
            io = {"read_bytes": disks_read_per_sec, "write_bytes": disks_write_per_sec}
            cpu_times_percent = psutil.cpu_times_percent()
            cpu_percent = dict()
            cpu_percent['user'] = cpu_times_percent.user
            cpu_percent['idle'] = cpu_times_percent.idle
            cpu_percent['system'] = cpu_times_percent.system
            mem_percent = psutil.virtual_memory().percent
            stats = {"time": stats_time, "cpu_per": cpu_percent, "mem_percent": mem_percent, "io": io}
            self.latest_stats = stats
            if len(self.graphs_stats) == 60:
                self.graphs_stats.pop(0)
            self.graphs_stats.append(stats)
            self.previous_cpu_timestamp = stats_timestamp
        else:
            self.previous_cpu_timestamp = stats_timestamp
            self.disks_before = psutil.disk_io_counters()

    @inlineCallbacks
    def initial_graphs_data(self):
        yield self.session.publish('com.bigsql.initgraphs', self.graphs_stats)

    @inlineCallbacks
    def live_graphs_data(self):
        yield self.session.publish('com.bigsql.graphs', self.latest_stats)

    def save_dbstats_data(self):
        try:
            connL = sqlite3.connect(db_local)
            c = connL.cursor()
            sql = "SELECT component, port" + \
                  "  FROM components " + \
                  " WHERE project='pg' AND datadir != ''"
            c.execute(sql)
            t_comp = c.fetchall()

            for comp in t_comp:
                pg_comp = str(comp[0])
                try:
                    if pg_comp in self.pgpassfiles:
                        os.environ['PGPASSFILE'] = self.pgpassfiles[pg_comp]
                    else:
                        util.read_env_file(pg_comp)
                        self.pgpassfiles[pg_comp] = os.environ['PGPASSFILE']
                    port = comp[1]
                    pg = PgInstance("localhost", "postgres", "postgres", int(port))
                    pg.connect()
                    cluster_stats_data = pg.get_cluster_stats()
                    activity_details = pg.get_current_activity()
                    connections = pg.get_active_connections()
                    self.db_activity[pg_comp] = activity_details
                    pg.close()
                    stats_timestamp = datetime.utcnow()
                    stats_time = stats_timestamp.strftime('%Y/%m/%d %H:%M:%S')
                    if cluster_stats_data and cluster_stats_data[0]:
                        comp_db_stats = cluster_stats_data[0]
                    else:
                        continue
                    comp_db_stats['time'] = stats_time
                    if pg_comp in self.db_stats:
                        if len(self.db_stats[pg_comp]) == 60:
                            self.db_stats[pg_comp].pop(0)
                        previous = self.previous_db_stats[pg_comp]
                        self.previous_db_stats[pg_comp] = {}
                        time_diff = stats_timestamp - previous['timestamp']
                        diff_seconds = time_diff.seconds
                        current_xact_commit = (comp_db_stats['xact_commit'] - previous['xact_commit'])/diff_seconds
                        current_xact_rollback = (comp_db_stats['xact_rollback'] - previous['xact_rollback'])/diff_seconds
                        self.previous_db_stats[pg_comp]['xact_commit'] = comp_db_stats['xact_commit']
                        self.previous_db_stats[pg_comp]['xact_rollback'] = comp_db_stats['xact_rollback']
                        self.previous_db_stats[pg_comp]['timestamp'] = stats_timestamp
                        comp_db_stats['xact_commit'] = int(round(current_xact_commit))
                        comp_db_stats['xact_rollback'] = int(round(current_xact_rollback))
                        tup_fetched = (comp_db_stats['tup_fetched'] - previous['tup_fetched'])/diff_seconds
                        tup_inserted = (comp_db_stats['tup_inserted'] - previous['tup_inserted'])/diff_seconds
                        tup_updated = (comp_db_stats['tup_updated'] - previous['tup_updated'])/diff_seconds
                        tup_deleted = (comp_db_stats['tup_deleted'] - previous['tup_deleted'])/diff_seconds
                        self.previous_db_stats[pg_comp]['tup_fetched'] = comp_db_stats['tup_fetched']
                        self.previous_db_stats[pg_comp]['tup_inserted'] = comp_db_stats['tup_inserted']
                        self.previous_db_stats[pg_comp]['tup_updated'] = comp_db_stats['tup_updated']
                        self.previous_db_stats[pg_comp]['tup_deleted'] = comp_db_stats['tup_deleted']
                        self.previous_db_stats[pg_comp]['timestamp'] = stats_timestamp
                        comp_db_stats['tup_fetched'] = int(round(tup_fetched))
                        comp_db_stats['tup_inserted'] = int(round(tup_inserted))
                        comp_db_stats['tup_updated'] = int(round(tup_updated))
                        comp_db_stats['tup_deleted'] = int(round(tup_deleted))
                        comp_db_stats['connections'] = {}
                        for conn in connections:
                            comp_db_stats['connections'][str(conn['state'])] = conn['count']
                        self.db_stats[pg_comp].append(comp_db_stats)
                        self.latest_db_stats[pg_comp] = comp_db_stats
                        pass
                    else:
                        self.db_stats[pg_comp] = []
                        self.previous_db_stats[pg_comp] = {}
                        self.previous_db_stats[pg_comp]['xact_commit'] = comp_db_stats['xact_commit']
                        self.previous_db_stats[pg_comp]['xact_rollback'] = comp_db_stats['xact_rollback']
                        self.previous_db_stats[pg_comp]['tup_fetched'] = comp_db_stats['tup_fetched']
                        self.previous_db_stats[pg_comp]['tup_inserted'] = comp_db_stats['tup_inserted']
                        self.previous_db_stats[pg_comp]['tup_updated'] = comp_db_stats['tup_updated']
                        self.previous_db_stats[pg_comp]['tup_deleted'] = comp_db_stats['tup_deleted']
                        self.previous_db_stats[pg_comp]['timestamp'] = stats_timestamp
                except Exception as e:
                    pass
            connL.close()

        except sqlite3.Error as e:
            print str(e)

    @inlineCallbacks
    def initial_dbstats_data(self, comp):
        if comp in self.db_stats:
            stats = dict()
            stats['component'] = comp
            stats['stats'] = self.db_stats[comp]
            yield self.session.publish('com.bigsql.initdbstats', stats)

    @inlineCallbacks
    def live_dbstats_data(self, comp):
        if comp in self.latest_db_stats:
            stats = dict()
            stats['component'] = comp
            stats['stats'] = self.latest_db_stats[comp]
            yield self.session.publish('com.bigsql.dbstats', stats)

    @inlineCallbacks
    def activity(self, comp):
        """
        Method to get the activity of component.
        :return: It yields json string.
        """
        stats = dict()
        stats['component'] = comp
        if comp in self.db_activity:
            data = self.db_activity[comp]
            del self.db_activity[comp]
            stats['activity'] = data
        else:
            stats['activity'] = []
        yield self.session.publish('com.bigsql.onActivity', stats)

    @inlineCallbacks
    def db_list(self, comp):
        """
        Method to get the list of database available in cluster.
        :return: It yields json string.
        """
        result = dict()
        result['component'] = comp
        port = util.get_column('port', comp)
        try:
            if comp in self.pgpassfiles:
                os.environ['PGPASSFILE'] = self.pgpassfiles[comp]
            else:
                util.read_env_file(comp)
                self.pgpassfiles[comp] = os.environ['PGPASSFILE']
            pg = PgInstance("localhost", "postgres", "postgres", int(port))
            pg.connect()
            database_list = pg.get_database_list()
            pg.close()
            result['list'] = database_list
        except Exception as e:
            result['error'] = "Unable to establish connection to {0} :{1}".format(comp,str(e))
            pass
        yield self.session.publish('com.bigsql.ondblist', result)

    @inlineCallbacks
    def pg_settings(self, comp):
        """
        Method to get the settings of cluster.
        :return: It yields json string.
        """
        result = dict()
        result['component'] = comp
        port = util.get_column('port', comp)
        try:
            if comp in self.pgpassfiles:
                os.environ['PGPASSFILE'] = self.pgpassfiles[comp]
            else:
                util.read_env_file(comp)
                self.pgpassfiles[comp] = os.environ['PGPASSFILE']
            pg = PgInstance("localhost", "postgres", "postgres", int(port))
            pg.connect()
            settings_list = pg.get_pg_settings()
            pg.close()
            import itertools
            final_list = []
            for key, group in itertools.groupby(settings_list, key=lambda x:x['category']):
                final_list.append({'name':str(key), 'settings': list(group)})
            result['list'] = final_list
        except Exception as e:
            pass
        yield self.session.publish('com.bigsql.onPGsettings', result)

    @inlineCallbacks
    def read_pg_hba_conf(self, comp):
        result = dict()
        result['component'] = comp
        try:
            connL = sqlite3.connect(db_local)
            c = connL.cursor()
            sql = "SELECT datadir" + \
                  "  FROM components " + \
                  " WHERE project='pg' AND component = '" + comp + "'"
            c.execute(sql)
            t_comp = c.fetchone()
            connL.close()

            if t_comp and t_comp[0]:
                hba_conf_file = os.path.join(t_comp[0], 'pg_hba.conf')
                if os.path.exists(hba_conf_file):
                    try:
                        with open(hba_conf_file, 'r') as pg_hba_file:
                            hba_file_content = pg_hba_file.read()
                            result['file'] = hba_conf_file
                            result['contents'] = hba_file_content
                    except Exception as e:
                        pass

        except sqlite3.Error as e:
            print str(e)
            pass

        yield self.session.publish('com.bigsql.onPGhba', result)

    @inlineCallbacks
    def checkExtension(self, database, comp, extension):
        """
        Method to get the list of database available in cluster.
        :return: It yields json string.
        """
        result = dict()
        result['component'] = comp
        port = util.get_column('port', comp)
        try:
            if comp in self.pgpassfiles:
                os.environ['PGPASSFILE'] = self.pgpassfiles[comp]
            else:
                util.read_env_file(comp)
                self.pgpassfiles[comp] = os.environ['PGPASSFILE']
            pg = PgInstance("localhost", "postgres", database, int(port))
            pg.connect()
            is_extension_installed = pg.is_extension_installed(extension)
            pg.close()
            result['status'] = is_extension_installed
        except Exception as e:
            pass
        yield self.session.publish('com.bigsql.onCheckExtension', result)

    @inlineCallbacks
    def createExtension(self, database, comp, extension):
        """
        Method to get the list of database available in cluster.
        :return: It yields json string.
        """
        result = dict()
        result['component'] = comp
        port = util.get_column('port', comp)
        try:
            if comp in self.pgpassfiles:
                os.environ['PGPASSFILE'] = self.pgpassfiles[comp]
            else:
                util.read_env_file(comp)
                self.pgpassfiles[comp] = os.environ['PGPASSFILE']
            pg = PgInstance("localhost", "postgres", database, int(port))
            pg.connect()
            create_extension = pg.create_extension(extension)
            pg.close()
            result['status'] = create_extension
        except Exception as e:
            pass
        yield self.session.publish('com.bigsql.onCreateExtension', result)

