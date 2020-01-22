import os
import platform
import time

from pgadmin.model import db, Process
from utils import get_current_time, get_process_status

from flask_security import current_user, login_required, roles_accepted, auth_required
from flask import Blueprint, request, jsonify
from flask.views import MethodView
from pickle import dumps

from responses import InvalidParameterResult, ServerErrorResult, Result
PGC_HOME = os.getenv("PGC_HOME", "")
this_uname = str(platform.system())

_backrest = Blueprint('_backrest', __name__, url_prefix='/api/pgc')

def validate_backup_fields(args):
    if all(name in args for name in ('host','dbName','port','username','sshServer','backupDirectory','fileName','format','advOptions')):
        return True
    else:
        return False

db_session = db.session

class BackupAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def post(self):
        result = {}
        args = request.json
        if not validate_backup_fields(args):
            return InvalidParameterResult().http_response()
        try:
            from BackupRestore import BackupRestore
            backuprestore = BackupRestore()
            ctime = get_current_time(format='%y%m%d%H%M%S%f')
            import util
            if args['host'] in ['localhost','127.0.0.1']:
                args['host'] = util.get_host_ip()
            result = backuprestore.backup_restore(ctime,'backup',args['host'],args['port'],args['username'],args['dbName'],
                                 args['sshServer'],args['backupDirectory'],
                                 args['fileName'],args['format'],args.get('advOptions',""), password=args.get('password',None))
            process_log_dir = result['log_dir']
            process_status = get_process_status(process_log_dir)
            result['pid'] = process_status.get('pid')
            result['exit_code'] = process_status.get('exit_code')
            result['process_log_id'] = result["process_log_id"]
            if process_status.get('exit_code') is None:
                result['in_progress'] = True
                try:
                    j = Process(
                        pid=int(result["process_log_id"]), command=result['cmd'],
                        logdir=result["log_dir"], desc=dumps(str(args['action'])),
                        user_id=current_user.id, acknowledge = 'pgDevOps'
                    )
                    db_session.add(j)
                    db_session.commit()
                except Exception as e:
                    print str(e)
                    pass
            if result['error']:
                #result['error'] = 1
                #result['msg'] = result['error']
                response = Result(500,"error",result['error'],extra_fields={'data':result})
            else:
                #result['error'] = 0
                #result['msg'] = 'Success'
                response = Result(200, "Success", "Success", extra_fields={'data': result})
        except Exception as e:
            import traceback
            #result['error'] = 1
            #result['msg'] = str(e)
            response = ServerErrorResult(message=str(e))
        time.sleep(1)
        return response.http_response()
_backrest.add_url_rule('/dbdump', view_func=BackupAPI.as_view('backup'))

class RestoreAPI(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def post(self):
        result = {}
        args = request.json
        if not validate_backup_fields(args):
            return InvalidParameterResult().http_response()
        try:
            from BackupRestore import BackupRestore
            backuprestore = BackupRestore()
            ctime = get_current_time(format='%y%m%d%H%M%S%f')
            import util
            if args['host'] in ['localhost','127.0.0.1']:
                args['host'] = util.get_host_ip()
            result = backuprestore.backup_restore(ctime,'restore',args['host'],args['port'],args['username'],args['dbName'],
                                 args['sshServer'],args['backupDirectory'],
                                 args['fileName'],args['format'],args.get('advOptions',""), password=args.get('password',None))
            process_log_dir = result['log_dir']
            process_status = get_process_status(process_log_dir)
            result['pid'] = process_status.get('pid')
            result['exit_code'] = process_status.get('exit_code')
            result['process_log_id'] = result["process_log_id"]
            if process_status.get('exit_code') is None:
                result['in_progress'] = True
                try:
                    j = Process(
                        pid=int(result["process_log_id"]), command=result['cmd'],
                        logdir=result["log_dir"], desc=dumps(str(args['action'])),
                        user_id=current_user.id, acknowledge = 'pgDevOps'
                    )
                    db_session.add(j)
                    db_session.commit()
                except Exception as e:
                    print str(e)
                    pass
            if result['error']:
                response = Result(500, "error", result['error'], extra_fields={'data': result})
            else:
                response = Result(200, "Success", "Success", extra_fields={'data': result})
        except Exception as e:
            import traceback
            response = ServerErrorResult(message=str(e))
        time.sleep(1)
        return response.http_response()
_backrest.add_url_rule('/dbrestore', view_func=RestoreAPI.as_view('restore'))

class BackupRestore(object):
    def __init__(self):
        pass

    def backup_restore(self,ctime,action,host,port,username,dbname,sshserver,backup_directory,filename,format,adv_options,password=None):
        result = {}
        from detached_process import detached_process
        if action == "backup":
            pgc_cmd = PGC_HOME + os.sep + "pgc dbdump "
        elif action == "restore":
            pgc_cmd = PGC_HOME + os.sep + "pgc dbrestore "
        pgc_cmd = pgc_cmd + dbname + " " + host + " " + port + " " + username
        pwd_str = None
        if password:
            pgc_cmd = pgc_cmd + " --pwd " + password
            pwd_str = " --pwd " + password
        if "" != filename and format == 'p' and os.path.splitext(filename)[-1] == "":
            filename = filename + ".sql"
        if '-v' not in adv_options and not (action == "restore" and format == 'p'):
            adv_options = adv_options + " -v"
        pgc_cmd = pgc_cmd + ' "' + backup_directory + filename + '" ' + format + ' ' + adv_options
        if sshserver not in ["","localhost",None]:
            pgc_cmd = pgc_cmd + ' --host "' + sshserver + '"'
        if this_uname == "Windows":
            pgc_cmd = pgc_cmd.replace("\\", "\\\\")
        process_status = detached_process(pgc_cmd, ctime, process_type=action, exclude_str=pwd_str)
        result['error'] = None
        result['status'] = process_status['status']
        result['log_dir'] = process_status['log_dir']
        result['process_log_id'] = process_status['process_log_id']
        if pwd_str:
            pgc_cmd = pgc_cmd.replace(pwd_str,"")
        result['cmd'] = pgc_cmd
        return result