####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

import sys
import platform
import os
import re
import subprocess

from autobahn.twisted.wamp import ApplicationSession
from twisted.internet.defer import inlineCallbacks
from autobahn.twisted.util import sleep
from pygtail import Pygtail

this_uname = str(platform.system())

#if this_uname == "Darwin":
##    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib', 'osx'))
#elif this_uname == "Linux":
#    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib', 'linux'))

import psutil

if this_uname == "Windows":
    diskperf_cmd = os.getenv("SYSTEMROOT","") + os.sep + "System32" + os.sep + "diskperf -y"
    dp_res = subprocess.Popen(diskperf_cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE).communicate()


from Components import Components
from HostSettings import HostSettings
from Monitoring import Monitoring
from Reporting import Reporting

BAM_VERSION = "bam_version_number"
PGC_HOME = os.getenv("PGC_HOME", "")
PGC_LOGS = os.getenv("PGC_LOGS", "")

os.environ['PGC_ISJSON'] = "True"


class AppSession(ApplicationSession):
    """
    Abstract for ApplicationSession class to create the WAMP
    application session for this application.
    """
    @inlineCallbacks
    def onJoin(self, details):
        """
        This method registers all the procedures required for remote calling.
        """
        components = Components(self)

        hostSettings = HostSettings(self)

        monitoring = Monitoring(self)

        reporting = Reporting(self)

        self.register(monitoring.live_graphs_data, 'com.bigsql.live_graphs')

        self.register(monitoring.initial_graphs_data, 'com.bigsql.initial_graphs')

        self.register(monitoring.live_dbstats_data, 'com.bigsql.live_dbstats')

        self.register(monitoring.initial_dbstats_data, 'com.bigsql.initial_dbstats')

        self.register(monitoring.db_list, 'com.bigsql.db_list')

        self.register(monitoring.pg_settings, 'com.bigsql.pg_settings')

        self.register(monitoring.read_pg_hba_conf, 'com.bigsql.read_pg_hba_conf')

        self.register(components.install_comp, 'com.bigsql.install')

        self.register(components.remove_comp, 'com.bigsql.remove')

        self.register(components.list, 'com.bigsql.list')

        self.register(components.getBamConfig, 'com.bigsql.getBamConfig')

        self.register(components.setBamConfig, 'com.bigsql.setBamConfig')

        self.register(components.getSetting, 'com.bigsql.getSetting')

        self.register(components.setSetting, 'com.bigsql.setSetting')

        self.register(components.getBetaFeatureSetting, 'com.bigsql.getBetaFeatureSetting')

        self.register(components.setBetaFeatureSetting, 'com.bigsql.setBetaFeatureSetting')

        self.register(components.logIntLines, 'com.bigsql.logIntLines')

        self.register(components.isInstalled, 'com.bigsql.isInstalled')

        self.register(components.autostart, 'com.bigsql.autostart')

        self.register(components.info, 'com.bigsql.info')

        self.register(components.start, 'com.bigsql.start')

        self.register(components.stop, 'com.bigsql.stop')

        self.register(components.restart, 'com.bigsql.restart')

        self.register(components.serverStatus, 'com.bigsql.serverStatus')

        self.register(components.infoComponent, 'com.bigsql.infoComponent')

        self.register(components.init, 'com.bigsql.init')

        self.register(components.update, 'com.bigsql.update')

        self.register(components.updatesCheck, 'com.bigsql.updatesCheck')

        self.register(components.cancelInstall, 'com.bigsql.cancelInstall')

        self.register(hostSettings.get_host_settings, 'com.bigsql.get_host_settings')

        self.register(hostSettings.update_host_settings, 'com.bigsql.update_host_settings')

        self.register(components.selectedLog, 'com.bigsql.selectedLog')

        self.register(components.liveLog, 'com.bigsql.liveLog')

        self.register(components.checkLogdir, 'com.bigsql.checkLogdir')

        self.register(components.getAvailPort, 'com.bigsql.getAvailPort')

        self.register(components.checkOS, 'com.bigsql.checkOS')
        
        self.register(components.registerHost, 'com.bigsql.registerHost')

        self.register(components.deleteHost, 'com.bigsql.deleteHost')

        self.register(components.registerServerGroup, 'com.bigsql.registerServerGroup')

        self.register(components.deleteGroup, 'com.bigsql.deleteGroup')

        self.register(components.updateServerGroup, 'com.bigsql.updateServerGroup')

        self.register(components.setLabSetting, 'com.bigsql.setLabSetting')

        self.register(components.instancesList, 'com.bigsql.instancesList')

        self.register(components.rdsInfo, 'com.bigsql.rdsInfo')

        self.register(components.createInstance, 'com.bigsql.createInstance')

        self.register(components.rdsMetaList, 'com.bigsql.rdsMetaList')

        self.register(components.dbtune, 'com.bigsql.dbtune')

        self.register(components.pgList, 'com.bigsql.pgList')

        self.register(monitoring.activity, 'com.bigsql.activity')

        self.register(monitoring.checkExtension, 'com.bigsql.checkExtension')

        self.register(monitoring.createExtension, 'com.bigsql.createExtension')

        self.register(reporting.generate_profiler_reports, 'com.bigsql.plprofiler')

        self.register(reporting.generate_badger_reports, 'com.bigsql.pgbadger')

        self.register(reporting.get_pg_log_files, 'com.bigsql.get_log_files_list')

        self.register(reporting.get_log_settings, 'com.bigsql.get_logging_parameters')

        self.register(reporting.change_log_params, 'com.bigsql.change_log_params')

        self.register(reporting.switch_log_file, 'com.bigsql.switch_log_file')

        ## PUBLISH and CALL every second .. forever
        ##
        counter = 0
        while True:
            monitoring.save_graphs_data()
            monitoring.save_dbstats_data()

            #pgcCmd = PGC_HOME + os.sep + "pgc --json status"
            ##pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
            ##pgcInfo = pgcProcess.communicate()
            #components = pgcInfo[0]
            #pgcStatusData = re.sub("\n", "", components)
            # yield self.publish('com.bigsql.status', pgcStatusData)

            yield sleep(5)
