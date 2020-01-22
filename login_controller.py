import requests
import json
from flask import Blueprint, request

from responses import Result, ServerErrorResult, InvalidParameterResult


_user = Blueprint('_user', __name__, template_folder='templates')

cloud = Blueprint('_user', __name__, url_prefix='/api/login')

@_user.route('/', methods=['POST'])
def api_login():
    data = request.json
    if 'email' not in data or 'password' not in data:
        result = InvalidParameterResult(errors=["Both email and password are required"])
        return result.http_response()
    r = requests.post(request.url_root+"/auth",
                      data=json.dumps({'email': data['email'], 'password': data['password']}),
                      headers={'content-type': 'application/json'})

    response = r.json()
    if response['meta']['code'] == 200:
        extra_fiends = {'authentication_token':response['response']['user']['authentication_token']}
        result = Result(200, "SUCCESS", "SUCCESS",extra_fields = extra_fiends)
    else:
        result = Result(response['meta']['code'], "FAILED", "FAILED",extra_fields = response['response'])
    return result.http_response()