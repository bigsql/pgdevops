##########################################################################
#
# pgAdmin 4 - PostgreSQL Tools
#
# Copyright (C) 2013 - 2018, The pgAdmin Development Team
# This software is released under the PostgreSQL Licence
#
##########################################################################

import json
import uuid

from pgadmin.browser.server_groups.servers.databases.schemas.tests import \
    utils as schema_utils
from pgadmin.browser.server_groups.servers.databases.tests import utils as \
    database_utils
from pgadmin.browser.server_groups.servers.tests import utils as server_utils
from pgadmin.utils.route import BaseTestGenerator
from regression import parent_node_dict
from regression.python_test_utils import test_utils as utils
from . import utils as trigger_funcs_utils


class TriggerFuncPutTestCase(BaseTestGenerator):
    """ This class will update new trigger function under schema node. """
    scenarios = [
        # Fetching default URL for trigger function node.
        ('Fetch Trigger Function Node URL',
         dict(url='/browser/trigger_function/obj/'))
    ]

    def setUp(self):
        self.db_name = parent_node_dict["database"][-1]["db_name"]
        self.schema_name = parent_node_dict["schema"][-1]["schema_name"]
        self.schema_id = parent_node_dict["schema"][-1]["schema_id"]

    def runTest(self):
        """ This function will update trigger function under database node. """
        schema_info = parent_node_dict["schema"][-1]
        server_id = schema_info["server_id"]
        db_id = schema_info["db_id"]
        func_name = "test_event_put_%s" % str(uuid.uuid4())[1:8]
        server_con = server_utils.connect_server(self, server_id)
        if not server_con["info"] == "Server connected.":
            raise Exception("Could not connect to server to add resource "
                            "groups.")
        server_version = 0
        if "type" in server_con["data"]:
            if server_con["data"]["version"] < 90300:
                server_version = server_con["data"]["version"]
        self.function_info = trigger_funcs_utils.create_trigger_function(
            self.server, self.db_name, self.schema_name, func_name,
            server_version)
        db_con = database_utils.connect_database(self, utils.SERVER_GROUP,
                                                 server_id, db_id)
        if not db_con['data']["connected"]:
            raise Exception("Could not connect to database to add collation.")
        schema_response = schema_utils.verify_schemas(self.server,
                                                      self.db_name,
                                                      self.schema_name)
        if not schema_response:
            raise Exception("Could not find the schema to add the collation.")
        func_name = self.function_info[1]
        func_response = trigger_funcs_utils.verify_trigger_function(
            self.server,
            self.db_name,
            func_name)
        if not func_response:
            raise Exception("Could not find the trigger function to update"
                            " it's details.")

        trigger_func_id = self.function_info[0]
        data = {
            "description": "This is trigger function update comment",
            "id": trigger_func_id
        }

        put_response = self.tester.put(self.url + str(utils.SERVER_GROUP) +
                                       '/' + str(server_id) + '/' + str(db_id)
                                       + '/' + str(self.schema_id) + '/' +
                                       str(trigger_func_id),
                                       data=json.dumps(data),
                                       follow_redirects=True)
        self.assertEquals(put_response.status_code, 200)
        # Disconnect the database
        database_utils.disconnect_database(self, server_id, db_id)

    def tearDown(self):
        pass
