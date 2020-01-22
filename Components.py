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
import sys
from collections import deque

PGC_HOME = os.getenv("PGC_HOME", "")
PGC_LOGS = os.getenv("PGC_LOGS", "")

try:
    with open(os.path.join(PGC_HOME, 'conf', 'bam_config.json'), 'r') as _file:
        BamConfigData = json.loads(_file.read())
except:
    BamConfigData = {}

pgc_scripts_path = os.path.join(PGC_HOME, 'hub', 'scripts')
if pgc_scripts_path not in sys.path:
    sys.path.append(pgc_scripts_path)

pgclib_scripts_path = os.path.join(PGC_HOME, 'hub', 'scripts', 'lib')
if pgclib_scripts_path not in sys.path:
    sys.path.append(pgclib_scripts_path)

this_uname = str(platform.system())
devops_lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.append(devops_lib_path)

import util


def process_pxpect_output(p_out, p_cmd=None):
    import re
    remaining_lines = str(p_out)
    ansi_escape = re.compile(r'(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]')
    final_lines = ansi_escape.sub("", remaining_lines)
    striped_lines = str(final_lines).strip()
    final_out = []
    try:
        final_out=json.loads(striped_lines)
    except Exception as e:
        # try with the new line
        try:
            split_lines = striped_lines.splitlines()
            final_out = json.loads(str(split_lines[-1]))
        except Exception as e:
            print ("Error : " + str(e))
            if p_cmd:
                print ("cmd : " + str(p_cmd))
            print ("Data Received : ")
            print (striped_lines)
            final_out = [{"state": "error", "msg": str(e)}]
    return final_out


class ComponentAction(object):
    """
    This class exposes all the actions for the components in the methods defined.
    """

    def __init__(self, appsession=ApplicationSession):
        self.session = appsession
        self.process = ""

    @inlineCallbacks
    def install_comp(self, comp_name, p_yes=None, host=None):
        """
        Method to install a component.
        :param comp_name: Name of the component to be installed.
        :return: It yields json string for the install process.
        """

        command_line = PGC_HOME + os.sep + "pgc --json install " + comp_name
        if p_yes:
            command_line = command_line + " -y"
        if host:
            command_line = command_line + " --host \"" + host + "\""
        process = subprocess.Popen(command_line, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        self.process = process
        for line in iter(process.stdout.readline, ''):
            ln = (line).rstrip('\n')
            self.session.publish('com.bigsql.onInstall', ln)
            yield sleep(0.001)
        self.process = ''
        returnValue(1)

    def cancelInstall(self, host=None):
        """
        Method to cancel installation of a component.
        :param pid: processid of the component to be installed.
        :return: It yields process status.
        """
        pid_file = os.path.join(os.getenv('PGC_HOME'), 'conf', 'pgc.pid')
        if os.path.isfile(pid_file):
            os.remove(pid_file)
        pgcCmd = PGC_HOME + os.sep + "pgc cancel"
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        pgcData = pgcProcess.communicate()

    @inlineCallbacks
    def remove_comp(self, comp_name, host=None):
        """
        Method to uninstall/remove a component.
        :param comp_name: Name of the component to be removed.
        :return: It yields json string for the remove process.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json remove " + comp_name
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        process = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        for line in iter(process.stdout.readline, ''):
            ln = (line).rstrip('\n')
            self.session.publish('com.bigsql.onRemove', ln)
            yield sleep(0.001)
        returnValue(1)

    def start(self, name, host=None):
        """
        Method to start a server component.
        :param name: Name of the component to be started.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc start " + name
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)

    def restart(self, name, host=None):
        """
        Method to restart a server component.
        :param name: Name of the component to be restared.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc restart " + name
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)

    def stop(self, name, host=None):
        """
        Method to stop a server component.
        :param name: Name of the component to be stopped.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc stop " + name
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)

    @inlineCallbacks
    def getAvailPort(self, comp, port):
        """
        Method to return server status.
        """
        if port == '':
            port = 5432
        selPort = util.get_avail_port("PG Port", port, comp)
        yield self.session.publish('com.bigsql.onPortSelect', selPort)

    @inlineCallbacks
    def serverStatus(self):
        """
        Method to return server status.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json status"
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        pgcInfo = pgcProcess.communicate()
        yield self.session.publish('com.bigsql.onServerStatus', pgcInfo[0])

    @inlineCallbacks
    def init(self, name, password, dataDir, port, host=None):
        """
        Method to initialize a server component.
        :param name: Name of the component to be initialized.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json init " + name + " --datadir " + dataDir + " --port " + port
        if port == '':
            pgcCmd = pgcCmd.split(' --port')[0]
        if dataDir == '':
            pgcCmd = pgcCmd.split(' --datadir')[0]
        if host:
            pgc_host_info = util.get_pgc_host(host)
            cred_info = util.get_credentials_by_uuid(pgc_host_info.get('ssh_cred_id'))
            enc_secret = util.get_value("GLOBAL", "SECRET", "")
            enc_key = "{0}{1}".format(enc_secret, cred_info.get("cred_uuid"))
            ssh_username = cred_info.get("ssh_user")
            password= ""
            if cred_info.get("ssh_passwd"):
                password = util.decrypt(cred_info.get("ssh_passwd"),enc_key)
            ssh_key = ""
            if cred_info.get("ssh_key"):
                ssh_key = util.decrypt(cred_info.get("ssh_key"), enc_key)
            sudo_pwd = ""
            if cred_info.get("ssh_sudo_pwd"):
                sudo_pwd = util.decrypt(cred_info.get("ssh_sudo_pwd"), enc_key)
            ssh_host = pgc_host_info.get('host')
            from PgcRemote import PgcRemote
            remote = PgcRemote(ssh_host, ssh_username, password=password, ssh_key=ssh_key)
            remote.connect()
            is_file_added = remote.add_file('/tmp/.pgpass', password)
            remote.disconnect()
            pgcCmd = pgcCmd + " --pwfile /tmp/.pgpass --host \"" + host + "\""
        if util.is_postgres(name) and not host:
            pgpass_file = PGC_HOME + os.sep + name + os.sep + ".pgpass"
            if not os.path.isfile(pgpass_file):
                password_file = open(pgpass_file, 'w')
                password_file.write(password + '\n')
                password_file.close()
                os.chmod(pgpass_file, 0600)
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        for line in iter(pgcProcess.stdout.readline, ''):
            try:
                ln = (line).rstrip('\n')
                if type(eval(ln)) is list:
                    yield self.session.publish('com.bigsql.onInit', ln)
            except:
                pass

    @inlineCallbacks
    def update(self, name, host=None):
        """
        Method to upgrade a component from installed version to is_current version.
        :param name: Name of the component to be upgraded.
        :return: It yields json string for the upgrade process.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json upgrade -y "
        if name:
            pgcCmd = pgcCmd + name
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        process = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        self.process = process
        for line in iter(process.stdout.readline, ''):
            ln = (line).rstrip('\n')
            self.session.publish('com.bigsql.onInstall', ln)
            yield sleep(0.001)
        self.process = ''

    @inlineCallbacks
    def updatesCheck(self, host=None):
        """
        Method to check for updates to all components
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json update"
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        for line in iter(pgcProcess.stdout.readline, ''):
            ln = (line).rstrip('\n')
            self.session.publish('com.bigsql.onUpdatesCheck', ln)
            yield sleep(0.001)

    @inlineCallbacks
    def registerHost(self, hostName, pgcDir, name, cred_name, update=None):
        """
        Method to Register remote host
        """
        if this_uname != "Windows":
            os.environ["PYTHONPATH"] = devops_lib_path
        pgcCmd = PGC_HOME + os.sep + "pgc register --json HOST \"" + hostName + "\" \"" + pgcDir + "\" \"" + name + "\""
        # if password:
        #     pgcCmd = pgcCmd + " --pwd=\"" + password + "\""
        # if key:
        #     pgcCmd = pgcCmd + " --key=\"" + key + "\""
        # if sudo_pwd:
        #     pgcCmd = pgcCmd + " --sudo_pwd=\"" + sudo_pwd + "\""
        if cred_name:
            pgcCmd = pgcCmd + " --cred_name=\"" + cred_name + "\""
        if update:
            pgcCmd = pgcCmd + " --update=" + str(update)
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        for line in iter(pgcProcess.stdout.readline, ''):
            try:
                ln = (line).rstrip('\n')
                if type(eval(ln)) is list:
                    self.session.publish('com.bigsql.onRegisterHost', ln)
                yield sleep(0.001)
            except Exception as e:
                pass

    @inlineCallbacks
    def deleteHost(self, hostName):
        """
        Method to unregister remote host
        """
        pgcCmd = PGC_HOME + os.sep + "pgc unregister --json HOST  \"" + hostName + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        pgcData = pgcProcess.communicate()
        yield self.session.publish('com.bigsql.onDeleteHost', pgcData)

    @inlineCallbacks
    def registerServerGroup(self, name, hosts):
        """
        Method to register server group
        """
        pgcCmd = PGC_HOME + os.sep + "pgc register GROUP --json \"" + name + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        pgcData = pgcProcess.communicate()
        yield self.session.publish('com.bigsql.onRegisterServerGroup', pgcData)
        import util
        util.map_group_hosts(name, hosts, p_group_id=0, isJson=False, printMsg=False)

    def updateServerGroup(self, name, hosts, group_id):
        """
        Method to register server group
        """
        import util
        util.register_group(name, p_parent_group=0, p_group_id=group_id, isJson=False, printMsg=False)
        util.map_group_hosts(name, hosts, p_group_id=group_id, isJson=False, printMsg=False)

    @inlineCallbacks
    def deleteGroup(self, group):
        """
        Method to unregister remote host
        """
        pgcCmd = PGC_HOME + os.sep + "pgc unregister --json GROUP \"" + group + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        pgcData = pgcProcess.communicate()
        yield self.session.publish('com.bigsql.onDeleteGroup', pgcData)


class Components(ComponentAction):
    """
    This class is abstract class for ComponentAction which exposes
    component information with the methods defined.
    """

    @inlineCallbacks
    def list(self):
        """
        Method to get the list of components available.
        :return: It yields json string for the list of components.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json list"
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        pgcInfo = pgcProcess.communicate()
        yield self.session.publish('com.bigsql.onList', pgcInfo)

    @inlineCallbacks
    def getBamConfig(self, setting):
        """
        Method to get the configuration of bam.
        Method to get test list setting of bam.
        :return: It yields json string.
        """
        yield self.session.publish('com.bigsql.onGetBamConfig', BamConfigData.get(setting))

    def setBamConfig(self, setting, option):
        """
        Method to set the configuration of bam.
        Method to set the test list setting of bam.
        :return: It yields json string.
        """
        with open(os.path.join(PGC_HOME, 'conf', 'bam_config.json'), 'w') as _file:
            json.dump({setting: option}, _file)
        BamConfigData[setting] = option

    @inlineCallbacks
    def getSetting(self, setting, host=None):
        """
        Method to get test list setting of bam.
        :return: It yields json string.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc get GLOBAL " + setting
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        data = pgcProcess.communicate()
        yield self.session.publish('com.bigsql.onGetSetting', data[0].strip('\n'))

    def setSetting(self, setting, val, host):
        """
        Method to set the test list setting of bam.
        :return: It yields json string.
        """
        # util.set_value("GLOBAL", "STAGE", val)
        pgcCmd = PGC_HOME + os.sep + "pgc set GLOBAL " + setting +  " " + val
        if host != '' and host != 'localhost':
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        data = pgcProcess.communicate()

    @inlineCallbacks
    def getBetaFeatureSetting(self, settingName):
        """
        Method to get test list setting of bam.
        :return: It yields json string.
        """
        yield self.session.publish('com.bigsql.onGetBeataFeatureSetting',
                                   {'setting': settingName, 'value': util.get_value("BETA", settingName)})

    def setBetaFeatureSetting(self, settingName, val):
        """
        Method to set the test list setting of bam.
        :return: It yields json string.
        """
        util.set_value("BETA", settingName, val)

    def setLabSetting(self, setting, value, host=None):
        """
        Method to set the lab setting of pgdevops.
        """
        if value == 'on':
            pgcCmd = PGC_HOME + os.sep + "pgc set labs " + setting + " " + value
        else:
            pgcCmd = PGC_HOME + os.sep + "pgc unset labs " + setting
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        data = pgcProcess.communicate()

    @inlineCallbacks
    def instancesList(self, instance, email, region=None, cloud = None):
        """
        Method to get the rds instances list
        """
        pgcCmd = PGC_HOME + os.sep + "pgc instances --json " + instance
        if region:
            pgcCmd = pgcCmd + " --region " + region
        if email:
            pgcCmd = pgcCmd + " --email " + email
        if cloud:
            pgcCmd = pgcCmd + ' --cloud "' + cloud +'"'
        process = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        self.process = process
        for line in iter(process.stdout.readline, ''):
            ln = (line).rstrip('\n')
            self.session.publish('com.bigsql.onInstancesList', ln)
            yield sleep(0.001)
        self.process = ''
        returnValue(1)

    @inlineCallbacks
    def rdsInfo(self, region, instance, cloud = None):
        """
        Method to get rds Instance Info
        """
        pgcCmd = PGC_HOME + os.sep + "pgc dblist db --json  --region " + region + " --instance " + instance
        if cloud:
            pgcCmd = pgcCmd + " --cloud " + cloud
        process = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        self.process = process
        for line in iter(process.stdout.readline, ''):
            ln = (line).rstrip('\n')
            self.session.publish('com.bigsql.onRdsInfo', ln)
            yield sleep(0.001)
        self.process = ''
        returnValue(1)

    @inlineCallbacks
    def rdsMetaList(self, _type, instance=None, region=None, version=None, cloud = None, instance_type = None):
        """
        Method to get rds Instance Info
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json metalist"
        if _type:
            pgcCmd = pgcCmd + " "+_type
        if instance:
            pgcCmd =  pgcCmd + " --instance " + instance
        if region:
            pgcCmd = pgcCmd + " --region=" + region
        if version:
            pgcCmd = pgcCmd + " --version=" + version
        if cloud:
            pgcCmd = pgcCmd + " --cloud " + cloud
        if instance_type:
            pgcCmd = pgcCmd + " --type " + instance_type
        process = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        data = process.communicate()
        yield self.session.publish('com.bigsql.onRdsMetaList', data[0].strip('\n'))

    @inlineCallbacks
    def createInstance(self, _type, cloud, json_obj):
        """
        Method to get rds Instance Info
        """
        new_json_obj = json.dumps(json_obj)
        pgcCmd = PGC_HOME + os.sep +"pgc --json create " + _type + " --params  \'"+ str(new_json_obj) + " \' --cloud " + cloud
        process = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        data = process.communicate()
        yield self.session.publish('com.bigsql.onCreateInstance', data[0].strip('\n'))

    @inlineCallbacks
    def dbtune(self, email, comp):
        """
        Method to get postgres Instance dbtune result set
        """
        pgcCmd = PGC_HOME + os.sep + "pgc dbtune --json " + comp + " --email " + email
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell = True)
        data = pgcProcess.communicate()
        yield self.session.publish('com.bigsql.onDbTune', data[0].strip('\n'))

    @inlineCallbacks
    def pgList(self, mail):
        """
        Method to get the pglist 
        """
        pgcCmd = PGC_HOME + os.sep + "pgc dblist pg --json --email " + mail
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell = True)
        data = pgcProcess.communicate()
        yield self.session.publish('com.bigsql.onPgList', data[0].strip('\n'))

    @inlineCallbacks
    def selectedLog(self, logdir):
        """
        Method to tail the last 1000 lines from the PGC_LOGS to display default.
        :return: It yields the log lines.
        """
        if logdir == None:
            yield self.session.publish('com.bigsql.logError', "Log file does not exist")
        else:
            if logdir == 'pgcli':
                logdir = PGC_LOGS
            self.session.publish('com.bigsql.pgcliDir', logdir)
            try:
                read_file = open(logdir)
                _lines = deque(read_file, 1000)
                lines_out = "<br/>".join(_lines)
                yield self.session.publish('com.bigsql.log', lines_out)
            except Exception as e:
                pass

    @inlineCallbacks
    def autostart(self, val, name, host=None):
        """
        Method to set the autostart configuration.
        :return: It yields the message.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json config " + name + " --autostart=" + val
        if host:
            pgcCmd = pgcCmd + " --host \"" + host + "\""
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        for line in iter(pgcProcess.stdout.readline, ''):
            try:
                ln = (line).rstrip('\n')
                if type(eval(ln)) is list:
                    yield self.session.publish('com.bigsql.onAutostart', ln)
            except:
                pass

    @inlineCallbacks
    def logIntLines(self, number, logdir):
        """
        Method to tail the selected number of lines from the selected log.
        :return: It yields the log lines.
        """
        if logdir == None:
            yield self.session.publish('com.bigsql.logError', "Log file does not exist")
        else:
            if logdir == 'pgcli':
                logdir = PGC_LOGS
            try:
                read_file = open(logdir)
                _lines = deque(read_file, number)
                lines_out = "<br/>".join(_lines)
                yield self.session.publish('com.bigsql.log', lines_out)
            except Exception as e:
                pass

    @inlineCallbacks
    def liveLog(self, logdir):
        """
        Method to tail  log lines for every 5 seconds.
        :return: It yields the log lines.
        """
        if logdir == None:
            pass
        else:
            if logdir == 'pgcli':
                logdir = PGC_LOGS
            log_file = Pygtail(logdir)
            ln = log_file.readlines()
            if ln:
                for log_line in ln:
                    yield self.session.publish('com.bigsql.log', log_line)

    @inlineCallbacks
    def checkLogdir(self):
        import sqlite3, json
        db_local = PGC_HOME + os.sep + "conf" + os.sep + "pgc_local.db"
        connL = sqlite3.connect(db_local)
        try:
            c = connL.cursor()
            sql = "SELECT component, logdir" + \
                  "  FROM components " + \
                  " where logdir != ''"
            c.execute(sql)
            t_comp = c.fetchall()
            connL.close()
            jsonDict = {}
            jsonList = []

            for comp in t_comp:
                jsonDict["component"] = str(comp[0])
                jsonList.append(jsonDict)
                jsonDict = {}

            jsonObj = json.dumps(jsonList)

        except sqlite3.Error, e:
            print str(e)
        yield self.session.publish('com.bigsql.onCheckLogdir', jsonObj)

    def isInstalled(self, comp):
        """
        Method to check if the component installed.
        :param comp: Name of the component to get the info.
        :return: It yields the json string for component info.
        """
        info_data = Components.get_info(comp)
        return info_data

    @inlineCallbacks
    def info(self):
        """
        Method to get the system info.
        :return: It yields the json string for system info.
        """
        info_data = Components.get_info()
        yield self.session.publish('com.bigsql.onInfo', info_data)

    @inlineCallbacks
    def infoComponent(self, comp):
        """
        Method to get the component information.
        :param comp: Name of the component to get the info.
        :return: It yields the json string for component info.
        """
        info_data = Components.get_info(comp)
        yield self.session.publish('com.bigsql.onInfoComponent', info_data)

    @staticmethod
    def get_info(comp=None):
        """
        Method to get the system/component information.
        :param comp: Name of the component to get the info.
        :return: It returns the json string for component info if provided else system info.
        """
        p_comp = comp
        if comp is None:
            p_comp = ""
        pgcCmd = PGC_HOME + os.sep + "pgc --json info " + p_comp
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        data = pgcProcess.communicate()
        return data

    @inlineCallbacks
    def checkOS(self):
        """
        Method to get the machine OS information.
        :return: It yields the platform.
        """
        yield self.session.publish('com.bigsql.onCheckOS', platform.system())

    @staticmethod
    def get_cmd_data(command):
        pgcCmd = PGC_HOME + os.sep + "pgc --json " + command
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell=True)
        data = pgcProcess.communicate()
        return process_pxpect_output(data[0].strip())

    @staticmethod
    def get_data(command, component=None, pgc_host=None, pwfile=None, relnotes=None, pwd=None):
        """
        Method to get the host settings.
        :param p_host: Name of the host to retrieve the settings.
        :return: It returns dict of settings.
        """
        std_in = None

        pgcCmd = PGC_HOME + os.sep + "pgc --json " + command
        if relnotes:
            pgcCmd = pgcCmd + " --relnotes"
        if component:
            pgcCmd = pgcCmd + " " + component
        if pgc_host:
            if pwfile:
                pgcCmd = pgcCmd + " --pwfile " + pwfile + " --host \"" + pgc_host + "\""
            else:
                pgcCmd = pgcCmd + " --host \"" + pgc_host + "\""  # + " --no-tty"
        if pwd:
            std_in = subprocess.PIPE
        else:
            pgcCmd = pgcCmd + " --no-tty"
        tty_msgs = ("sudo: no tty present and no askpass program specified",
                    "sudo: sorry, you must have a tty to run sudo")
        auth_err = {"state": "error",
                    "msg": "Failed to authenticate with password provided.",
                    "pwd_failed": True,
                    "cmd": pgcCmd}
        pwd_required = {"state": "error",
                        "msg": "Password required",
                        "cmd": pgcCmd}
        if this_uname=="Linux" and pgcCmd.find("repolist")>=0 and not pgc_host:
            import pexpect
            try:
                pprocess = pexpect.spawn(pgcCmd)
                try:
                    pwd_promp = pprocess.expect("password",2)
                except pexpect.exceptions.TIMEOUT as e:
                    pwd_promp = -1
                except pexpect.EOF as e:
                    return process_pxpect_output(pprocess.before, pgcCmd)
                line_str=""
                if pwd_promp>=0:
                    if not pwd:
                        pprocess.terminate()
                    else:
                        pprocess.sendline(pwd)
                        line1=pprocess.readline().strip()
                        line_out=pprocess.readline().strip()
                        if line_out.find("Sorry, try again")>=0:
                            pprocess.terminate()
                            return [auth_err]
                        elif line_out.find("is not in the sudoers file")>=0:
                            pprocess.terminate()
                            return [auth_err]
                        else:
                            line_str=line_out
                            remaining_lines = pprocess.readlines()
                            for ln in remaining_lines:
                                line_str = line_str + ln.strip()
                            return process_pxpect_output(line_str, pgcCmd)
                    return [pwd_required]
                else:
                    remaining_lines = pprocess.readlines()
                    print (remaining_lines)
                    for ln in remaining_lines:
                        line_str = line_str + ln.strip()
                    return process_pxpect_output(line_str, pgcCmd)
                pprocess.terminate()
                return [auth_err]
            except Exception as e:
                print str(e)
                return [auth_err]
        pgcProcess = subprocess.Popen(pgcCmd,
                                      stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE,
                                      shell=True,
                                      stdin=std_in)
        line = ""
        for c in iter(lambda: pgcProcess.stdout.read(1), ''):
            line = line + c
            if pgcCmd.find("lablist") < 0 and pgcCmd.find("relnotes") < 0 and line.find("sudo") >= 0 \
                    and line.find("password") >= 0 and line.endswith(":"):
                if pwd and std_in:
                    pgcProcess.stdin.write(pwd + str(os.linesep))
                    pgcProcess.stdin.flush()
                    line = ""
                else:
                    util.kill_process_tree(pgcProcess.pid)
                    return [pwd_required]
            elif line.find("Sorry, try again.") >= 0:
                util.kill_process_tree(pgcProcess.pid)
                return [auth_err]
            elif line.find("is not in the sudoers file")>=0:
                util.kill_process_tree(pgcProcess.pid)
                return [auth_err]
            elif line.find(tty_msgs[0]) >= 0 or line.find(tty_msgs[1]) >= 0:
                util.kill_process_tree(pgcProcess.pid)
                return [pwd_required]
        pgcInfo = line
        for tty_msg in tty_msgs:
            pgcInfo = pgcInfo.replace(tty_msg, "").strip()
        final_data = pgcInfo.strip()
        return process_pxpect_output(final_data, pgcCmd)

    @staticmethod
    def get_pgdg_data(repo_id, command, component=None, pgc_host=None, pwd=None):
        """
        Method to get the host settings.
        :param p_host: Name of the host to retrieve the settings.
        :return: It returns dict of settings.
        """
        std_in = None
        pgcCmd = PGC_HOME + os.sep + "pgc --json repo-pkgs " + repo_id + " " + command + " -y"
        if command == 'register':
            pgcCmd = PGC_HOME + os.sep + "pgc --json register REPO " + repo_id + " -y"
        if component:
            pgcCmd = pgcCmd + " " + component
        if pgc_host:
            pgcCmd = pgcCmd + " --host \"" + pgc_host + "\""

        if pwd:
            std_in = subprocess.PIPE
        else:
            pgcCmd = pgcCmd + " --no-tty"
        tty_msgs = ("sudo: no tty present and no askpass program specified",
                    "sudo: sorry, you must have a tty to run sudo")
        auth_err = {"state": "error",
                    "msg": "Failed to authenticate with password provided.",
                    "pwd_failed": True,
                    "cmd": pgcCmd}
        pwd_required = {"state": "error",
                        "msg": "Password required",
                        "cmd": pgcCmd}
        if this_uname=="Linux" and not pgc_host:
            import pexpect
            try:
                pprocess = pexpect.spawn(pgcCmd)
                try:
                    pwd_promp = pprocess.expect("password", 5)
                except pexpect.exceptions.TIMEOUT as e:
                    pwd_promp = -1
                except pexpect.EOF as e:
                    return process_pxpect_output(pprocess.before, pgcCmd)
                line_str=""
                if pwd_promp>=0:
                    if not pwd:
                        pprocess.terminate()
                    else:
                        pprocess.sendline(pwd)
                        line1=pprocess.readline().strip()
                        line_out=pprocess.readline().strip()
                        if line_out.find("Sorry, try again")>=0:
                            pprocess.terminate()
                            return [auth_err]
                        elif line_out.find("is not in the sudoers file")>=0:
                            pprocess.terminate()
                            return [auth_err]
                        else:
                            line_str=line_out
                            remaining_lines = pprocess.readlines()
                            for ln in remaining_lines:
                                line_str = line_str + ln.strip()
                            return process_pxpect_output(line_str, pgcCmd)
                    return [pwd_required]
                else:
                    remaining_lines = pprocess.readlines()
                    for ln in remaining_lines:
                        line_str = line_str + ln.strip()
                    return process_pxpect_output(line_str, pgcCmd)
                pprocess.terminate()
                return [auth_err]
            except Exception as e:
                print str(e)
                return [auth_err]
        pgcProcess = subprocess.Popen(pgcCmd,
                                      stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE,
                                      shell=True,
                                      stdin=std_in)
        line = ""
        for c in iter(lambda: pgcProcess.stdout.read(1), ''):
            line = line + c
            if line.find("sudo") >= 0 and line.find("password") >= 0 and line.endswith(":"):
                if pwd and std_in:
                    pgcProcess.stdin.write(pwd + str(os.linesep))
                    pgcProcess.stdin.flush()
                    line = ""
                else:
                    util.kill_process_tree(pgcProcess.pid)
                    return [pwd_required]
            elif line.find("Sorry, try again.") >= 0:
                util.kill_process_tree(pgcProcess.pid)
                return [auth_err]
            elif line.find("is not in the sudoers file") >= 0:
                util.kill_process_tree(pgcProcess.pid)
                return [auth_err]
            elif line.find(tty_msgs[0]) >= 0 or line.find(tty_msgs[1]) >= 0:
                util.kill_process_tree(pgcProcess.pid)
                return [pwd_required]
        pgcInfo = line
        for tty_msg in tty_msgs:
            pgcInfo = pgcInfo.replace(tty_msg, "").strip()
        final_data = pgcInfo.strip()
        return process_pxpect_output(final_data, pgcCmd)
