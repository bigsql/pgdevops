####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

from flask import Blueprint, request, jsonify, session
from flask.views import MethodView
from flask_security import login_required, roles_required, current_user, roles_accepted, auth_required
from flask import g
from responses import ServerErrorResult, Result, InvalidParameterResult

from Components import Components as pgc

credentials = Blueprint('credentials', 'credentials', url_prefix='/api/pgc/credentials')

class CreateCredential(MethodView):

    def constructCmd(self, args, method_type=None):
        cred_type = args.get('type')
        cred_name = args.get('credential_name')
        cred_user = args.get('user')
        cred_pwd = args.get('password')
        ssh_key = args.get('ssh_key')
        ssh_sudo_pwd = args.get('ssh_sudo_pwd')
        cloud_name = args.get('cloud_name')
        credentials = args.get('credentials')
        region = args.get('region')
        cred_uuid = args.get('cred_uuid')
        pgcCmd = "credentials ADD --type \"" + cred_type + "\" --name \"" + cred_name + "\""
        if method_type=="UPDATE":
            pgcCmd = "credentials UPDATE --type \"" + cred_type + "\" --name \"" + cred_name + "\" --cred_uuid \"" + cred_uuid + "\""
        if cred_user:
            pgcCmd = pgcCmd + " --user \"" + cred_user + "\""
        if cred_pwd:
            pgcCmd = pgcCmd + " --pwd \"" + cred_pwd + "\""
        if ssh_key:
            pgcCmd = pgcCmd + " --key \"" + ssh_key + "\""
        if ssh_sudo_pwd:
            pgcCmd = pgcCmd + " --sudo_pwd \"" + ssh_sudo_pwd + "\""
        if cloud_name:
            pgcCmd = pgcCmd + " --cloud \"" + cloud_name + "\""
        if credentials:
            import json
            pgcCmd = pgcCmd + " --credentials \'" + json.dumps(credentials) + "\'"
        return pgcCmd
    
    @auth_required('token', 'session')
    @roles_accepted('Administrator','User')
    def post(self):
        json_dict = {}
        args= request.json.get('params')
        pgcCmd = self.constructCmd(args, method_type = "ADD")
        data = pgc.get_cmd_data(pgcCmd)
        if len(data) == 0:
            return ServerErrorResult().http_response()
        if data[0]['state'] != 'info' or data[0]['state'] == 'completed':
            return ServerErrorResult(state=data[0]['state'],message=data[0].get('msg')).http_response()
        return Result(200,data[0]['state'], data[0]['msg']).http_response()


    @auth_required('token', 'session')
    @roles_accepted('Administrator','User')
    def put(self):
        json_dict = {}
        args= request.json.get('params')
        pgcCmd = self.constructCmd(args, method_type = "UPDATE")
        data = pgc.get_cmd_data(pgcCmd)
        if len(data) == 0:
            return ServerErrorResult().http_response()
        if data[0]['state'] != 'info' or data[0]['state'] == 'completed':
            return ServerErrorResult(state=data[0]['state'],message=data[0].get('msg')).http_response()
        return Result(200,data[0]['state'], data[0]['msg']).http_response()

    @auth_required('token', 'session')
    @roles_accepted('Administrator','User')
    def get(self):
        pg_response = pgc.get_cmd_data('credentials --list')
        return Result(200,'SUCCESS','SUCCESS',extra_fields={"data":pg_response}).http_response()

credentials.add_url_rule('/', view_func=CreateCredential.as_view('create'))


class DeleteCredentials(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator','User')
    def delete(self, uuids):
    	json_dict = {}
        result = {}
        for cred_uuid in uuids.split(','):
            pgcCmd = "credentials DELETE "
            if cred_uuid:
            	pgcCmd = pgcCmd + " --cred_uuid \"" + cred_uuid + "\""
        	data = pgc.get_cmd_data(pgcCmd)
        if len(data) == 0:
            return ServerErrorResult().http_response()
        if data[0]['state'] != 'info' or data[0]['state'] == 'completed':
            return ServerErrorResult(state=data[0]['state'],message=data[0].get('msg')).http_response()
        return Result(200,data[0]['state'], data[0]['msg']).http_response()
    	

credentials.add_url_rule('/<string:uuids>', view_func=DeleteCredentials.as_view('delete'))
