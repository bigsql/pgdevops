####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################
import json

from flask import Blueprint, request
from flask.views import MethodView
from flask_security import auth_required, roles_accepted

from Components import Components as pgc
from responses import ServerErrorResult, Result
_cloud_create = Blueprint('cloud_create', 'cloud_create', url_prefix='/api/pgc/create')


class CloudCreateHandler(MethodView):
    @auth_required('token', 'session')
    @roles_accepted('Administrator', 'User')
    def post(self):
        try:
            json_body = request.json
            pgcCmd = "create "+ json_body.get("type") +" --cloud " +json_body.get("cloud")
            pgcCmd = pgcCmd + " --params '" + str(json.dumps(json_body.get("params"))) + "'"
            data = pgc.get_cmd_data(pgcCmd)
            if len(data) == 0:
                return ServerErrorResult().http_response()
            if data[0]['state'] != 'complete':
                return ServerErrorResult(state=data[0]['state'],message=data[0].get('msg')).http_response()
            return Result(200,'SUCCESS',message=data[0].get('msg')).http_response()
        except Exception as ex:
            return ServerErrorResult(message = str(ex)).http_response()

_cloud_create.add_url_rule('', view_func=CloudCreateHandler.as_view('create'))