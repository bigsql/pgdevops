##########################################################################
#
# pgAdmin 4 - PostgreSQL Tools
#
# Copyright (C) 2013 - 2018, The pgAdmin Development Team
# This software is released under the PostgreSQL Licence
#
##########################################################################

"""A blueprint module implementing the sqleditor frame."""
import simplejson as json
import os
import pickle
import random
import codecs

from flask import Response, url_for, render_template, session, request
from flask_babel import gettext
from flask_security import login_required
from pgadmin.tools.sqleditor.command import QueryToolCommand
from pgadmin.utils import PgAdminModule
from pgadmin.utils import get_storage_directory
from pgadmin.utils.ajax import make_json_response, bad_request, \
    success_return, internal_server_error
from pgadmin.utils.driver import get_driver
from pgadmin.utils.sqlautocomplete.autocomplete import SQLAutoComplete
from pgadmin.misc.file_manager import Filemanager
from pgadmin.utils.menu import MenuItem

from config import PG_DEFAULT_DRIVER, ON_DEMAND_RECORD_COUNT

MODULE_NAME = 'sqleditor'

# import unquote from urllib for python2.x and python3.x
try:
    from urllib import unquote
except ImportError:
    from urllib.parse import unquote

# Async Constants
ASYNC_OK = 1
ASYNC_READ_TIMEOUT = 2
ASYNC_WRITE_TIMEOUT = 3
ASYNC_NOT_CONNECTED = 4
ASYNC_EXECUTION_ABORTED = 5

# Transaction status constants
TX_STATUS_IDLE = 0
TX_STATUS__ACTIVE = 1
TX_STATUS_INTRANS = 2
TX_STATUS_INERROR = 3


class SqlEditorModule(PgAdminModule):
    """
    class SqlEditorModule(PgAdminModule)

        A module class for SQL Grid derived from PgAdminModule.
    """

    LABEL = gettext("SQL Editor")

    def get_own_menuitems(self):
        return {'tools': [
            MenuItem(name='mnu_query_tool',
                     label=gettext('Query tool'),
                     priority=100,
                     callback='show_query_tool',
                     icon='fa fa-question',
                     url=url_for('help.static', filename='index.html'))
        ]}

    def get_own_javascripts(self):
        return [{
            'name': 'pgadmin.sqleditor',
            'path': url_for('sqleditor.index') + "sqleditor",
            'when': None
        }]


    def get_panels(self):
        return []

    def get_exposed_url_endpoints(self):
        """
        Returns:
            list: URL endpoints for sqleditor module
        """
        return [
            'sqleditor.view_data_start',
            'sqleditor.query_tool_start',
            'sqleditor.query_tool_preferences',
            'sqleditor.poll',
            'sqleditor.fetch',
            'sqleditor.fetch_all',
            'sqleditor.save',
            'sqleditor.get_filter',
            'sqleditor.apply_filter',
            'sqleditor.inclusive_filter',
            'sqleditor.exclusive_filter',
            'sqleditor.remove_filter',
            'sqleditor.set_limit',
            'sqleditor.cancel_transaction',
            'sqleditor.get_object_name',
            'sqleditor.auto_commit',
            'sqleditor.auto_rollback',
            'sqleditor.autocomplete',
            'sqleditor.load_file',
            'sqleditor.save_file',
            'sqleditor.query_tool_download'
        ]

    def register_preferences(self):
        self.info_notifier_timeout = self.preference.register(
            'display', 'info_notifier_timeout',
            gettext("Query info notifier timeout"), 'integer', 5,
            category_label=gettext('Display'),
            min_val=-1,
            max_val=999999,
            help_str=gettext(
                'The length of time to display the query info notifier after '
                'execution has completed. A value of -1 disables the notifier '
                'and a value of 0 displays it until clicked. Values greater '
                'than 0 display the notifier for the number of seconds '
                'specified.'
            )
        )

        self.open_in_new_tab = self.preference.register(
            'display', 'new_browser_tab',
            gettext("Open in new browser tab"), 'boolean', False,
            category_label=gettext('Display'),
            help_str=gettext('If set to True, the Query Tool '
                             'will be opened in a new browser tab.')
        )

        self.explain_verbose = self.preference.register(
            'Explain', 'explain_verbose',
            gettext("Verbose output?"), 'boolean', False,
            category_label=gettext('Explain')
        )

        self.explain_costs = self.preference.register(
            'Explain', 'explain_costs',
            gettext("Show costs?"), 'boolean', False,
            category_label=gettext('Explain')
        )

        self.explain_buffers = self.preference.register(
            'Explain', 'explain_buffers',
            gettext("Show buffers?"), 'boolean', False,
            category_label=gettext('Explain')
        )

        self.explain_timing = self.preference.register(
            'Explain', 'explain_timing',
            gettext("Show timing?"), 'boolean', False,
            category_label=gettext('Explain')
        )

        self.auto_commit = self.preference.register(
            'Options', 'auto_commit',
            gettext("Auto commit?"), 'boolean', True,
            category_label=gettext('Options')
        )

        self.auto_rollback = self.preference.register(
            'Options', 'auto_rollback',
            gettext("Auto rollback?"), 'boolean', False,
            category_label=gettext('Options')
        )

        self.sql_font_size = self.preference.register(
            'Options', 'sql_font_size',
            gettext("Font size"), 'numeric', '1',
            min_val=0.1,
            max_val=10,
            category_label=gettext('Display'),
            help_str=gettext(
                'The font size to use for the SQL text boxes and editors. '
                'The value specified is in "em" units, in which 1 is the '
                'default relative font size. For example, to increase the '
                'font size by 20 percent use a value of 1.2, or to reduce '
                'by 20 percent, use a value of 0.8. Minimum 0.1, maximum 10.'
            )
        )

        self.tab_size = self.preference.register(
            'Options', 'tab_size',
            gettext("Tab size"), 'integer', 4,
            min_val=2,
            max_val=8,
            category_label=gettext('Options'),
            help_str=gettext(
                'The number of spaces per tab. Minimum 2, maximum 8.'
            )
        )

        self.use_spaces = self.preference.register(
            'Options', 'use_spaces',
            gettext("Use spaces?"), 'boolean', False,
            category_label=gettext('Options'),
            help_str=gettext(
                'Specifies whether or not to insert spaces instead of tabs '
                'when the tab key or auto-indent are used.'
            )
        )

        self.wrap_code = self.preference.register(
            'Options', 'wrap_code',
            gettext("Line wrapping?"), 'boolean', False,
            category_label=gettext('Options'),
            help_str=gettext(
                'Specifies whether or not to wrap SQL code in the editor.'
            )
        )

        self.insert_pair_brackets = self.preference.register(
            'Options', 'insert_pair_brackets',
            gettext("Insert bracket pairs?"), 'boolean', True,
            category_label=gettext('Options'),
            help_str=gettext(
                'Specifies whether or not to insert paired brackets in the '
                'editor.'
            )
        )

        self.brace_matching = self.preference.register(
            'Options', 'brace_matching',
            gettext("Brace matching?"), 'boolean', True,
            category_label=gettext('Options'),
            help_str=gettext(
                'Specifies whether or not to highlight matched braces '
                'in the editor.'
            )
        )

        self.show_prompt_save_query_changes = self.preference.register(
            'Options', 'prompt_save_query_changes',
            gettext("Prompt to save unsaved query changes?"), 'boolean', True,
            category_label=gettext('Options'),
            help_str=gettext(
                'Specifies whether or not to prompt user to save unsaved '
                'query on query tool exit.'
            )
        )

        self.show_prompt_save_data_changes = self.preference.register(
            'Options', 'prompt_save_data_changes',
            gettext("Prompt to save unsaved data changes?"), 'boolean', True,
            category_label=gettext('Options'),
            help_str=gettext(
                'Specifies whether or not to prompt user to save unsaved '
                'data on data grid exit.'
            )
        )

        self.csv_quoting = self.preference.register(
            'CSV_output', 'csv_quoting',
            gettext("CSV quoting"), 'options', 'strings',
            category_label=gettext('CSV Output'),
            options=[{'label': 'None', 'value': 'none'},
                     {'label': 'All', 'value': 'all'},
                     {'label': 'Strings', 'value': 'strings'}],
            select2={
                'allowClear': False,
                'tags': False
            }
        )

        self.csv_quote_char = self.preference.register(
            'CSV_output', 'csv_quote_char',
            gettext("CSV quote character"), 'options', '"',
            category_label=gettext('CSV Output'),
            options=[{'label': '"', 'value': '"'},
                     {'label': '\'', 'value': '\''}],
            select2={
                'allowClear': False,
                'tags': True
            }
        )

        self.csv_field_separator = self.preference.register(
            'CSV_output', 'csv_field_separator',
            gettext("CSV field separator"), 'options', ',',
            category_label=gettext('CSV output'),
            options=[{'label': ';', 'value': ';'},
                     {'label': ',', 'value': ','},
                     {'label': '|', 'value': '|'},
                     {'label': 'Tab', 'value': '\t'}],
            select2={
                'allowClear': False,
                'tags': True
            }
        )

        self.results_grid_quoting = self.preference.register(
            'Results_grid', 'results_grid_quoting',
            gettext("Result copy quoting"), 'options', 'strings',
            category_label=gettext('Results grid'),
            options=[{'label': 'None', 'value': 'none'},
                     {'label': 'All', 'value': 'all'},
                     {'label': 'Strings', 'value': 'strings'}],
            select2={
                'allowClear': False,
                'tags': False
            }
        )

        self.results_grid_quote_char = self.preference.register(
            'Results_grid', 'results_grid_quote_char',
            gettext("Result copy quote character"), 'options', '"',
            category_label=gettext('Results grid'),
            options=[{'label': '"', 'value': '"'},
                     {'label': '\'', 'value': '\''}],
            select2={
                'allowClear': False,
                'tags': True
            }
        )

        self.results_grid_field_separator = self.preference.register(
            'Results_grid', 'results_grid_field_separator',
            gettext("Result copy field separator"), 'options', '\t',
            category_label=gettext('Results grid'),
            options=[{'label': ';', 'value': ';'},
                     {'label': ',', 'value': ','},
                     {'label': '|', 'value': '|'},
                     {'label': 'Tab', 'value': '\t'}],
            select2={
                'allowClear': False,
                'tags': True
            }
        )

blueprint = SqlEditorModule(MODULE_NAME, __name__, static_url_path='/static')


@blueprint.route('/')
@login_required
def index():
    return bad_request(
        errormsg=gettext('This URL cannot be requested directly.')
    )


def update_session_grid_transaction(trans_id, data):
    grid_data = session['gridData']
    grid_data[str(trans_id)] = data

    session['gridData'] = grid_data


def check_transaction_status(trans_id):
    """
    This function is used to check the transaction id
    is available in the session object and connection
    status.

    Args:
        trans_id:

    Returns: status and connection object

    """
    grid_data = session['gridData']

    # Return from the function if transaction id not found
    if str(trans_id) not in grid_data:
        return False, gettext(
            'Transaction ID not found in the session.'
        ), None, None, None

    # Fetch the object for the specified transaction id.
    # Use pickle.loads function to get the command object
    session_obj = grid_data[str(trans_id)]
    trans_obj = pickle.loads(session_obj['command_obj'])

    try:
        manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(trans_obj.sid)
        conn = manager.connection(did=trans_obj.did, conn_id=trans_obj.conn_id,
                                  use_binary_placeholder=True,
                                  array_to_string=True)
    except Exception as e:
        return False, internal_server_error(errormsg=str(e)), None, None, None

    if conn.connected():
        return True, None, conn, trans_obj, session_obj
    else:
        return False, gettext('Not connected to server or connection with the server has been closed.'), \
               None, trans_obj, session_obj


@blueprint.route(
    '/view_data/start/<int:trans_id>',
     methods=["GET"], endpoint='view_data_start'
)
@login_required
def start_view_data(trans_id):
    """
    This method is used to execute query using asynchronous connection.

    Args:
        trans_id: unique transaction id
    """
    limit = -1

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)

    # get the default connection as current connection which is attached to
    # trans id holds the cursor which has query result so we cannot use that
    # connection to execute another query otherwise we'll lose query result.

    manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(trans_obj.sid)
    default_conn = manager.connection(did=trans_obj.did)

    # Connect to the Server if not connected.
    if not default_conn.connected():
        status, msg = default_conn.connect()
        if not status:
            return make_json_response(
                data={'status': status, 'result': u"{}".format(msg)}
            )

    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:
        try:
            # set fetched row count to 0 as we are executing query again.
            trans_obj.update_fetched_row_cnt(0)
            session_obj['command_obj'] = pickle.dumps(trans_obj, -1)

            # Fetch the sql and primary_keys from the object
            sql = trans_obj.get_sql()
            pk_names, primary_keys = trans_obj.get_primary_keys(default_conn)

            has_oids = False
            if trans_obj.object_type == 'table':
                # Fetch OIDs status
                has_oids = trans_obj.has_oids(default_conn)

            # Fetch the applied filter.
            filter_applied = trans_obj.is_filter_applied()

            # Fetch the limit for the SQL query
            limit = trans_obj.get_limit()

            can_edit = trans_obj.can_edit()
            can_filter = trans_obj.can_filter()

            # Store the primary keys to the session object
            session_obj['primary_keys'] = primary_keys

            # Store the OIDs status into session object
            session_obj['has_oids'] = has_oids

            update_session_grid_transaction(trans_id, session_obj)

            # Execute sql asynchronously
            status, result = conn.execute_async(sql)
        except Exception as e:
            return internal_server_error(errormsg=str(e))
    else:
        status = False
        result = error_msg
        filter_applied = False
        can_edit = False
        can_filter = False
        sql = None

    return make_json_response(
        data={
            'status': status, 'result': result,
            'filter_applied': filter_applied,
            'limit': limit, 'can_edit': can_edit,
            'can_filter': can_filter, 'sql': sql,
            'info_notifier_timeout': blueprint.info_notifier_timeout.get()
        }
    )


@blueprint.route(
    '/query_tool/start/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='query_tool_start'
)
@login_required
def start_query_tool(trans_id):
    """
    This method is used to execute query using asynchronous connection.

    Args:
        trans_id: unique transaction id
    """

    if request.data:
        sql = json.loads(request.data, encoding='utf-8')
    else:
        sql = request.args or request.form

    grid_data = session['gridData']

    # Return from the function if transaction id not found
    if str(trans_id) not in grid_data:
        return make_json_response(
            data={
                'status': False, 'result': gettext('Transaction ID not found in the session.'),
                'can_edit': False, 'can_filter': False
            }
        )

    # Fetch the object for the specified transaction id.
    # Use pickle.loads function to get the command object
    session_obj = grid_data[str(trans_id)]
    trans_obj = pickle.loads(session_obj['command_obj'])
    # set fetched row count to 0 as we are executing query again.
    trans_obj.update_fetched_row_cnt(0)

    can_edit = False
    can_filter = False

    if trans_obj is not None and session_obj is not None:
        conn_id = trans_obj.conn_id

        # if conn_id is None then we will have to create a new connection
        if conn_id is None:
            # Create asynchronous connection using random connection id.
            conn_id = str(random.randint(1, 9999999))

        try:
            manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(trans_obj.sid)
            conn = manager.connection(did=trans_obj.did, conn_id=conn_id,
                                      use_binary_placeholder=True,
                                      array_to_string=True)
        except Exception as e:
            return internal_server_error(errormsg=str(e))

        # Connect to the Server if not connected.
        if not conn.connected():
            status, msg = conn.connect()
            if not status:
                return internal_server_error(errormsg=str(msg))

        if conn.connected():
            # on successful connection set the connection id to the
            # transaction object
            trans_obj.set_connection_id(conn_id)

            # As we changed the transaction object we need to
            # restore it and update the session variable.
            session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
            update_session_grid_transaction(trans_id, session_obj)

            # If auto commit is False and transaction status is Idle
            # then call is_begin_not_required() function to check BEGIN
            # is required or not.

            if not trans_obj.auto_commit \
                    and conn.transaction_status() == TX_STATUS_IDLE \
                    and is_begin_required(sql):
                conn.execute_void("BEGIN;")

            # Execute sql asynchronously with params is None
            # and formatted_error is True.
            status, result = conn.execute_async(sql)

            # If the transaction aborted for some reason and
            # Auto RollBack is True then issue a rollback to cleanup.
            trans_status = conn.transaction_status()
            if trans_status == TX_STATUS_INERROR and trans_obj.auto_rollback:
                conn.execute_void("ROLLBACK;")
        else:
            status = False
            result = gettext('Not connected to server or connection with the server has been closed.')

        can_edit = trans_obj.can_edit()
        can_filter = trans_obj.can_filter()

    else:
        status = False
        result = gettext('Either transaction object or session object not found.')

    return make_json_response(
        data={
            'status': status, 'result': result,
            'can_edit': can_edit, 'can_filter': can_filter,
            'info_notifier_timeout': blueprint.info_notifier_timeout.get()
        }
    )


@blueprint.route(
    '/query_tool/preferences/<int:trans_id>',
    methods=["GET", "PUT"], endpoint='query_tool_preferences'
)
@login_required
def preferences(trans_id):
    """
        This method is used to get/put explain options from/to preferences

        Args:
            trans_id: unique transaction id
    """
    if request.method == 'GET':

        # Check the transaction and connection status
        status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
        if status and conn is not None \
                and trans_obj is not None and session_obj is not None:
            # Call the set_auto_commit and set_auto_rollback method of transaction object
            trans_obj.set_auto_commit(blueprint.auto_commit.get())
            trans_obj.set_auto_rollback(blueprint.auto_rollback.get())

            # As we changed the transaction object we need to
            # restore it and update the session variable.
            session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
            update_session_grid_transaction(trans_id, session_obj)

        return make_json_response(
            data={
                'explain_verbose': blueprint.explain_verbose.get(),
                'explain_costs': blueprint.explain_costs.get(),
                'explain_buffers': blueprint.explain_buffers.get(),
                'explain_timing': blueprint.explain_timing.get(),
                'auto_commit': blueprint.auto_commit.get(),
                'auto_rollback': blueprint.auto_rollback.get()
            }
        )
    else:
        data = None
        if request.data:
            data = json.loads(request.data, encoding='utf-8')
        else:
            data = request.args or request.form
        for k, v in data.items():
            v = bool(v)
            if k == 'explain_verbose':
                blueprint.explain_verbose.set(v)
            elif k == 'explain_costs':
                blueprint.explain_costs.set(v)
            elif k == 'explain_buffers':
                blueprint.explain_buffers.set(v)
            elif k == 'explain_timing':
                blueprint.explain_timing.set(v)

        return success_return()


@blueprint.route('/poll/<int:trans_id>', methods=["GET"], endpoint='poll')
@login_required
def poll(trans_id):
    """
    This method polls the result of the asynchronous query and returns the result.

    Args:
        trans_id: unique transaction id
    """
    result = None
    rows_affected = 0
    rows_fetched_from = 0
    rows_fetched_to = 0
    has_more_rows = False
    columns = dict()
    columns_info = None
    primary_keys = None
    types = {}
    client_primary_key = None
    rset = None
    has_oids = False
    oids = None

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None and session_obj is not None:
        status, result = conn.poll(formatted_exception_msg=True, no_result=True)
        if not status:
            return internal_server_error(result)
        elif status == ASYNC_OK:
            status = 'Success'
            rows_affected = conn.rows_affected()

            # if transaction object is instance of QueryToolCommand
            # and transaction aborted for some reason then issue a
            # rollback to cleanup
            if isinstance(trans_obj, QueryToolCommand):
                trans_status = conn.transaction_status()
                if (trans_status == TX_STATUS_INERROR and
                        trans_obj.auto_rollback):
                    conn.execute_void("ROLLBACK;")

            st, result = conn.async_fetchmany_2darray(ON_DEMAND_RECORD_COUNT)
            if st:
                if 'primary_keys' in session_obj:
                    primary_keys = session_obj['primary_keys']

                if 'has_oids' in session_obj:
                    has_oids = session_obj['has_oids']
                    if has_oids:
                        oids = {'oid': 'oid'}

                # Fetch column information
                columns_info = conn.get_column_info()
                client_primary_key = generate_client_primary_key_name(
                    columns_info
                )
                session_obj['client_primary_key'] = client_primary_key

                if columns_info is not None:

                    command_obj = pickle.loads(session_obj['command_obj'])
                    if hasattr(command_obj, 'obj_id'):
                        # Get the template path for the column
                        template_path = 'column/sql/#{0}#'.format(
                            conn.manager.version
                        )

                        SQL = render_template("/".join([template_path,
                                                        'nodes.sql']),
                                              tid=command_obj.obj_id,
                                              has_oids=True)
                        # rows with attribute not_null
                        colst, rset = conn.execute_2darray(SQL)
                        if not colst:
                            return internal_server_error(errormsg=rset)

                    for key, col in enumerate(columns_info):
                        col_type = dict()
                        col_type['type_code'] = col['type_code']
                        col_type['type_name'] = None
                        col_type['internal_size'] = col['internal_size']
                        columns[col['name']] = col_type

                        if rset:
                            col_type['not_null'] = col['not_null'] = \
                                rset['rows'][key]['not_null']

                            col_type['has_default_val'] = \
                                col['has_default_val'] = \
                                rset['rows'][key]['has_default_val']

                if columns:
                    st, types = fetch_pg_types(columns, trans_obj)

                    if not st:
                        return internal_server_error(types)

                    for col_info in columns.values():
                        for col_type in types:
                            if col_type['oid'] == col_info['type_code']:
                                typname = col_type['typname']

                                # If column is of type character, character[],
                                # character varying and character varying[]
                                # then add internal size to it's name for the
                                # correct sql query.
                                if col_info['internal_size'] >= 0:
                                    if (
                                        typname == 'character' or
                                        typname == 'character varying'
                                    ):
                                        typname = typname + '(' + \
                                            str(col_info['internal_size']) + \
                                            ')'
                                    elif (
                                        typname == 'character[]' or
                                        typname == 'character varying[]'
                                    ):
                                        typname = typname[:-2] + '(' + \
                                            str(col_info['internal_size']) + \
                                            ')[]'

                                col_info['type_name'] = typname

                    session_obj['columns_info'] = columns
                # status of async_fetchmany_2darray is True and result is none
                # means nothing to fetch
                if result and rows_affected > -1:
                    res_len = len(result)
                    if res_len == ON_DEMAND_RECORD_COUNT:
                        has_more_rows = True

                    if res_len > 0:
                        rows_fetched_from = trans_obj.get_fetched_row_cnt()
                        trans_obj.update_fetched_row_cnt(rows_fetched_from + res_len)
                        rows_fetched_from += 1
                        rows_fetched_to = trans_obj.get_fetched_row_cnt()
                        session_obj['command_obj'] = pickle.dumps(trans_obj, -1)

                # As we changed the transaction object we need to
                # restore it and update the session variable.
                update_session_grid_transaction(trans_id, session_obj)

        elif status == ASYNC_EXECUTION_ABORTED:
            status = 'Cancel'
        else:
            status = 'Busy'
            messages = conn.messages()
            if messages and len(messages) > 0:
                result = ''.join(messages)

    else:
        status = 'NotConnected'
        result = error_msg

    # There may be additional messages even if result is present
    # eg: Function can provide result as well as RAISE messages
    additional_messages = None
    if status == 'Success':
        messages = conn.messages()
        if messages:
            additional_messages = ''.join(messages)

    # Procedure/Function output may comes in the form of Notices from the
    # database server, so we need to append those outputs with the
    # original result.
    if status == 'Success' and result is None:
        result = conn.status_message()
        if (result != 'SELECT 1' or result != 'SELECT 0') \
            and result is not None and additional_messages:
            result = additional_messages + result

    return make_json_response(
        data={
            'status': status, 'result': result,
            'rows_affected': rows_affected,
            'rows_fetched_from': rows_fetched_from,
            'rows_fetched_to': rows_fetched_to,
            'additional_messages': additional_messages,
            'has_more_rows': has_more_rows,
            'colinfo': columns_info,
            'primary_keys': primary_keys,
            'types': types,
            'client_primary_key': client_primary_key,
            'has_oids': has_oids,
            'oids': oids
        }
    )


@blueprint.route('/fetch/<int:trans_id>', methods=["GET"], endpoint='fetch')
@blueprint.route('/fetch/<int:trans_id>/<int:fetch_all>', methods=["GET"], endpoint='fetch_all')
@login_required
def fetch(trans_id, fetch_all=None):
    result = None
    has_more_rows = False
    rows_fetched_from = 0
    rows_fetched_to = 0
    fetch_row_cnt = -1 if fetch_all == 1 else ON_DEMAND_RECORD_COUNT

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None and session_obj is not None:
        status, result = conn.async_fetchmany_2darray(fetch_row_cnt)
        if not status:
            status = 'Error'
        else:
            status = 'Success'
            res_len = len(result)
            if fetch_row_cnt != -1 and res_len == ON_DEMAND_RECORD_COUNT:
                has_more_rows = True

            if res_len:
                rows_fetched_from = trans_obj.get_fetched_row_cnt()
                trans_obj.update_fetched_row_cnt(rows_fetched_from + res_len)
                rows_fetched_from += 1
                rows_fetched_to = trans_obj.get_fetched_row_cnt()
                session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
                update_session_grid_transaction(trans_id, session_obj)
    else:
        status = 'NotConnected'
        result = error_msg

    return make_json_response(
        data={
            'status': status, 'result': result,
            'has_more_rows': has_more_rows,
            'rows_fetched_from': rows_fetched_from,
            'rows_fetched_to': rows_fetched_to
        }
    )


def fetch_pg_types(columns_info, trans_obj):
    """
    This method is used to fetch the pg types, which is required
    to map the data type comes as a result of the query.

    Args:
        columns_info:
    """

    # get the default connection as current connection attached to trans id
    # holds the cursor which has query result so we cannot use that connection
    # to execute another query otherwise we'll lose query result.

    manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(trans_obj.sid)
    default_conn = manager.connection(did=trans_obj.did)

    # Connect to the Server if not connected.
    res = []
    if not default_conn.connected():
        status, msg = default_conn.connect()
        if not status:
            return status, msg

    oids = [columns_info[col]['type_code'] for col in columns_info]

    if oids:
        status, res = default_conn.execute_dict(
            u"""SELECT oid, format_type(oid,null) as typname FROM pg_type WHERE oid IN %s ORDER BY oid;
""", [tuple(oids)])

        if not status:
            return False, res

        return status, res['rows']
    else:
        return True, []


def generate_client_primary_key_name(columns_info):
    temp_key = '__temp_PK'
    if not columns_info:
        return temp_key

    initial_temp_key_len = len(temp_key)
    duplicate = False
    suffix = 1
    while 1:
        for col in columns_info:
            if col['name'] == temp_key:
                duplicate = True
                break
        if duplicate:
            if initial_temp_key_len == len(temp_key):
                temp_key += str(suffix)
                suffix += 1
            else:
                temp_key = temp_key[:-1] + str(suffix)
                suffix += 1
            duplicate = False
        else:
            break
    return temp_key


@blueprint.route(
    '/save/<int:trans_id>', methods=["PUT", "POST"], endpoint='save'
)
@login_required
def save(trans_id):
    """
    This method is used to save the changes to the server

    Args:
        trans_id: unique transaction id
    """
    if request.data:
        changed_data = json.loads(request.data, encoding='utf-8')
    else:
        changed_data = request.args or request.form

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        # If there is no primary key found then return from the function.
        if (len(session_obj['primary_keys']) <= 0 or len(changed_data) <= 0) and 'has_oids' not in session_obj:
            return make_json_response(
                data={
                    'status': False,
                    'result': gettext('No primary key found for this object, so unable to save records.')
                }
            )

        manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(trans_obj.sid)
        default_conn = manager.connection(did=trans_obj.did)

        # Connect to the Server if not connected.
        if not default_conn.connected():
            status, msg = default_conn.connect()
            if not status:
                return make_json_response(
                    data={'status': status, 'result': u"{}".format(msg)}
                )

        status, res, query_res, _rowid = trans_obj.save(
            changed_data,
            session_obj['columns_info'],
            session_obj['client_primary_key'],
            default_conn)
    else:
        status = False
        res = error_msg
        query_res = None

    return make_json_response(
        data={
            'status': status,
            'result': res,
            'query_result': query_res,
            '_rowid': _rowid
        }
    )


@blueprint.route(
    '/filter/get/<int:trans_id>',
    methods=["GET"], endpoint='get_filter'
)
@login_required
def get_filter(trans_id):
    """
    This method is used to get the existing filter.

    Args:
        trans_id: unique transaction id
    """

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        res = trans_obj.get_filter()
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/filter/apply/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='apply_filter'
)
@login_required
def apply_filter(trans_id):
    """
    This method is used to apply the filter.

    Args:
        trans_id: unique transaction id
    """
    if request.data:
        filter_sql = json.loads(request.data, encoding='utf-8')
    else:
        filter_sql = request.args or request.form

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        status, res = trans_obj.set_filter(filter_sql)

        # As we changed the transaction object we need to
        # restore it and update the session variable.
        session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
        update_session_grid_transaction(trans_id, session_obj)
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/filter/inclusive/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='inclusive_filter'
)
@login_required
def append_filter_inclusive(trans_id):
    """
    This method is used to append and apply the filter.

    Args:
        trans_id: unique transaction id
    """
    if request.data:
        filter_data = json.loads(request.data, encoding='utf-8')
    else:
        filter_data = request.args or request.form

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        res = None
        filter_sql = ''
        driver = get_driver(PG_DEFAULT_DRIVER)

        for column_name in filter_data:
            column_value = filter_data[column_name]
            if column_value is None:
                filter_sql = driver.qtIdent(conn, column_name) + ' IS NULL '
            else:
                filter_sql = driver.qtIdent(conn, column_name) + ' = ' + driver.qtLiteral(column_value)

        trans_obj.append_filter(filter_sql)

        # As we changed the transaction object we need to
        # restore it and update the session variable.
        session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
        update_session_grid_transaction(trans_id, session_obj)
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/filter/exclusive/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='exclusive_filter'
)
@login_required
def append_filter_exclusive(trans_id):
    """
    This method is used to append and apply the filter.

    Args:
        trans_id: unique transaction id
    """
    if request.data:
        filter_data = json.loads(request.data, encoding='utf-8')
    else:
        filter_data = request.args or request.form

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        res = None
        filter_sql = ''
        driver = get_driver(PG_DEFAULT_DRIVER)

        for column_name in filter_data:
            column_value = filter_data[column_name]
            if column_value is None:
                filter_sql = driver.qtIdent(conn, column_name) + ' IS NOT NULL '
            else:
                filter_sql = driver.qtIdent(conn, column_name) + ' IS DISTINCT FROM ' + driver.qtLiteral(column_value)

        # Call the append_filter method of transaction object
        trans_obj.append_filter(filter_sql)

        # As we changed the transaction object we need to
        # restore it and update the session variable.
        session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
        update_session_grid_transaction(trans_id, session_obj)
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/filter/remove/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='remove_filter'
)
@login_required
def remove_filter(trans_id):
    """
    This method is used to remove the filter.

    Args:
        trans_id: unique transaction id
    """

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        res = None

        # Call the remove_filter method of transaction object
        trans_obj.remove_filter()

        # As we changed the transaction object we need to
        # restore it and update the session variable.
        session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
        update_session_grid_transaction(trans_id, session_obj)
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/limit/<int:trans_id>', methods=["PUT", "POST"], endpoint='set_limit'
)
@login_required
def set_limit(trans_id):
    """
    This method is used to set the limit for the SQL.

    Args:
        trans_id: unique transaction id
    """
    if request.data:
        limit = json.loads(request.data, encoding='utf-8')
    else:
        limit = request.args or request.form

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        res = None

        # Call the set_limit method of transaction object
        trans_obj.set_limit(limit)

        # As we changed the transaction object we need to
        # restore it and update the session variable.
        session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
        update_session_grid_transaction(trans_id, session_obj)
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/cancel/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='cancel_transaction'
)
@login_required
def cancel_transaction(trans_id):
    """
    This method is used to cancel the running transaction

    Args:
        trans_id: unique transaction id
    """

    grid_data = session['gridData']

    # Return from the function if transaction id not found
    if str(trans_id) not in grid_data:
        return make_json_response(
            data={
                'status': False, 'result': gettext('Transaction ID not found in the session.')
            }
        )

    # Fetch the object for the specified transaction id.
    # Use pickle.loads function to get the command object
    session_obj = grid_data[str(trans_id)]
    trans_obj = pickle.loads(session_obj['command_obj'])

    if trans_obj is not None and session_obj is not None:

        # Fetch the main connection object for the database.
        try:
            manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(trans_obj.sid)
            conn = manager.connection(did=trans_obj.did)
        except Exception as e:
            return internal_server_error(errormsg=str(e))

        delete_connection = False

        # Connect to the Server if not connected.
        if not conn.connected():
            status, msg = conn.connect()
            if not status:
                return internal_server_error(errormsg=str(msg))
            delete_connection = True

        if conn.connected():
            # on successful connection cancel the running transaction
            status, result = conn.cancel_transaction(trans_obj.conn_id, trans_obj.did)

            # Delete connection if we have created it to
            # cancel the transaction
            if delete_connection:
                manager.release(did=trans_obj.did)
        else:
            status = False
            result = gettext('Not connected to server or connection with the server has been closed.')
    else:
        status = False
        result = gettext('Either transaction object or session object not found.')

    return make_json_response(
        data={
            'status': status, 'result': result
        }
    )


@blueprint.route(
    '/object/get/<int:trans_id>',
    methods=["GET"], endpoint='get_object_name'
)
@login_required
def get_object_name(trans_id):
    """
    This method is used to get the object name

    Args:
        trans_id: unique transaction id
    """

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        res = trans_obj.object_name
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/auto_commit/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='auto_commit'
)
@login_required
def set_auto_commit(trans_id):
    """
    This method is used to set the value for auto commit .

    Args:
        trans_id: unique transaction id
    """
    if request.data:
        auto_commit = json.loads(request.data, encoding='utf-8')
    else:
        auto_commit = request.args or request.form

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        res = None

        # Call the set_auto_commit method of transaction object
        trans_obj.set_auto_commit(auto_commit)

        # Set Auto commit in preferences
        blueprint.auto_commit.set(bool(auto_commit))

        # As we changed the transaction object we need to
        # restore it and update the session variable.
        session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
        update_session_grid_transaction(trans_id, session_obj)
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/auto_rollback/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='auto_rollback'
)
@login_required
def set_auto_rollback(trans_id):
    """
    This method is used to set the value for auto commit .

    Args:
        trans_id: unique transaction id
    """
    if request.data:
        auto_rollback = json.loads(request.data, encoding='utf-8')
    else:
        auto_rollback = request.args or request.form

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        res = None

        # Call the set_auto_rollback method of transaction object
        trans_obj.set_auto_rollback(auto_rollback)

        # Set Auto Rollback in preferences
        blueprint.auto_rollback.set(bool(auto_rollback))

        # As we changed the transaction object we need to
        # restore it and update the session variable.
        session_obj['command_obj'] = pickle.dumps(trans_obj, -1)
        update_session_grid_transaction(trans_id, session_obj)
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route(
    '/autocomplete/<int:trans_id>',
    methods=["PUT", "POST"], endpoint='autocomplete'
)
@login_required
def auto_complete(trans_id):
    """
    This method implements the autocomplete feature.

    Args:
        trans_id: unique transaction id
    """
    full_sql = ''
    text_before_cursor = ''

    if request.data:
        data = json.loads(request.data, encoding='utf-8')
    else:
        data = request.args or request.form

    if len(data) > 0:
        full_sql = data[0]
        text_before_cursor = data[1]

    # Check the transaction and connection status
    status, error_msg, conn, trans_obj, session_obj = check_transaction_status(trans_id)
    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        # Create object of SQLAutoComplete class and pass connection object
        auto_complete_obj = SQLAutoComplete(sid=trans_obj.sid, did=trans_obj.did, conn=conn)

        # Get the auto completion suggestions.
        res = auto_complete_obj.get_completions(full_sql, text_before_cursor)
    else:
        status = False
        res = error_msg

    return make_json_response(data={'status': status, 'result': res})


@blueprint.route("/sqleditor.js")
@login_required
def script():
    """render the required javascript"""
    return Response(response=render_template("sqleditor/js/sqleditor.js",
                    tab_size=blueprint.tab_size.get(),
                    use_spaces=blueprint.use_spaces.get(),
                    _=gettext),
                    status=200,
                    mimetype="application/javascript"
           )


def is_begin_required(query):
    word_len = 0
    query = query.strip()
    query_len = len(query)

    # Check word length (since "beginx" is not "begin").
    while (word_len < query_len) and query[word_len].isalpha():
        word_len += 1

    # Transaction control commands.  These should include every keyword that
    #  gives rise to a TransactionStmt in the backend grammar, except for the
    #  savepoint-related commands.
    #
    #  (We assume that START must be START TRANSACTION, since there is
    #  presently no other "START foo" command.)

    keyword = query[0:word_len]

    if word_len == 5 and keyword.lower() == "abort":
        return False
    if word_len == 5 and keyword.lower() == "begin":
        return False
    if word_len == 5 and keyword.lower() == "start":
        return False
    if word_len == 6:
        # SELECT is protected from dirty reads hence don't require transaction
        if keyword.lower() in ["select", "commit"]:
            return False
    if word_len == 3 and keyword.lower() == "end":
        return False
    if word_len == 8 and keyword.lower() == "rollback":
        return False
    if word_len == 7 and keyword.lower() == "prepare":
        # PREPARE TRANSACTION is a TC command, PREPARE foo is not
        query = query[word_len:query_len]
        query = query.strip()
        query_len = len(query)
        word_len = 0

        while (word_len < query_len) and query[word_len].isalpha():
            word_len += 1

        keyword = query[0:word_len]
        if word_len == 11 and keyword.lower() == "transaction":
            return False
        return True

    # Commands not allowed within transactions. The statements checked for
    # here should be exactly those that call PreventTransactionChain() in the
    # backend.
    if word_len == 6 and keyword.lower() == "vacuum":
        return False

    if word_len == 7 and keyword.lower() == "cluster":
        # CLUSTER with any arguments is allowed in transactions
        query = query[word_len:query_len]
        query = query.strip()

        if query[0].isalpha():
            return True  # has additional words
        return False  # it's CLUSTER without arguments

    if word_len == 6 and keyword.lower() == "create":
        query = query[word_len:query_len]
        query = query.strip()
        query_len = len(query)
        word_len = 0

        while (word_len < query_len) and query[word_len].isalpha():
            word_len += 1

        keyword = query[0:word_len]
        if word_len == 8 and keyword.lower() == "database":
            return False
        if word_len == 10 and keyword.lower() == "tablespace":
            return False

        # CREATE [UNIQUE] INDEX CONCURRENTLY isn't allowed in xacts
        if word_len == 7 and keyword.lower() == "cluster":
            query = query[word_len:query_len]
            query = query.strip()
            query_len = len(query)
            word_len = 0

            while (word_len < query_len) and query[word_len].isalpha():
                word_len += 1

            keyword = query[0:word_len]

        if word_len == 5 and keyword.lower() == "index":
            query = query[word_len:query_len]
            query = query.strip()
            query_len = len(query)
            word_len = 0

            while (word_len < query_len) and query[word_len].isalpha():
                word_len += 1

            keyword = query[0:word_len]
            if word_len == 12 and keyword.lower() == "concurrently":
                return False
        return True

    if word_len == 5 and keyword.lower() == "alter":
        query = query[word_len:query_len]
        query = query.strip()
        query_len = len(query)
        word_len = 0

        while (word_len < query_len) and query[word_len].isalpha():
            word_len += 1

        keyword = query[0:word_len]

        # ALTER SYSTEM isn't allowed in xacts
        if word_len == 6 and keyword.lower() == "system":
            return False
        return True

    # Note: these tests will match DROP SYSTEM and REINDEX TABLESPACE, which
    # aren't really valid commands so we don't care much. The other four
    # possible matches are correct.
    if word_len == 4 and keyword.lower() == "drop" \
            or word_len == 7 and keyword.lower() == "reindex":
        query = query[word_len:query_len]
        query = query.strip()
        query_len = len(query)
        word_len = 0

        while (word_len < query_len) and query[word_len].isalpha():
            word_len += 1

        keyword = query[0:word_len]
        if word_len == 8 and keyword.lower() == "database":
            return False
        if word_len == 6 and keyword.lower() == "system":
            return False
        if word_len == 10 and keyword.lower() == "tablespace":
            return False
        return True

    # DISCARD ALL isn't allowed in xacts, but other variants are allowed.
    if word_len == 7 and keyword.lower() == "discard":
        query = query[word_len:query_len]
        query = query.strip()
        query_len = len(query)
        word_len = 0

        while (word_len < query_len) and query[word_len].isalpha():
            word_len += 1

        keyword = query[0:word_len]
        if word_len == 3 and keyword.lower() == "all":
            return False
        return True

    return True


@blueprint.route('/load_file/', methods=["PUT", "POST"], endpoint='load_file')
@login_required
def load_file():
    """
    This function gets name of file from request data
    reads the data and sends back in reponse
    """
    if request.data:
        file_data = json.loads(request.data, encoding='utf-8')

    file_path = unquote(file_data['file_name'])
    if hasattr(str, 'decode'):
        file_path = unquote(
            file_data['file_name']
        ).encode('utf-8').decode('utf-8')

    # retrieve storage directory path
    storage_manager_path = get_storage_directory()
    if storage_manager_path:
        # generate full path of file
        file_path = os.path.join(
            storage_manager_path,
            file_path.lstrip('/').lstrip('\\')
        )

    status, err_msg, is_binary, \
        is_startswith_bom, enc = Filemanager.check_file_for_bom_and_binary(
            file_path
        )

    if not status:
        return internal_server_error(
            errormsg=gettext(err_msg)
        )

    if is_binary:
        return internal_server_error(
            errormsg=gettext("File type not supported")
        )

    def gen():
        with codecs.open(file_path, 'r', encoding=enc) as fileObj:
            while True:
                data = fileObj.read(4194304)  # 4MB chunk (4 * 1024 * 1024 Bytes)
                if not data:
                    break
                yield data

    return Response(gen(), mimetype='text/plain')


@blueprint.route('/save_file/', methods=["PUT", "POST"], endpoint='save_file')
@login_required
def save_file():
    """
    This function retrieves file_name and data from request.
    and then save the data to the file
    """
    if request.data:
        file_data = json.loads(request.data, encoding='utf-8')

    # retrieve storage directory path
    storage_manager_path = get_storage_directory()

    # generate full path of file
    file_path = unquote(file_data['file_name'])
    if hasattr(str, 'decode'):
        file_path = unquote(
            file_data['file_name']
        ).encode('utf-8').decode('utf-8')

    try:
        Filemanager.check_access_permission(storage_manager_path, file_path)
    except Exception as e:
        return internal_server_error(errormsg=str(e))

    if storage_manager_path is not None:
        file_path = os.path.join(
            storage_manager_path,
            file_path.lstrip('/').lstrip('\\')
        )

    if hasattr(str, 'decode'):
        file_content = file_data['file_content']
    else:
        file_content = file_data['file_content'].encode()

    # write to file
    try:
        with open(file_path, 'wb+') as output_file:
            if hasattr(str, 'decode'):
                output_file.write(file_content.encode('utf-8'))
            else:
                output_file.write(file_content)
    except IOError as e:
        if e.strerror == 'Permission denied':
            err_msg = "Error: {0}".format(e.strerror)
        else:
            err_msg = "Error: {0}".format(e.strerror)
        return internal_server_error(errormsg=err_msg)
    except Exception as e:
        err_msg = "Error: {0}".format(e.strerror)
        return internal_server_error(errormsg=err_msg)

    return make_json_response(
        data={
            'status': True,
        }
    )


@blueprint.route(
    '/query_tool/download/<int:trans_id>',
    methods=["GET"],
    endpoint='query_tool_download'
)
@login_required
def start_query_download_tool(trans_id):
    sync_conn = None
    status, error_msg, conn, trans_obj, \
        session_obj = check_transaction_status(trans_id)

    if status and conn is not None \
            and trans_obj is not None and session_obj is not None:

        data = request.args if request.args else None
        try:
            if data and 'query' in data:
                sql = data['query']
                conn_id = str(random.randint(1, 9999999))
                sync_conn = conn.manager.connection(
                    did=trans_obj.did,
                    conn_id=conn_id,
                    auto_reconnect=False,
                    async=False
                )

                sync_conn.connect(autocommit=False)

                def cleanup():
                    conn.manager.connections[sync_conn.conn_id]._release()
                    del conn.manager.connections[sync_conn.conn_id]

                # This returns generator of records.
                status, gen = sync_conn.execute_on_server_as_csv(
                    sql, records=2000
                )

                if not status:
                    r = Response('"{0}"'.format(gen), mimetype='text/csv')
                    r.headers[
                        "Content-Disposition"
                    ] = "attachment;filename=error.csv"
                    r.call_on_close(cleanup)
                    return r

                r = Response(gen(quote=blueprint.csv_quoting.get(),
                    quote_char=blueprint.csv_quote_char.get(),
                    field_separator=blueprint.csv_field_separator.get()), mimetype='text/csv')

                if 'filename' in data and data['filename'] != "":
                    filename = data['filename']
                else:
                    import time
                    filename = str(int(time.time())) + ".csv"

                # We will try to encode report file name with latin-1
                # If it fails then we will fallback to default ascii file name
                # werkzeug only supports latin-1 encoding supported values
                try:
                    tmp_file_name = filename
                    tmp_file_name.encode('latin-1', 'strict')
                except UnicodeEncodeError:
                    filename = "download.csv"

                r.headers[
                    "Content-Disposition"
                ] = "attachment;filename={0}".format(filename)

                r.call_on_close(cleanup)
                return r

        except Exception as e:
            r = Response('"{0}"'.format(e), mimetype='text/csv')
            r.headers["Content-Disposition"] = "attachment;filename=error.csv"
            r.call_on_close(cleanup)
            return r
    else:
        return internal_server_error(
            errormsg=gettext("Transaction status check failed.")
        )
