####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

from flask import Blueprint, request
from flask.views import MethodView
from flask_security import login_required, auth_token_required, auth_required
from flask_login import current_user

from Components import Components as pgc
from responses import ServerErrorResult, Result, InvalidParameterResult
cloud = Blueprint('cloud', 'cloud', url_prefix='/api/pgc/instances')

class CloudHandler(MethodView):
    @auth_required('token', 'session')
    def get(self, cmd):
        pg_response = pgc.get_data('instances '+cmd)
        if len(pg_response) == 0:
            return ServerErrorResult().http_response()
        if pg_response[0]['state'] != 'completed':
            return ServerErrorResult(state=pg_response[0]['state'],message=pg_response[0].get('msg')).http_response()
        extra_fields = pg_response[0]['data']
        return Result(200,pg_response[0]['state'],'SUCCESS',extra_fields={"data":extra_fields}).http_response(pretty=1)

cloud.add_url_rule(' <string:cmd>', view_func=CloudHandler.as_view('instances'))