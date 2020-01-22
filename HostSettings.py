####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

import os
import subprocess
import sys

from twisted.internet.defer import inlineCallbacks, returnValue
from autobahn.twisted.util import sleep
from autobahn.twisted.wamp import ApplicationSession

PGC_HOME = os.getenv("PGC_HOME", "")
PGC_LOGS = os.getenv("PGC_LOGS", "")
sys.path.append(os.path.join(PGC_HOME, 'hub', 'scripts'))
sys.path.append(os.path.join(PGC_HOME, 'hub', 'scripts','lib'))

import util


class HostSettings(object):
    """
    This class exposes all the actions for the host settings.
    """
    def __init__(self, appsession=ApplicationSession):
        self.session = appsession

    def get_host_settings(self, p_host="localhost"):
        """
        Method to get the host settings.
        :param p_host: Name of the host to retrieve the settings.
        :return: It returns dict of settings.
        """
        columns = ['interval', 'last_update_utc', 'next_update_utc', 'unique_id']
        host_settings = util.read_hosts(p_host)
        return dict(zip(columns, host_settings))

    def update_host_settings(self, p_host, p_interval, p_unique_id):
        """
        Method to update host_settings.
        :param p_host: hostname for update settings.
        :param p_interval: interval for update.
        :param p_unique_id: unique id for the host settings.
        :return: returns true if settings updated successfully.
        """
        update_settings = util.update_hosts(p_host, p_interval, p_unique_id)
        return update_settings