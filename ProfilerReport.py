####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

import os
import platform
import plprofiler
import StringIO
from datetime import datetime
import re
import time

current_path = os.path.dirname(os.path.realpath(__file__))

reports_path = os.path.join(current_path, "reports")

if not os.path.exists(reports_path):
    os.mkdir(reports_path)


profiler_reports_path = os.path.join(reports_path, "profiler")

if not os.path.exists(profiler_reports_path):
    os.mkdir(profiler_reports_path)

this_uname = str(platform.system())

PGC_HOME = os.getenv("PGC_HOME", "")

perl_path = os.path.join(PGC_HOME, "perl5", "perl", "bin")

path_env = os.environ.get("PATH")

if this_uname == "Windows" and perl_path not in path_env:
    os.environ['PATH'] = path_env + ";" + perl_path + ";"


class ProfilerReport(object):
    def __init__(self, *args, **kwargs):
        profiler_args = args[0]
        self.prof = plprofiler.plprofiler()
        if profiler_args['pgPass']:
            os.environ['PGPASSWORD'] = profiler_args['pgPass']
        self.prof.connect({'dsn': 'host={0} dbname={1} user={2} port={3}'.format(
            profiler_args['hostName'], profiler_args['pgDB'],
            profiler_args['pgUser'], profiler_args['pgPort']
        )})

        if "PGPASSWORD" in os.environ.keys():
            del os.environ['PGPASSWORD']

    def enableProfiler(self):
        self.prof.enable_monitor()

    def disableProfiler(self):
        self.prof.disable_monitor()

    def resetSharedData(self):
        self.prof.reset_shared()

    def is_installed(self):
        check_query = "select extname,extversion from pg_extension where extname='plprofiler'"

        cur = self.prof.dbconn.cursor()
        cur.execute(check_query)
        row = cur.fetchone()
        if row:
            return True
        return False

    def is_enabled(self):
        check_query = "select name,setting from pg_settings where name='plprofiler.enabled'"

        cur = self.prof.dbconn.cursor()
        cur.execute(check_query)
        row = cur.fetchone()
        if row is None:
            pass
        else:
            if row[1] == "on":
                return True
            else:
                return False
        return False

    def has_data(self):
        query = "select * from pl_profiler_callgraph_shared()"

        cur = self.prof.dbconn.cursor()
        cur.execute(query)
        if cur.rowcount==0:
            return False
        return True

    def generateQueryReports(self, queries, title=None, desc=None):
        self.prof.enable()
        self.prof.execute_sql(queries)
        data = self.prof.get_local_report_data(title, 10, None)
        time_stamp = str(datetime.now())
        file_name = re.sub('[^A-Za-z0-9]+', '', time_stamp)
        report_file = file_name + ".html"
        data['config']['title'] = time_stamp
        if title:
            data['config']['title'] = title
            file_title=re.sub('[^A-Za-z0-9]+', '-', title)
            report_file = file_title + "-" +file_name + ".html"
        if desc:
            data['config']['desc'] = desc
        out = StringIO.StringIO()
        self.prof.report(data, out)
        html = out.getvalue()
        with open(os.path.join(profiler_reports_path, report_file), 'w') as fd:
            fd.write(html)
        return "profiler/" + report_file

    def generateGlobalReports(self, title=None, desc=None):
        data = self.prof.get_shared_report_data(title, 10, None)
        time_stamp = str(datetime.now())
        file_name = re.sub('[^A-Za-z0-9]+', '', time_stamp)
        report_file = file_name + ".html"
        data['config']['title'] = time_stamp
        if title:
            data['config']['title'] = title
            file_title=re.sub('[^A-Za-z0-9]+', '-', title)
            report_file = file_title + "-" +file_name + ".html"
        if desc:
            data['config']['desc'] = desc
        out = StringIO.StringIO()
        self.prof.report(data, out)
        html = out.getvalue()
        with open(os.path.join(profiler_reports_path, report_file), 'w') as fd:
            fd.write(html)
        return "profiler/" + report_file


    def close(self):
        self.prof.close()
