####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

import os
import platform

from twisted.internet.defer import inlineCallbacks, returnValue
from autobahn.twisted.util import sleep
from autobahn.twisted.wamp import ApplicationSession

import sys
import sqlite3
import json
from datetime import datetime

PGC_HOME = os.getenv("PGC_HOME", "")
PGC_LOGS = os.getenv("PGC_LOGS", "")

pgc_scripts_path = os.path.join(PGC_HOME, 'hub', 'scripts')
if pgc_scripts_path not in sys.path:
    sys.path.append(pgc_scripts_path)

pgclib_scripts_path = os.path.join(PGC_HOME, 'hub', 'scripts', 'lib')
if pgclib_scripts_path not in sys.path:
    sys.path.append(pgclib_scripts_path)

import util

this_uname = str(platform.system())

if this_uname == "Darwin":
    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib', 'osx'))
elif this_uname == "Linux":
    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib', 'linux'))


current_path = os.path.dirname(os.path.realpath(__file__))

reports_path = os.path.join(current_path, "reports")

db_local = PGC_HOME + os.sep + "conf" + os.sep + "pgc_local.db"


class Reporting(object):
    """
    This class exposes all the actions for the components in the methods defined.
    """

    def __init__(self, appsession=ApplicationSession):
        self.session = appsession

    def get_process_status(self, process_log_dir):
        process_dict = {}
        status_file = os.path.join(process_log_dir,"status")
        if os.path.exists(status_file):
            with open(status_file) as data_file:
                data = json.load(data_file)
                process_dict['exit_code'] = data.get("exit_code", None)
                process_dict['pid'] = data.get("pid")

        return process_dict

    @inlineCallbacks
    def generate_profiler_reports(self, hostname="localhost", username="postgres",
                                  port=5432, database="", password="", queries="",
                                  report_title="", report_desc="",
                                  action=None, comp=None):
        if comp:
            util.read_env_file(comp)
            username = os.environ.get("PGUSER")
            port = os.environ.get("PGPORT")

        result = {}
        result['action'] = action
        try:
            from ProfilerReport import ProfilerReport
            args = {}
            args['pgPass'] = password
            args['hostName'] = hostname
            args['pgDB'] = database
            args['pgUser'] = username
            args['pgPort'] = port

            plReport = ProfilerReport(args)
            report_file = ""

            result['error'] = 0
            if action=="enable":
                plReport.enableProfiler()
                result['msg'] = "Global profiling statistics has been enabled. Execute a PL/pgSQL workload before viewing the report."
            elif action=="disable":
                plReport.disableProfiler()
                result['msg'] = "Global profiling statistics has been disabled."
            elif action=="check":
                is_enabled=plReport.is_enabled()
                result['enabled']=is_enabled
                if is_enabled:
                    result['status'] = 'enabled'
                else:
                    result['status'] = 'disabled'
            elif action=="reset":
                plReport.resetSharedData()
                result['msg'] = "Global profiling statistics reset."
            elif action=="profile_query":
                report_file = plReport.generateQueryReports(queries,
                                                          report_title,
                                                          report_desc)
            elif action=="generate":
                if plReport.has_data():
                    report_file = plReport.generateGlobalReports(
                        report_title, report_desc)
                else:
                    result['error'] = 1
                    result['msg'] = "No profiling statistics available."
                    if not plReport.is_enabled():
                        result['msg'] = "Profiler is not enabled."

            result['report_file'] = report_file

        except Exception as e:
            import traceback
            print traceback.format_exc()
            print e
            result = {}
            result['error'] = 1
            result['msg'] = str(e)
        yield self.session.publish('com.bigsql.profilerReports', result)

    @inlineCallbacks
    def generate_badger_reports(self, log_files, db=None, jobs=None, log_prefix=None, title=None):
        result = {}
        try:
            from BadgerReport import BadgerReport
            badgerRpts = BadgerReport()
            report_file = badgerRpts.generateReports(log_files, db, jobs, log_prefix, title)
            process_log_dir = report_file['log_dir']
            report_status=self.get_process_status(process_log_dir)
            result['pid'] = report_status.get('pid')
            result['exit_code'] = report_status.get('exit_code')
            if report_status.get('exit_code') is None:
                result['in_progress'] =  True
            if report_file['error']:
                result['error'] = 1
                result['msg'] = report_file['error']
            else:
                result['error'] = 0
                result['report_file'] = report_file['file']
                report_file_path=os.path.join(reports_path,report_file['file'])
                if not os.path.exists(report_file_path):
                    result['error'] = 1
                    result['msg'] = "Check the parameters provided."
        except Exception as e:
            import traceback
            print traceback.format_exc()
            print e
            result = {}
            result['error'] = 1
            result['msg'] = str(e)
        yield self.session.publish('com.bigsql.badgerReports', result)

    @inlineCallbacks
    def get_pg_log_files(self, comp):
        jsonObj = {}
        files_list = []
        connL = sqlite3.connect(db_local)
        jsonDict = {}
        jsonList = []
        try:
            c = connL.cursor()
            sql = "SELECT component, logdir" + \
                  "  FROM components " + \
                  " where logdir != '' and component='"+ comp +"' order by component desc"
            c.execute(sql)
            t_comp = c.fetchall()
            files_list = []
            connL.close()

            for comp in t_comp:
                log_dir = comp[1]
                if os.path.isdir(log_dir):
                    mtime = lambda f: os.stat(os.path.join(log_dir, f)).st_mtime
                    comp_dir_list = list(sorted(os.listdir(log_dir),
                                                key=mtime, reverse=True))
                    for d in comp_dir_list:
                        log_file_path = os.path.join(log_dir, d)
                        if not d.startswith("install") and d.endswith(".log"):
                            jsonDict['file']=d
                            jsonDict["log_file"] = log_file_path
                            file_size=os.path.getsize(log_file_path)
                            jsonDict["file_size"] = util.get_file_size(file_size)
                            jsonDict["component"] = comp[0]
                            mtime=os.stat(log_file_path).st_mtime
                            mdate=datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                            jsonDict['mtime']=mdate
                            jsonList.append(jsonDict)
                            jsonDict = {}
                            files_list.append(log_file_path)
                    files_list.append(os.path.join(log_dir, "*"))
                    #jsonDict['file']="postgresql*.log"
                    #jsonDict["log_file"] = os.path.join(log_dir, "postgresql*.log")
                    #jsonDict["component"] = comp[0]
                    #jsonList.append(jsonDict)
                    #jsonDict = {}
                jsonObj = json.dumps(jsonList)


        except sqlite3.Error, e:
            print str(e)
        yield self.session.publish('com.bigsql.log_files_list', jsonObj)

    @inlineCallbacks
    def get_log_settings(self,comp):
        try:
            result={}
            from BadgerReport import BadgerReport
            badger=BadgerReport()
            logging_settings=badger.getLoggingSettings(comp)
            result['error']=0
            result['settings']=logging_settings
            result['msg']=""
        except Exception as e:
            result={}
            result['error']=1
            result['msg']=str(e)
        yield self.session.publish('com.bigsql.logging_settings', result)

    @inlineCallbacks
    def change_log_params(self,comp, logdict):
        try:
            result={}
            from BadgerReport import BadgerReport
            badger=BadgerReport()
            change_status=badger.changeLoggingParams(comp, logdict)
            result['error']=0
            result['settings']=change_status
            result['msg']=""
        except Exception as e:
            result={}
            result['error']=1
            result['msg']=str(e)
        yield self.session.publish('com.bigsql.on_change_log_params', result)

    @inlineCallbacks
    def switch_log_file(self,comp, fileName=None):
        try:
            result={}
            from BadgerReport import BadgerReport
            badger=BadgerReport()
            switchStatus=badger.switchLogfile(comp, fileName)
            result['error']=0
            result['status']=switchStatus
            result['msg']=""
        except Exception as e:
            result={}
            result['error']=1
            result['msg']=str(e)
        yield self.session.publish('com.bigsql.onSwitchLogfile', result)