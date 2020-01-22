from flask import Response
import json

STATUS_SUCCESS = 'SUCCESS'
STATUS_INVALID_PARAMETER = "ERR_INVALID_PARAMETER"
STATUS_SERVER_ERROR = "ERR_INTERNAL_SERVER_ERROR"
STATUS_FAILED = "FAILED"
STATUS_METHOD_NOT_FOUND = "METHOD_NOT_FOUND"
STATUS_INVALID_SESSION = "INVALID_SESSION"


class Result(object):
    def __init__(self, code, state, message, extra_fields=None):
        """
        Base Result class for API responses.
        code - numeric status code, similar to HTTP status code
        status - short status code
        message - descriptive message.
        """
        self.code = code
        self.state = state
        self.message = message
        self.extra_fields = extra_fields

    def to_json_dict(self):
        """Convert to a dict for serializing to JSON."""
        result = {"code": self.code, "state": self.state, "message": self.message}
        if self.extra_fields:
            result.update(self.extra_fields)
        return result

    def to_json(self, pretty=0):
        """Serialize to JSON."""
        if pretty == 1:
            return json.dumps(self.to_json_dict(), indent=2)
        return json.dumps(self.to_json_dict(), indent=2)

    def http_response(self, pretty=0, status_code=200):
        response = Response(self.to_json(pretty), status=status_code,mimetype='application/json')
        response.headers.add('Access-Control-Allow-Origin','*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response


class InvalidParameterResult(Result):
    def __init__(self, message=None, errors=None):
        if not message:
            message = "Invalid or missing parameter(s)"
        extra_fields = {'errors': errors} if errors else None
        super(InvalidParameterResult, self).__init__(400, STATUS_INVALID_PARAMETER, message,
                                                     extra_fields=extra_fields)

class MethodNotAllowedResult(Result):
    def __init__(self, message=None, errors=None):
        if not message:
            message = "Method not allowed"
        extra_fields = {'errors': errors} if errors else None
        super(MethodNotAllowedResult, self).__init__(405, STATUS_METHOD_NOT_FOUND, message,
                                                     extra_fields=extra_fields)

class ServerErrorResult(Result):
    def __init__(self, state = "ERR_INTERNAL_SERVER_ERROR",message=None):
        if not message:
            message = "Internal Server Error"
        super(ServerErrorResult, self).__init__(500, state, message)

class InvalidSessionResult(Result):
    def __init__(self, state = "INVALID_SESSION" ,message=None):
        if not message:
            message = "Invalid Session."
        super(InvalidSessionResult, self).__init__(401, state, message)


class NotFoundResult(Result):
    def __init__(self, state = "NOT_FOUND", message=None):
        if not message:
            message = "Not found."
        super(NotFoundResult, self).__init__(404, state, message)
