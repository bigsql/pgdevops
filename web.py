####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

from flask import Flask, render_template, url_for, request, session, redirect

import os
from flask_triangle import Triangle
from flask_restful import reqparse, abort, Api, Resource
from flask_login import user_logged_in
from flask_security import auth_token_required, auth_required

import json
from Components import Components as pgc

from flask_security import login_required, roles_required, current_user, roles_accepted
# from flask_login import current_user
from flask_mail import Mail
from flask_babel import Babel, gettext
from pgadmin.utils.session import create_session_interface
from pgadmin.model import db, Role, User, Server, ServerGroup, Process, roles_users
from pgadmin.utils.crypto import encrypt, decrypt, pqencryptpassword
from flask_security import Security, SQLAlchemyUserDatastore
from pgadmin.utils.sqliteSessions import SqliteSessionInterface
from pgadmin.utils.driver import get_driver
import config
from config import PG_DEFAULT_DRIVER
from flask_restful import reqparse
from datetime import datetime, timedelta
import dateutil
import hashlib
import time
import pytz
import psutil
from pickle import dumps, loads
import csv
import sqlite3

from werkzeug.contrib.fixers import ProxyFix

parser = reqparse.RequestParser()
#parser.add_argument('data')

import platform

this_uname = str(platform.system())

PGC_HOME = os.getenv("PGC_HOME", "")
PGC_LOGS = os.getenv("PGC_LOGS", "")

config.APP_NAME = "pgDevOps"
config.LOGIN_NAME = "pgDevOps"
application = Flask(__name__)

application.wsgi_app = ProxyFix(application.wsgi_app)

babel = Babel(application)

Triangle(application)
api = Api(application)
application.config.from_object(config)

current_path = os.path.dirname(os.path.realpath(__file__))

reports_path = os.path.join(current_path, "reports")


##########################################################################
# Setup session management
##########################################################################
application.session_interface = SqliteSessionInterface(config.SESSION_DB_PATH)

application.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///{0}?timeout={1}'.format(
    config.SQLITE_PATH.replace('\\', '/'),
    getattr(config, 'SQLITE_TIMEOUT', 500)
)

application.config['WTF_CSRF_ENABLED'] = False

application.config['SECURITY_RECOVERABLE'] = True
application.config['SECURITY_CHANGEABLE'] = True
application.config['SECURITY_REGISTERABLE'] = True

application.config['SECURITY_REGISTER_URL'] = '/register'
application.config['SECURITY_CONFIRMABLE'] = False
application.config['SECURITY_SEND_REGISTER_EMAIL'] = False

application.config['SECURITY_TOKEN_MAX_AGE'] = 600

application.permanent_session_lifetime = timedelta(minutes=10)

db.init_app(application)
Mail(application)
import pgadmin.utils.paths as paths

paths.init_app(application)

#Enviornment variable for restrict api action commands
os.environ['IS_DEVOPS'] = "True"

def before_request():
    if not current_user.is_authenticated and request.endpoint == 'security.login' and no_admin_users():
        return redirect(url_for('security.register'))
    if not current_user.is_authenticated and request.endpoint == 'security.register' and not no_admin_users():
        return redirect(url_for('security.login'))

application.before_request(before_request)

from forms import RegisterForm, check_ami

# Setup Flask-Security
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(application, user_datastore, register_form=RegisterForm)

from flask_security.signals import user_registered

is_ami = check_ami()

def no_admin_users():
    if not len(User.query.filter(User.roles.any(name='Administrator'), User.active == True).all()) > 0:
        return True
    return False


@user_registered.connect_via(application)
def on_user_registerd(app, user, confirm_token):
    sg = ServerGroup(
        user_id=user.id,
        name="Servers")
    db.session.add(sg)
    if is_ami.get('rc') != 2:
        session['initial-logged-in'] = True
    db.session.commit()
    default_user = user_datastore.get_user('bigsql@bigsql.org')
    if not len(User.query.filter(User.roles.any(name='Administrator'),User.active==True).all()) > 0 :
        if default_user is not None and default_user.has_role('Administrator') and not default_user.active:
            db.session.delete(default_user)
            db.session.commit()
        user_datastore.add_role_to_user(user.email, 'Administrator')
        return
    user_datastore.add_role_to_user(user.email, 'User')


@user_logged_in.connect_via(application)
def on_user_logged_in(sender, user):
    try:
        from pgadmin.model import UserPreference, Preferences
        bin_pref = Preferences.query.filter_by(
            name="pg_bin_dir"
        ).order_by("id").first()
        check_pref = UserPreference.query.filter_by(
                        pid=bin_pref.id,
                        uid=user.id
                    ).order_by("pid")
        if check_pref.count() > 0:
            pass
        else:
            path = None
            for p in ["pg10", "pg96", "pg95", "pg94"]:
                bin_path = os.path.join(PGC_HOME, p, "bin")
                if os.path.exists(bin_path):
                    path = bin_path
                    break
            if path:
                pref = UserPreference(
                    pid=bin_pref.id,
                    uid=user.id,
                    value=path
                )
                db.session.add(pref)
                db.session.commit()
    except Exception as e:
        pass

from pgstats import pgstats
application.register_blueprint(pgstats, url_prefix='/pgstats')

from credentials import credentials
application.register_blueprint(credentials, url_prefix='/api/pgc/credentials')

from CloudHandler import cloud
application.register_blueprint(cloud, url_prefix='/api/pgc/instances')

from CloudCreateHandler import _cloud_create
application.register_blueprint(_cloud_create, url_prefix='/api/pgc/create')

from ProvisionHandler import _pgc_provision
application.register_blueprint(_pgc_provision, url_prefix='/api/pgc/provision')

from BackupRestore import _backrest
application.register_blueprint(_backrest, url_prefix='/api/pgc')

from login_controller import _user
application.register_blueprint(_user, url_prefix='/api/login')

from UserHandler import _user_management
application.register_blueprint(_user_management, url_prefix='/api/user')

db_session = db.session

class pgcRestApi(Resource):
    @auth_required('token', 'session')
    def get(self, arg):
        if current_user.has_role("Developer"):
            non_admin_cmds = ['list', 'lablist', 'info', 'status', 'register', 'metalist']
            if arg.split(" ")[0] in non_admin_cmds:
                data = pgc.get_data(arg)
                return data
            return unauth_handler()
        data = pgc.get_data(arg)
        return data

api.add_resource(pgcRestApi,
                 '/api/pgc/<string:arg>')


class checkInitLogin(Resource):
    @auth_required('token', 'session')
    def get(self):
        if is_ami.get('rc') != 2 and session.get('initial-logged-in'):
            session['initial-logged-in'] = False
            return True
        return False

api.add_resource(checkInitLogin,
                 '/check_init_login')


class pgcUtilRelnotes(Resource):
    @auth_required('token', 'session')
    def get(self, comp, version=None):
        json_dict = {}
        v=version
        import mistune, util, sys
        if version == None:
            rel_notes = unicode(str(util.get_relnotes (comp)),sys.getdefaultencoding(),errors='ignore').strip()
        else:
            rel_notes=unicode(str(util.get_relnotes (comp, version)),sys.getdefaultencoding(),errors='ignore').strip()
        json_dict['component'] = comp
        json_dict['relnotes'] = mistune.markdown(rel_notes)
        # # json_dict['plainText'] = rel_notes
        data = json.dumps([json_dict])
        return data


api.add_resource(pgcUtilRelnotes, '/api/utilRelnotes/<string:comp>','/api/utilRelnotes/<string:comp>/<string:version>')


class pgcApiHostCmd(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self, pgc_cmd, host_name,pwd=None):
        password=pwd
        pwd_session_name = "{0}_pwd".format(host_name)
        if session.get("hostname", "") == host_name:
            if not pwd and session.get(pwd_session_name):
                password =  session.get(pwd_session_name)
            else:
                session[pwd_session_name] = pwd
        elif host_name is None or host_name in ("",  "localhost"):
            pwd_session_name="localhost_pwd"
            if not pwd and session.get(pwd_session_name):
                password = session.get(pwd_session_name)
            else:
                session[pwd_session_name] = pwd
        session['hostname'] = host_name
        data = pgc.get_data(pgc_cmd, pgc_host=host_name, pwd=password)
        if len(data)>0 and data[0].get("pwd_failed"):
            if session.get(pwd_session_name):
                session.pop(pwd_session_name)
        return data


api.add_resource(pgcApiHostCmd,
                 '/api/hostcmd/<string:pgc_cmd>/<string:host_name>',
                 '/api/hostcmd/<string:pgc_cmd>/<string:host_name>/<string:pwd>/')



class pgdgCommand(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator','User')
    def get(self, repo_id, pgc_cmd, host=None, pwd=None):
        password = pwd
        pwd_session_name = "{0}_pwd".format(host)
        if session.get("hostname", "") == host:
            if not pwd and session.get(pwd_session_name):
                password = session.get(pwd_session_name)
            else:
                session[pwd_session_name] = pwd
        elif host is None or host in ("", "localhost"):
            pwd_session_name = "localhost_pwd"
            if not pwd and session.get("localhost_pwd"):
                password = session.get("localhost_pwd")
            else:
                session['localhost_pwd'] = pwd
        data = pgc.get_pgdg_data(repo_id, pgc_cmd, pgc_host=host, pwd=password)
        if len(data)>0 and data[0].get("pwd_failed"):
            if session.get(pwd_session_name):
                session.pop(pwd_session_name)
        return data


api.add_resource(pgdgCommand,
                 '/api/pgdg/<string:repo_id>/<string:pgc_cmd>',
                 '/api/pgdg/<string:repo_id>/<string:pgc_cmd>/<string:host>',
                 '/api/pgdg/<string:repo_id>/<string:pgc_cmd>/<string:host>/<string:pwd>')

class pgdgHostCommand(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator','User')
    def get(self, repo_id, pgc_cmd, comp, host=None):
        data = pgc.get_pgdg_data(repo_id, pgc_cmd, component=comp, pgc_host=host)
        return data


api.add_resource(pgdgHostCommand, '/api/pgdghost/<string:repo_id>/<string:pgc_cmd>/<string:comp>',
                 '/api/pgdghost/<string:repo_id>/<string:pgc_cmd>/<string:comp>/<string:host>')


class TestConn(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        username = request.args.get('user')
        password = request.args.get('password')
        ssh_key = request.args.get('ssh_key')
        sudo_pwd = request.args.get('ssh_sudo_pwd')
        host = request.args.get('host')
        from PgcRemote import PgcRemote
        json_dict = {}
        try:
            remote = PgcRemote(host, username, password=password, ssh_key=ssh_key, sudo_pwd=sudo_pwd)
            if not sudo_pwd:
                remote.connect()
            json_dict['state'] = "success"
            json_dict['msg'] = "Testing Connection Successful."
            data = json.dumps([json_dict])
            remote.disconnect()
        except Exception as e:
            errmsg = "ERROR: Cannot connect to " + username + "@" + host + " - " + str(e)
            json_dict['state'] = "error"
            json_dict['msg'] = errmsg
            data = json.dumps([json_dict])
        return data

api.add_resource(TestConn, '/api/testConn')


from responses import Result, InvalidParameterResult, ServerErrorResult

class TestCloudConnection(Resource):
    @auth_required('token', 'session')
    def post(self):
        payload = request.get_json()['params']
        if not set(("cloud_type","credentials")).issubset(payload):
            return InvalidParameterResult(errors = ["Both cloud_type and credentials are required"]).http_response()
        if payload["cloud_type"] not in ('aws','azure','vmware'):
            return InvalidParameterResult(errors=["Possible values for cloud_type are aws/azure/vmware"]).http_response()

        pgcCmd = "test-cred --cloud="+payload["cloud_type"]
        pgcCmd = pgcCmd + " --credentials \'" + json.dumps(payload["credentials"]) + "\'"
        data = pgc.get_cmd_data(pgcCmd)
        if len(data) == 0:
            return ServerErrorResult().http_response()
        if data[0]['state'] != 'info' or data[0]['state'] == 'completed':
            return ServerErrorResult(state=data[0]['state'],message=data[0].get('msg')).http_response()
        return Result(200,data[0]['state'], data[0]['msg']).http_response()

api.add_resource(TestCloudConnection, '/api/testCloudConn')

class checkUser(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):

        host = request.args.get('hostname')
        cred_name = request.args.get('cred_name')
        import util
        cred_info = util.get_credentials_by_name(cred_name)
        enc_secret = util.get_value("GLOBAL", "SECRET", "")
        enc_key = "{0}{1}".format(enc_secret, cred_info.get("cred_uuid"))
        username = cred_info.get("ssh_user")
        password= ""
        if cred_info.get("ssh_passwd"):
            password = decrypt(cred_info.get("ssh_passwd"),enc_key)
        ssh_key = ""
        if cred_info.get("ssh_key"):
            ssh_key = decrypt(cred_info.get("ssh_key"), enc_key)
        sudo_pwd = ""
        if cred_info.get("ssh_sudo_pwd"):
            sudo_pwd = decrypt(cred_info.get("ssh_sudo_pwd"), enc_key)
        # username = request.args.get('username')
        # password = request.args.get('password')
        # ssh_key = request.args.get('ssh_key')
        # sudo_pwd = request.args.get('sudo_pwd', None)
        from PgcRemote import PgcRemote
        json_dict = {}
        try:
            remote = PgcRemote(host, username, password=password, ssh_key=ssh_key, sudo_pwd=sudo_pwd)
            if not sudo_pwd:
                remote.connect()
            json_dict['state'] = "success"
            try:
                remote_pgc_path = remote.get_exixting_pgc_path()
                for key in remote_pgc_path.keys():
                    json_dict[key] = remote_pgc_path[key]
            except Exception as e:
                print (str(e))
                pass
            data = json.dumps([json_dict])
            remote.disconnect()
        except Exception as e:
            errmsg = "ERROR: Cannot connect to " + username + "@" + host + " - " + str(e)
            json_dict['state'] = "error"
            json_dict['msg'] = errmsg
            data = json.dumps([json_dict])
        return data

api.add_resource(checkUser, '/api/checkUser')


class checkHostAccess(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self):
        host = request.args.get('hostname')
        check_sudo_password = request.args.get('pwd')
        pgc_host_info = util.get_pgc_host(host)

        pgc_host = pgc_host_info.get('host')
        ssh_cred_id = pgc_host_info.get('ssh_cred_id')
        cred_info = util.get_credentials_by_uuid(ssh_cred_id)
        enc_secret = util.get_value("GLOBAL", "SECRET", "")
        enc_key = "{0}{1}".format(enc_secret, cred_info.get("cred_uuid"))
        pgc_user = cred_info.get("ssh_user")
        pgc_passwd= ""
        if cred_info.get("ssh_passwd"):
            pgc_passwd = decrypt(cred_info.get("ssh_passwd"),enc_key)
        pgc_ssh_key = ""
        if cred_info.get("ssh_key"):
            pgc_ssh_key = decrypt(cred_info.get("ssh_key"), enc_key)
        util.update_cred_used(cred_info.get("cred_uuid"))
        

        from PgcRemote import PgcRemote
        json_dict = {}
        try:
            remote = PgcRemote(pgc_host, pgc_user, password=pgc_passwd, ssh_key=pgc_ssh_key, sudo_pwd=check_sudo_password)
            remote.connect()
            is_sudo = remote.has_root_access()
            json_dict['state'] = "success"
            json_dict['isSudo'] = is_sudo
            data = json.dumps([json_dict])
            remote.disconnect()
        except Exception as e:
            errmsg = "ERROR: Cannot connect to " + username + "@" + host + " - " + str(e)
            json_dict['state'] = "error"
            json_dict['msg'] = errmsg
            data = json.dumps([json_dict])
        return data

api.add_resource(checkHostAccess, '/api/checkUserAccess')


class initPGComp(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self, host, comp, pgpasswd, username=None, password=None):
        from PgcRemote import PgcRemote
        json_dict = {}
        if password == None or username == None:
            import util
            pgc_host_info = util.get_pgc_host(host)
            ssh_host = pgc_host_info.get('host')
            ssh_host_name = pgc_host_info.get('host_name')
            ssh_cred_id = pgc_host_info.get('ssh_cred_id')
            cred_info = util.get_credentials_by_uuid(ssh_cred_id)
            enc_secret = util.get_value("GLOBAL", "SECRET", "")
            enc_key = "{0}{1}".format(enc_secret, cred_info.get("cred_uuid"))
            ssh_username = cred_info.get("ssh_user")
            password= ""
            if cred_info.get("ssh_passwd"):
                ssh_password = decrypt(cred_info.get("ssh_passwd"),enc_key)
            ssh_key = ""
            if cred_info.get("ssh_key"):
                ssh_key = decrypt(cred_info.get("ssh_key"), enc_key)
            sudo_pwd = ""
            if cred_info.get("ssh_sudo_pwd"):
                sudo_pwd = decrypt(cred_info.get("ssh_sudo_pwd"), enc_key)
            is_sudo = pgc_host_info.get('is_sudo')
            util.update_cred_used(cred_info.get("cred_uuid"))
        try:
            remote = PgcRemote(ssh_host, ssh_username, password=ssh_password, ssh_key=ssh_key)
            remote.connect()
            is_file_added = remote.add_file('/tmp/.pgpass', pgpasswd)
            remote.disconnect()
            data = pgc.get_data("init", comp, ssh_host_name, '/tmp/.pgpass')
        except Exception as e:
            errmsg = "ERROR: Cannot connect to " + ssh_username + "@" + ssh_host + " - " + str(e.args[0])
            json_dict['state'] = "error"
            json_dict['msg'] = errmsg
            data = json.dumps([json_dict])
        return data

api.add_resource(initPGComp, '/api/initpg/<string:host>/<string:comp>/<string:pgpasswd>','/api/initpg/<string:host>/<string:comp>/<string:pgpasswd>/<string:username>/<string:password>')


class bamUserInfo(Resource):
    @auth_required('token', 'session')
    def get(self):
        userInfo = {}
        if current_user.is_authenticated:
            userInfo['email'] = current_user.email
            userInfo['isAdmin'] = current_user.has_role("Administrator")
            email_md5=hashlib.md5( current_user.email.lower() ).hexdigest()
            gravtar_url="https://www.gravatar.com/avatar/"+ email_md5 + "?d=retro"
            userInfo['gravatarImage']=gravtar_url
        return userInfo


api.add_resource(bamUserInfo, '/api/userinfo')

class checkUserRole(Resource):
    @auth_required('token', 'session')
    def get(self):
        result = {}
        if current_user.has_role("Developer"):
            result['code'] = 1
            result['role'] = "Developer"
        else:
            result['code'] = 0
        return result


api.add_resource(checkUserRole, '/api/checkUserRole')


class getRecentReports(Resource):
    @auth_required('token', 'session')
    def get(self, report_type):
        recent_reports_path = os.path.join(reports_path, report_type)
        jsonDict = {}
        jsonList = []
        if os.path.isdir(recent_reports_path):
            mtime = lambda f: os.stat(os.path.join(recent_reports_path, f)).st_mtime
            sorted_list=sorted(os.listdir(recent_reports_path),
                                        key=mtime, reverse=True)
            for d in sorted_list:
                if d.endswith(".html"):
                    jsonDict = {}
                    html_file_path = os.path.join(recent_reports_path, d)
                    jsonDict['file']=d
                    jsonDict["file_link"] = "reports/"+report_type+"/"+d
                    mtime=os.stat(html_file_path).st_mtime
                    mdate=datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                    jsonDict['mtime']=mdate
                    jsonList.append(jsonDict)
        return {'data':jsonList}


api.add_resource(getRecentReports, '/api/getrecentreports/<string:report_type>')

class CheckConn(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def post(self):
        result = {}
        args = request.json.get('params')
        host = args.get('host')
        user = args.get('username')
        password = args.get('password')
        dbname = args.get('dbname')
        port = args.get('port')
        try:
            from PgInstance import PgInstance
            remoteConn = PgInstance(str(host),str(user), str(dbname), int(port), str(password))
            remoteConn.connect()
            remoteConn.close()
            result['error'] = 0
            result['msg'] = 'Sucessfully Connected.'
            return result
        except Exception as e:
            result['error'] = 1
            result['msg'] = str(e)
            return result


api.add_resource(CheckConn, '/check_pg_conn')

class GenerateReports(Resource):
    @auth_required('token', 'session')
    def post(self):
        args = request.json['data']
        from ProfilerReport import ProfilerReport
        try:
            plReport = ProfilerReport(args)
            report_file = plReport.generateSQLReports(args.get('pgQuery'),
                                                      args.get('pgTitle'),
                                                      args.get('pgDesc'))
            result = {}
            result['report_file'] = report_file
            result['error'] = 0
        except Exception as e:
            #import traceback
            #print traceback.format_exc()
            #print e
            result = {}
            result['error'] = 1
            result['msg'] = str(e)
        return result


api.add_resource(GenerateReports, '/api/generate_profiler_reports')


class RemoveReports(Resource):
    @auth_required('token', 'session')
    def post(self,report_type):
        from ProfilerReport import ProfilerReport
        try:
            recent_reports_path = os.path.join(reports_path, report_type)
            for fileName in request.json:
                os.remove(os.path.join(recent_reports_path, fileName))
            result = {}
            result['msg'] = 'success'
            result['error'] = 0
        except Exception as e:
            result = {}
            result['error'] = 1
            result['msg'] = str(e)
            print e
        return result


api.add_resource(RemoveReports, '/api/remove_reports/<string:report_type>')


class GetEnvFile(Resource):
    @auth_required('token', 'session')
    def get(self, comp):
        import util
        try:
            result = dict()
            util.read_env_file(comp)
            result['PGUSER'] = os.environ['PGUSER']
            result['PGDATABASE'] = os.environ['PGDATABASE']
            result['PGPORT'] = os.environ['PGPORT']
        except Exception as e:
            result = {}
            result['error'] = 1
            result['msg'] = str(e)
        return result

api.add_resource(GetEnvFile, '/api/read/env/<string:comp>')


class AddtoMetadata(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator','User')
    def post(self):
        def add_to_pginstances(pg_arg):
            server_id = None
            try:
                component_name = pg_arg.get("component")
                component_port = pg_arg.get("port", 5432)
                component_host = pg_arg.get("host", "localhost")
                component_proj = pg_arg.get("project")
                component_db = pg_arg.get("db", "postgres")
                component_user = pg_arg.get("user", "postgres")
                gid = pg_arg.get("gid")
                sid = pg_arg.get("sid")
                servergroup_id=1
                is_rds = pg_arg.get("rds")
                is_new =True
                discovery_id = "BigSQL PostgreSQL"
                if is_rds:
                    discovery_id = "RDS"
                    servername = component_name
                    server_group_name = pg_arg.get("region", "AWS RDS")
                    rds_serverGroup = ServerGroup.query.filter_by(
                        user_id=current_user.id,
                        name=server_group_name
                    ).order_by("id")
                    if rds_serverGroup.count() > 0:
                        servergroup = rds_serverGroup.first()
                        servergroup_id = servergroup.id
                    else:
                        try:
                            sg = ServerGroup(
                                user_id=current_user.id,
                                name=server_group_name)
                            db.session.add(sg)
                            db.session.commit()
                            servergroup_id = sg.id
                        except sqlite3.IntegrityError as e:
                            err_msg = str(e)
                            if err_msg.find("UNIQUE constraint failed") >= 0:
                                rds_serverGroup = ServerGroup.query.filter_by(
                                    user_id=current_user.id,
                                    name=server_group_name
                                ).order_by("id")
                                if rds_serverGroup.count() > 0:
                                    servergroup = rds_serverGroup.first()
                                    servergroup_id = servergroup.id
                            else:
                                print (err_msg)
                                result = {}
                                result['error'] = 1
                                result['msg'] = err_msg
                                return result
                else:
                    if gid:
                        servername=component_name
                        servergroup_id=gid
                        if sid:
                            component_server = Server.query.filter_by(
                                id=sid,
                                user_id=current_user.id,
                            ).first()
                            is_new=False
                            
                    else:
                        servername = "{0}({1})".format(component_name, component_host)

                        if component_host in ("localhost", ""):
                            component_host = "localhost"
                            servername = "{0}({1})".format(component_name, component_host)
                        else:
                            import util
                            host_info = util.get_pgc_host(component_host)
                            component_host = host_info.get('host')
                        if component_host == '':
                            component_host = pg_arg.get("host", "localhost")
                        user_id = current_user.id
                        servergroups = ServerGroup.query.filter_by(
                            user_id=user_id
                        ).order_by("id")

                        if servergroups.count() > 0:
                             servergroup = servergroups.first()
                             servergroup_id = servergroup.id
                        else:
                             sg = ServerGroup(
                                 user_id=current_user.id,
                                 name="Servers")
                             db.session.add(sg)
                             db.session.commit()
                             servergroup_id = sg.id

                            
                component_server = Server.query.filter_by(
                    name=servername,
                    host=component_host,
                    servergroup_id=servergroup_id,
                    port=component_port
                ).first()
                if component_server:
                    is_new=False
                else:
                    is_new=True

                if is_new:
                    svr = Server(user_id=current_user.id,
                                 servergroup_id=servergroup_id,
                                 name=servername,
                                 host=component_host,
                                 port=component_port,
                                 maintenance_db=component_db,
                                 username=component_user,
                                 ssl_mode='prefer',
                                 comment=component_proj,
                                 discovery_id=discovery_id)

                    db_session.add(svr)
                    db_session.commit()
                    server_id = svr.id
                else:
                    component_server.servergroup_id=servergroup_id
                    component_server.name=servername
                    component_server.host=component_host
                    component_server.port=component_port
                    component_server.maintenance_db=component_db
                    component_server.username=component_user
                    db_session.commit()

            except Exception as e:
                print ("Failed while adding/updating pg instance in metadata :")
                print (str(e))
                pass
            return server_id
        result = {}
        result['error'] = 0
        args = request.json.get("params")

        is_multiple = args.get("multiple")
        remote_host = args.get("remotehost")
        if is_multiple:
            for pg_data in args.get("multiple"):
                server_id = add_to_pginstances(pg_data)
        else:
            if remote_host:
                components_list = pgc.get_data("status", pgc_host=remote_host)
                for c in components_list:
                    if c.get("category") == 1 and c.get("state") != "Not Initialized":
                        comp_args = {}
                        comp_args['component'] = c.get("component")
                        comp_args['port'] = c.get("port")
                        comp_args['host'] = remote_host
                        server_id = add_to_pginstances(comp_args)
            else:
                server_id = add_to_pginstances(args)
        result['sid'] = server_id
        return result


api.add_resource(AddtoMetadata, '/api/add_to_metadata')


class DeleteFromMetadata(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def post(self):
        args = request.json
        gid = args.get('gid')
        sid = args.get('sid')
        result = {}

        servers = Server.query.filter_by(user_id=current_user.id, id=sid)

        if servers is None:
            result['error'] = 1
            result['msg'] = 'The specified server could not be found. Does the user have permission to access the server?'

        else:
            try:
                for s in servers:
                    get_driver(PG_DEFAULT_DRIVER).delete_manager(s.id)
                    db.session.delete(s)
                db.session.commit()
            except Exception as e:
                result['error'] = 1
                result['msg'] = e.message
                return result

        result['error'] = 0
        result['msg'] = "Server deleted"
        return result
        
api.add_resource(DeleteFromMetadata, '/api/delete_from_metadata')


def get_process_status(process_log_dir,line_count=None):
    process_dict = {}
    status_file = os.path.join(process_log_dir, "status")
    if os.path.exists(status_file):
        with open(status_file) as data_file:
            data = json.load(data_file)
            process_dict = data
            err_file = os.path.join(process_log_dir, "err")
            out_file = os.path.join(process_log_dir, "out")
            exit_code = process_dict.get("exit_code", None)
            err_data_content = None
            out_data_content = None
            process_dict['out_data'] = ""
            with open(out_file) as out_data:
                if line_count is None:
                    out_data_content = out_data.readlines()
                else:
                    out_data_content = out_data.readlines()[-line_count:]
                    line_count = line_count - len(out_data_content)
                out_data_content = "".join(out_data_content).replace("\r", "\n").strip()

            with open(err_file) as err_data:
                if line_count is None:
                    err_data_content = err_data.readlines()
                else:
                    err_data_content = err_data.readlines()[-line_count:]
                err_data_content = "".join(err_data_content).replace("\r", "\n").strip()

            if err_data_content and out_data_content:
                process_dict['out_data'] = '\n'.join([out_data_content, err_data_content])
            elif err_data_content:
                process_dict['out_data'] = err_data_content
            elif out_data_content:
                process_dict['out_data'] = out_data_content
    return process_dict


def get_current_time(format='%Y-%m-%d %H:%M:%S.%f %z'):
    """
    Generate the current time string in the given format.
    """
    return datetime.utcnow().replace(
        tzinfo=pytz.utc
    ).strftime(format)


class pgdgAction(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator','User')
    def post(self):
        result = {}
        args = request.json
        component_name = args.get("component")
        component_host = args.get("host","localhost")
        pwd=args.get("pwd")
        pwd_session_name = "{0}_pwd".format(component_host)
        if session.get("hostname", "") == component_host:
            if not pwd and session.get(pwd_session_name):
                pwd = session.get(pwd_session_name)
        session['hostname'] = component_host
        if pwd:
            session[pwd_session_name] = pwd
        repo = args.get("repo")
        action = args.get("action")
        from detached_process import detached_process
        ctime = get_current_time(format='%y%m%d%H%M%S%f')
        if action=="register" or action=="unregister":
            report_cmd = PGC_HOME + os.sep + "pgc " + action + " REPO " + repo + " -y"
        else:
            report_cmd = PGC_HOME + os.sep + "pgc repo-pkgs " + repo + " " + action + " " + component_name
        if not pwd:
            report_cmd = report_cmd + " --no-tty"
        isLocal = True
        if component_host and component_host != "localhost":
            isLocal = False
            report_cmd = report_cmd + " --host \"" + component_host + "\""
        if this_uname == "Windows":
            report_cmd = report_cmd.replace("\\", "\\\\")
        process_status = detached_process(report_cmd, ctime, stdin_str=pwd, is_local=isLocal)
        result['error']=None
        result['status'] =process_status['status']
        result['log_dir'] = process_status['log_dir']
        result['process_log_id'] = process_status['process_log_id']
        result['cmd'] = report_cmd
        return result
        
api.add_resource(pgdgAction, '/api/pgdgAction')


class GenerateBadgerReports(Resource):
    @auth_required('token', 'session')
    def post(self):
        result = {}
        args = request.json
        log_files=args.get("log_files")
        db=args.get("db")
        jobs=args.get("jobs")
        log_prefix=args.get("log_prefix")
        title=args.get("title")
        try:
            from BadgerReport import BadgerReport
            ctime = get_current_time(format='%y%m%d%H%M%S%f')
            badgerRpts = BadgerReport()
            pid_file_path = os.path.join(config.SESSION_DB_PATH,"process_logs", ctime)
            report_file = badgerRpts.generateReports(log_files, db, jobs, log_prefix, title, ctime, pid_file_path)
            process_log_dir = report_file['log_dir']
            report_status = get_process_status(process_log_dir)
            result['pid'] = report_status.get('pid')
            result['exit_code'] = report_status.get('exit_code')
            result['process_log_id'] = report_file["process_log_id"]
            if report_status.get('exit_code') is None:
                result['in_progress'] = True
                try:
                    j = Process(
                        pid=int(report_file["process_log_id"]), command=report_file['cmd'],
                        logdir=process_log_dir, desc=dumps("pgBadger Report"), user_id=current_user.id,
                        acknowledge='pgDevOps'
                    )
                    db_session.add(j)
                    db_session.commit()
                except Exception as e:
                    print str(e)
                    pass
                """bg_process={}
                bg_process['process_type'] = "badger"
                bg_process['cmd'] = report_file['cmd']
                bg_process['file'] = report_file['file']
                bg_process['report_file'] = report_file['report_file']
                bg_process['process_log_id'] = report_file["process_log_id"]"""
            if report_file['error']:
                result['error'] = 1
                result['msg'] = report_file['error']
            else:
                result['error'] = 0
                result['report_file'] = report_file['file']
                report_file_path = os.path.join(reports_path, report_file['file'])
                if not os.path.exists(report_file_path):
                    result['error'] = 1
                    result['msg'] = "Check the parameters provided."
        except Exception as e:
            import traceback
            result = {}
            result['error'] = 1
            result['msg'] = str(e)
        time.sleep(2)
        return result

api.add_resource(GenerateBadgerReports, '/api/generate_badger_reports')

class ComparePGVersions(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self, host):
        result={}
        local_pg_ver = pgc.get_data('info')[0]['version']
        result['local_pg_ver'] = local_pg_ver
        remote_pg_ver = pgc.get_data('info', pgc_host=host)[0]['version']
        result['remote_pg_ver'] = remote_pg_ver
        if local_pg_ver == remote_pg_ver:
            result_code = 0
        elif local_pg_ver > remote_pg_ver:
            result_code = 1
        elif local_pg_ver < remote_pg_ver:
            result_code = 2
        result['result_code'] = result_code
        return result

api.add_resource(ComparePGVersions, '/api/compare_pg_versions/<string:host>')

class GetBgProcessList(Resource):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def get(self, process_type=None):
        from sqlalchemy import desc
        result={}
        if process_type:
            #processes = Process.query.filter_by(user_id=current_user.id, desc=dumps(str(process_type))).order_by(db.func.COALESCE(Process.end_time,datetime.now()).desc(),Process.start_time.desc()).limit(100)
            processes = Process.query.filter_by(user_id=current_user.id, desc=dumps(str(process_type))).order_by(
                Process.start_time.desc()).limit(100)
        else:
            processes = Process.query.filter_by(user_id=current_user.id).order_by(Process.start_time.desc()).limit(100)
        clean_up_old_process=False
        result['process'] = []
        for p in processes:
            proc_log_dir = os.path.join(config.SESSION_DB_PATH,
                                        "process_logs",
                                        p.pid)
            if os.path.exists(proc_log_dir):
                proc_status = get_process_status(proc_log_dir)
                if p.acknowledge or proc_status.get("end_time") or p.end_time:
                    '''clean_up_old_process=True
                    db_session.delete(p)
                    try:
                        import shutil
                        shutil.rmtree(proc_log_dir, True)
                    except Exception as e:
                        pass
                    continue'''
                    pass
                try:
                    stime = dateutil.parser.parse(proc_status.get("start_time"))
                    etime = dateutil.parser.parse(proc_status.get("end_time",get_current_time()))
                    from utils import get_readable_time_diff
                    execution_time = get_readable_time_diff((etime - stime).total_seconds())
                    proc_status['execution_time'] = execution_time
                except Exception as e:
                    print e
                    pass
                proc_status['process_failed'] = False
                proc_status['process_completed'] = True
                if proc_status.get("exit_code") is None:
                    proc_status['process_completed'] = False
                    if not psutil.pid_exists(proc_status.get('pid')):
                        proc_status['process_completed'] = True
                        proc_status['process_failed'] = True
                        proc_status['error_msg'] = "Background process terminated unexpectedly."
                elif proc_status.get("exit_code") != 0:
                    proc_status['process_failed'] = True
                proc_status['process_log_id'] = p.pid
                #proc_status['process_type'] = "badger"
                if proc_status.get('report_file'):
                    proc_status['file'] = "badger/" + proc_status.get('report_file')
                    proc_status['report_file'] = proc_status.get('report_file')
                result['process'].append(proc_status)
        if clean_up_old_process:
            db_session.commit()
        return result

api.add_resource(GetBgProcessList, '/api/bgprocess_list', '/api/bgprocess_list/<string:process_type>')


class GetBgProcessStatus(Resource):
    @auth_required('token', 'session')
    def get(self,process_log_id):
        result = {}
        args = request.args
        line_count = None
        if 'line_count' in args:
            try:
                line_count = int(args['line_count'])
            except Exception as ex:
                result['exit_code'] = 3
                result['process_failed'] = True
                result['error_msg'] = str(ex)
                return result

        proc_log_dir = os.path.join(config.SESSION_DB_PATH,
                                    "process_logs",
                                    process_log_id)
        proc_status = get_process_status(proc_log_dir,line_count=line_count)
        proc_status['log_dir'] = proc_log_dir
        p = Process.query.filter_by(
            pid=process_log_id, user_id=current_user.id
        ).first()
        try:
            if p.start_time is None or p.end_time is None:
                p.start_time = proc_status['start_time']
                if 'exit_code' in proc_status and \
                                proc_status['exit_code'] is not None:
                    p.exit_code = proc_status['exit_code']

                    # We can't have 'end_time' without the 'exit_code'.
                    if 'end_time' in proc_status and proc_status['end_time']:
                        p.end_time = proc_status['end_time']
                db_session.commit()
        except Exception as e:
            pass

        stime = dateutil.parser.parse(proc_status.get("start_time"))
        etime = dateutil.parser.parse(proc_status.get("end_time") or get_current_time())
        from utils import get_readable_time_diff
        execution_time = get_readable_time_diff((etime - stime).total_seconds())

        proc_status['execution_time'] = execution_time
        proc_status['error_msg']=""
        proc_status['process_log_id'] = process_log_id
        proc_status['process_failed'] = False
        proc_status['process_completed'] = True
        if proc_status.get("exit_code")==2 and (proc_status.get("process_type")=="backup" or proc_status.get("process_type")=="restore") :
            try:
                out_data = proc_status.get("out_data").strip().split(":")
                if out_data[0].strip() == "ERROR" and out_data[1].strip() == "component_required":
                    proc_status['component_required'] = out_data[2].strip()
            except Exception as e:
                pass
        #proc_status['process_type'] = "badger"
        if proc_status.get("exit_code") is None:
            proc_status['process_completed'] = False
            if proc_status.get('pid'):
                if not psutil.pid_exists(proc_status.get('pid')):
                    proc_status['process_completed'] = True
                    proc_status['process_failed'] = True
                    proc_status['error_msg'] = "Background process terminated unexpectedly."
        elif proc_status.get("exit_code") != 0:
            proc_status['process_failed'] = True
            proc_status['error_msg'] = "Background process terminated unexpectedly."
        if proc_status.get('report_file'):
            proc_status['file'] = "badger/" + proc_status.get('report_file')
            proc_status['report_file'] = proc_status.get('report_file')

        result=proc_status
        return result

api.add_resource(GetBgProcessStatus, '/api/bgprocess_status/<string:process_log_id>')

@application.route('/api/dirlist', methods = ['POST'])
@auth_required('token', 'session')
@roles_accepted('Administrator', 'User')
def dirlist():
    """
        Method to get the list of directories available in remote server or local in specific directory.
        :return: It yields json string for the list of components.
    """
    data = request.json
    pgc_host = data.get("pgcHost")
    base_dir = data.get("baseDir",os.path.expanduser('~'))
    cmd = 'dirlist "'+base_dir + '"'
    if pgc_host not in["","localhost"]:
        cmd = cmd + ' --host "' + pgc_host + '"'
    result = pgc.get_data(cmd)
    return json.dumps(result)

@application.route('/list')
@login_required
def list():
    """
    Method to get the list of components available.
    :return: It yields json string for the list of components.
    """
    data = pgc.get_data("list")
    if request.is_xhr:
        return json.loads(data)
    return render_template('status.html', data=data)


@application.route('/details/<component>')
@login_required
def details(component):
    """
    Method to get the list of components available.
    :return: It yields json string for the list of components.
    """
    data = pgc.get_data("info", component)
    if request.is_xhr:
        return json.dumps(data)
    return render_template('status.html', data=data)


@application.route('/status')
@login_required
def status():
    """
    Method to get the list of components available.
    :return: It yields json string for the list of components.
    """
    data = pgc.get_data("status")
    return render_template('status.html', data=data)


@application.route('/')
@login_required
# @roles_accepted('Administrator','User')
def home():
    return render_template('index.html',
                               user=current_user,
                               is_admin=current_user.has_role("Administrator"))
    

from responses import InvalidSessionResult

def unauth_handler():
    return InvalidSessionResult().http_response()

security.unauthorized_handler(unauth_handler)
