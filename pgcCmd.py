####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

import os
import subprocess
import sys
import json

from twisted.internet.defer import inlineCallbacks, returnValue
from autobahn.twisted.util import sleep
from autobahn.twisted.wamp import ApplicationSession

PGC_HOME = os.getenv("PGC_HOME", "")
PGC_LOGS = os.getenv("PGC_LOGS", "")
sys.path.append(os.path.join(PGC_HOME, 'hub', 'scripts'))
sys.path.append(os.path.join(PGC_HOME, 'hub', 'scripts','lib'))

import util


class pgcCmd(object):
    """
    This class exposes all the actions for the host settings.
    """

    @staticmethod
    def get_data(command, component=None):
        """
        Method to get the host settings.
        :param p_host: Name of the host to retrieve the settings.
        :return: It returns dict of settings.
        """
        pgcCmd = PGC_HOME + os.sep + "pgc --json " + command
        if component:
            pgcCmd = pgcCmd + " " + component
        pgcProcess = subprocess.Popen(pgcCmd, stdout=subprocess.PIPE, shell = True)
        pgcInfo = pgcProcess.communicate()
        return json.loads(pgcInfo[0])