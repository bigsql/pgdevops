####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################
import json

from flask import Blueprint, request
from flask.views import MethodView
from flask_security import auth_required

from Components import Components as pgc
from responses import ServerErrorResult, Result
_pgc_provision = Blueprint('pgc_provision', 'pgc_provision', url_prefix='/api/pgc/provision')


class ProvisionHandler(MethodView):
    @auth_required('token', 'session')
    def post(self):
        try:
            json_body = request.json
            acceptable_params = ["availability", "cluster", "provider", "size",
                                 "overwrite"]
            boolean_param  = ['provision', 'init', 'deploy', 'start']
            pgc_cmd = "provision pgha3 "
            cmd_list = []
            cmd_list.append(pgc_cmd)
            invalid_params = []
            for key in json_body.keys():
                if str(key) in acceptable_params:
                    cmd = "--{0} {1}".format(str(key), str(json_body.get(key)))
                    cmd_list.append(cmd)
                elif str(key) in boolean_param:
                    if json_body.get(key) is False:
                        cmd = "--no-{0}".format(str(key))
                        cmd_list.append(cmd)
                else:
                    invalid_params.append(str(key))

            if len(invalid_params)>0:
                return ServerErrorResult(message="Invalid parameters received : " + str(invalid_params)).http_response()

            pgcCmd = " ".join(cmd_list)
            data = pgc.get_cmd_data(pgcCmd)
            if len(data) == 0:
                return ServerErrorResult().http_response(pretty=1)
            if data[0]['state'] != 'complete':
                return ServerErrorResult(state=data[0]['state'],message=data[0].get('msg')).http_response(pretty=1)
            del data[0]['state']
            return Result(200,'SUCCESS',message=data[0].get('msg'),extra_fields={'data':data[0]}).http_response(pretty=1)
        except Exception as ex:
            return ServerErrorResult(message = str(ex)).http_response(pretty=1)

_pgc_provision.add_url_rule('', view_func=ProvisionHandler.as_view('provision'))