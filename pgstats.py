####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

from flask import Blueprint, request, jsonify, session
from flask.views import MethodView
from flask_security import login_required, roles_required, current_user, roles_accepted, auth_required
from pgadmin.model import db, Role, User, Server, ServerGroup, Process
from pgadmin.browser.server_groups.servers.types import ServerType
from flask import g
from config import PG_DEFAULT_DRIVER
from pgadmin.utils.driver import get_driver
from pgadmin.utils.crypto import encrypt, decrypt, pqencryptpassword
from pgadmin.utils.driver.psycopg2 import ServerManager
from pgqueries import *
from datetime import datetime

pgstats = Blueprint('pgstats', 'pgstats', url_prefix='/pgstats')


class ConnectAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def post(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        else:
            args= request.json.get('params')
            sid = args.get('sid')
            gid = args.get('gid')
            pwd = args.get('pwd')
            save = args.get('save')
            update = args.get('update')
            try:
                pg_server = Server.query.filter_by(
                    id=sid,
                    servergroup_id=gid,
                    user_id=current_user.id
                ).first()
                if not pg_server:
                    json_dict['state'] = "error"
                    json_dict['msg'] = "Server not available in metadata."
                    return jsonify(json_dict)
                else:
                    json_dict['discovery_id'] = pg_server.discovery_id

                manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(sid))
                if update:
                    manager.update(pg_server)
                conn = manager.connection()
                if conn.connected():
                    try:
                        cur = conn.conn.cursor()
                        cur.execute(version_query)
                        x = cur.fetchone()[0]
                        cur.close()
                        ver_platform = x.split(",")[0]
                        json_dict['version'] = ver_platform
                        version_info = ver_platform.split()
                        json_dict['pg_version'] = version_info[1]
                        json_dict['state'] = "success"
                        json_dict['msg'] = "Already Connected."
                        return jsonify(json_dict)
                    except Exception as e:
                        pass

                password = ""
                if pwd:
                    password = pwd
                    try:
                        password = encrypt(password, current_user.password)
                    except Exception as e:
                        errmsg = "ERROR: " + str(e)
                        json_dict['state'] = "error"
                        json_dict['msg'] = errmsg
                        return jsonify(json_dict)
                else:
                    if pg_server.password:
                        password=pg_server.password
                    else:
                        json_dict['state'] = "error"
                        json_dict['need_pwd'] = True
                        json_dict['msg'] = "Password required."
                        return jsonify(json_dict)
                status = True
                try:
                    status, errmsg = conn.connect(
                        password=password,
                        server_types=ServerType.types()
                    )
                except Exception as e:
                    errmsg = "ERROR: " + str(e)
                    json_dict['state'] = "error"
                    json_dict['msg'] = errmsg
                    return jsonify(json_dict)
                if not status:
                    emsg = errmsg.split("\n")
                    if len(emsg)>1:
                        if emsg[0] == emsg[1]:
                            errmsg = emsg[0]
                    if hasattr(str, 'decode'):
                        errmsg = errmsg.decode('utf-8')
                    if errmsg.find("timeout expired") >= 0:
                        errmsg = "Connection timed out."
                    json_dict['state'] = "error"
                    json_dict['msg'] = errmsg
                    if errmsg.find("password authentication failed")>=0:
                        json_dict['need_pwd'] = True
                    return jsonify(json_dict)
                else:
                    manager.update_session()
                    cur = conn.conn.cursor()
                    cur.execute(version_query)
                    x = cur.fetchone()[0]
                    cur.close()
                    ver_platform = x.split(",")[0]
                    json_dict['version'] = ver_platform
                    version_info = ver_platform.split()
                    json_dict['pg_version'] = version_info[1]
                    json_dict['msg'] = "connected sucessfully"
                    if save and pwd:
                        pg_server.password = password
                        db.session.commit()

            except Exception as e:
                errmsg = "ERROR: " + str(e)
                json_dict['state'] = "error"
                json_dict['msg'] = errmsg
            return jsonify(json_dict)

pgstats.add_url_rule('/connect/', view_func=ConnectAPI.as_view('connect'))


class ConnStatusAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        else:
            sid = request.args.get('sid')
            gid = request.args.get('gid')
            json_dict = {}
            pg_server = Server.query.filter_by(
                id=sid,
                servergroup_id=gid,
                user_id=current_user.id
            ).first()
            if pg_server:
                json_dict['discovery_id']=pg_server.discovery_id
            try:
                manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(sid))
                conn = manager.connection()
                if conn.connected():
                    try:
                        cur = conn.conn.cursor()
                        cur.execute(version_query)
                        x = cur.fetchone()[0]
                        cur.close()
                        ver_platform = x.split(",")[0]
                        json_dict['version'] = ver_platform
                        version_info = ver_platform.split()
                        json_dict['pg_version'] = version_info[1]
                        json_dict['state'] = "success"
                        json_dict['msg'] = "Already Connected."
                        return jsonify(json_dict)
                    except Exception as e:
                        json_dict['state'] = "error"
                        json_dict['msg'] = str(e)
                        return jsonify(json_dict)
                else:
                    json_dict['state'] = "error"
                    json_dict['msg'] = "Not connected."
                    return jsonify(json_dict)

            except Exception as e:
                errmsg = "ERROR: " + str(e)
                json_dict['state'] = "error"
                json_dict['msg'] = errmsg
            return jsonify(json_dict)

pgstats.add_url_rule('/conn_status/', view_func=ConnStatusAPI.as_view('conn_status'))


class StatsAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        sid = request.args.get('sid')
        gid = request.args.get('gid')
        manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(sid))
        conn = manager.connection()

        json_dict = {}
        if not conn.connected():
            return jsonify({'msg': 'Connection is closed.', 'state':"error"})
        else:
            try:
                stats_timestamp = datetime.utcnow()
                stats_time = stats_timestamp.strftime('%Y/%m/%d %H:%M:%S')
                cur = conn.conn.cursor()
                cur.execute(connection_query)
                columns = [desc[0] for desc in cur.description]
                result = []
                for res in cur:
                    result.append(dict(zip(columns, res)))
                cur.close()
                json_dict['connections'] = {}
                for r in result:
                    json_dict['connections'][str(r['state'])] = r['count']
                cur = conn.conn.cursor()
                cur.execute(metrics_query)
                columns = [desc[0] for desc in cur.description]
                result = []
                for res in cur:
                    result.append(dict(zip(columns, res)))
                cur.close()
                tps = result[0]
                for key in tps.keys():
                    json_dict[key]=tps[key]
                json_dict['time'] = stats_time
            except Exception as e:
                errmsg = "ERROR: " + str(e)
                json_dict['state'] = "error"
                json_dict['msg'] = errmsg
            return jsonify(json_dict)

pgstats.add_url_rule('/stats/', view_func=StatsAPI.as_view('stats'))


class UptimeAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        sid = request.args.get('sid')
        gid = request.args.get('gid')
        manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(sid))
        conn = manager.connection()

        json_dict = {}
        if not conn.connected():
            return jsonify({'msg': 'Connection is closed.', 'state':"error"})
        else:
            try:
                cur = conn.conn.cursor()
                cur.execute(up_time_query)
                result = cur.fetchone()
                uptime = result[0]
                cur.close()
                import util
                up_time = util.get_readable_time_diff(str(uptime).split('.')[0], precision=2)
                json_dict['uptime'] = up_time
            except Exception as e:
                errmsg = "ERROR: " + str(e)
                json_dict['state'] = "error"
                json_dict['msg'] = errmsg
            return jsonify(json_dict)

pgstats.add_url_rule('/uptime/', view_func=UptimeAPI.as_view('uptime'))


class ActivityAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        sid = request.args.get('sid')
        gid = request.args.get('gid')
        manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(sid))
        conn = manager.connection()

        json_dict = {}
        if not conn.connected():
            return jsonify({'msg': 'Connection is closed.', 'state':"error"})
        else:
            try:
                stats_timestamp = datetime.utcnow()
                stats_time = stats_timestamp.strftime('%Y/%m/%d %H:%M:%S')
                cur = conn.conn.cursor()
                cur.execute(activity_query)
                columns = [desc[0] for desc in cur.description]
                result = []
                for res in cur:
                    result.append(dict(zip(columns, res)))
                cur.close()
                json_dict['activity'] = result
                json_dict['time'] = stats_time
            except Exception as e:
                errmsg = "ERROR: " + str(e)
                json_dict['state'] = "error"
                json_dict['msg'] = errmsg
            return jsonify(json_dict)

pgstats.add_url_rule('/activity/', view_func=ActivityAPI.as_view('activity'))


class DbListAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        sid = request.args.get('sid')
        gid = request.args.get('gid')
        manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(sid))
        conn = manager.connection()

        json_dict = {}
        if not conn.connected():
            return jsonify({'msg': 'Connection is closed.', 'state':"error"})
        else:
            try:
                stats_timestamp = datetime.utcnow()
                stats_time = stats_timestamp.strftime('%Y/%m/%d %H:%M:%S')
                cur = conn.conn.cursor()
                cur.execute(db_list_query)
                columns = [desc[0] for desc in cur.description]
                result = []
                for res in cur:
                    result.append(dict(zip(columns, res)))
                cur.close()
                json_dict['activity'] = result
                json_dict['time'] = stats_time
            except Exception as e:
                errmsg = "ERROR: " + str(e)
                json_dict['state'] = "error"
                json_dict['msg'] = errmsg
            return jsonify(json_dict)

pgstats.add_url_rule('/db_list/', view_func=DbListAPI.as_view('db_list'))


class ConfigAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        sid = request.args.get('sid')
        gid = request.args.get('gid')
        manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(sid))
        conn = manager.connection()

        json_dict = {}
        if not conn.connected():
            return jsonify({'msg': 'Connection is closed.', 'state': "error"})
        else:
            try:
                cur = conn.conn.cursor()
                cur.execute(pg_settings_query)
                columns = [desc[0] for desc in cur.description]
                result = []
                for res in cur:
                    result.append(dict(zip(columns, res)))
                cur.close()
                import itertools
                final_list = []
                for key, group in itertools.groupby(result, key=lambda x: x['category']):
                    final_list.append({'name': str(key), 'settings': list(group)})
                json_dict['settings'] = final_list
                json_dict['state'] = "success"
            except Exception as e:
                errmsg = "ERROR: " + str(e)
                json_dict['state'] = "error"
                json_dict['msg'] = errmsg
            return jsonify(json_dict)

pgstats.add_url_rule('/config/', view_func=ConfigAPI.as_view('config'))


class DBCloseAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        sid = request.args.get('sid')
        gid = request.args.get('gid')
        manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(sid))
        conn = manager.connection()
        if not conn.connected():
            return jsonify({'msg': 'Connection is already closed.', 'state': "success"})
        else:
            conn.conn.close()
            manager.update_session()
            return jsonify({'msg': 'db was closed succesfully', 'state': "success"})

pgstats.add_url_rule('/disconnect/', view_func=DBCloseAPI.as_view('disconnect'))


class CloseAllDBSessionsAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        json_dict = {}
        if not current_user:
            json_dict['state'] = "error"
            json_dict['msg'] = "Access denied."
            return jsonify(json_dict)
        servers_list = Server.query.filter_by(
            user_id=current_user.id
        )
        if servers_list.count()>0:
            for server in servers_list:
                try:
                    manager = get_driver(PG_DEFAULT_DRIVER).connection_manager(int(server.id))
                    conn = manager.connection()
                    conn.conn.close()
                except Exception as e:
                    pass
        return jsonify({"msg": "All Connection released", 'state': "success"})

pgstats.add_url_rule('/disconnectall/', view_func=CloseAllDBSessionsAPI.as_view('disconnectall'))
