import json, re

from flask import Blueprint, request
from flask_security import roles_required
from flask_security.utils import encrypt_password

from pgadmin.model import db, User, Role, ServerGroup, UserPreference, Setting, Server, Process
from responses import Result, ServerErrorResult, InvalidParameterResult, NotFoundResult


_user_management = Blueprint('_user_management', __name__, url_prefix='/api/user')


def validate_user(data):
    new_data = dict()
    email_filter = re.compile("^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9]"
                              "(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9]"
                              "(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

    if ('newPassword' in data and data['newPassword'] != "" and
                'confirmPassword' in data and data['confirmPassword'] != ""):

        if data['newPassword'] == data['confirmPassword']:
            new_data['password'] = encrypt_password(data['newPassword'])
        else:
            raise Exception("Passwords do not match.")

    if 'email' in data and data['email'] != "":
        if email_filter.match(data['email']):
            new_data['email'] = data['email']
        else:
            raise Exception(_("Invalid email address."))

    if 'role' in data and len(data['role']) != 0:
        new_data['roles'] = data['role']

    if 'active' in data and data['active'] != "":
        new_data['active'] = data['active']

    return new_data


def get_detailed_roles(rs):
    roles = []
    for r in rs:
        roles.append({'id':r.id,'name':r.name})
    return roles


@_user_management.route('/', methods=['GET'], defaults={'uid': None})
@_user_management.route('/<string:uid>', methods=['GET'])
def list(uid=None):
    result = []

    if uid:
        u = User.query.get(uid)
        if u is not None:
            user_data = {'id': u.id,
                         'email': u.email,
                         'active': u.active,
                         'role': get_detailed_roles(u.roles)
                        }
            result.append(user_data)
    else:
        users = User.query.all()
        for u in users:
            result.append({'id': u.id,
                               'email': u.email,
                               'active': u.active,
                               'role': get_detailed_roles(u.roles)
                               })
    result = Result(200, "SUCCESS", "SUCCESS", extra_fields={"results":result})
    return result.http_response()


@_user_management.route('/', methods=['POST'], endpoint='create_user')
@roles_required('Administrator')
def create():
    """

    Returns:

    """
    data = request.form if request.form else json.loads(
        request.data, encoding='utf-8'
    )
    for f in ('email', 'role', 'active', 'newPassword', 'confirmPassword'):
        if f in data and data[f] != '':
            continue
        else:
            return InvalidParameterResult(errors=["Missing field: '{0}'".format(f)]).http_response()

    try:
        new_data = validate_user(data)
        if 'roles' in new_data:
            roles_obj = []
            for r in new_data['roles']:
                roles_obj.append(Role.query.get(r))
            new_data['roles'] = roles_obj

    except Exception as e:
        return InvalidParameterResult(errors=[str(e)]).http_response()

    try:
        usr = User(email=new_data['email'],
                   roles=new_data['roles'],
                   active=new_data['active'],
                   password=new_data['password'])
        db.session.add(usr)
        db.session.commit()
        # Add default server group for new user.
        server_group = ServerGroup(user_id=usr.id, name="Servers")
        db.session.add(server_group)
        db.session.commit()
    except Exception as e:
        return ServerErrorResult(message=str(e)).http_response()

    res = {'id': usr.id,
           'email': usr.email,
           'active': usr.active,
           'role': get_detailed_roles(usr.roles)
           }

    result = Result(200, "SUCCESS", "SUCCESS", extra_fields={"results": [res]})
    return result.http_response()

@_user_management.route('/<int:uid>', methods=['DELETE'], endpoint='delete_user')
@roles_required('Administrator')
def delete(uid):
    """

    Args:
      uid:

    Returns:

    """
    usr = User.query.get(uid)

    if not usr:
        return NotFoundResult(message="User with id {0} is not found".format(uid))

    try:

        Setting.query.filter_by(user_id=uid).delete()

        UserPreference.query.filter_by(uid=uid).delete()

        Server.query.filter_by(user_id=uid).delete()

        ServerGroup.query.filter_by(user_id=uid).delete()

        Process.query.filter_by(user_id=uid).delete()

        # Finally delete user
        db.session.delete(usr)

        db.session.commit()

        return Result(200,"SUCCESS","User Deleted Successfully").http_response()
    except Exception as e:
        return ServerErrorResult(message=str(e)).http_response()


@_user_management.route('/<int:uid>', methods=['PUT'], endpoint='update_user')
@roles_required('Administrator')
def update(uid):
    """

    Args:
      uid:

    Returns:

    """

    usr = User.query.get(uid)

    if not usr:
        return NotFoundResult(message="User with id {0} is not found".format(uid)).http_response()

    data = request.form if request.form else json.loads(
        request.data, encoding='utf-8'
    )

    try:
        new_data = validate_user(data)

        if 'roles' in new_data:
            roles_obj = []
            for r in new_data['roles']:
                roles_obj.append(Role.query.get(r))
            new_data['roles'] = roles_obj

    except Exception as e:
        return InvalidParameterResult(errors=[str(e)]).http_response()

    try:
        for k, v in new_data.items():
            setattr(usr, k, v)

        db.session.commit()

        res = {'id': usr.id,
               'email': usr.email,
               'active': usr.active,
               'role': get_detailed_roles(usr.roles)
               }

        result = Result(200, "SUCCESS", "SUCCESS", extra_fields={"results": [res]})
        return result.http_response()

    except Exception as e:
        return ServerErrorResult(message=str(e)).http_response()


@_user_management.route('/role/', methods=['GET'], defaults={'rid': None}, endpoint='roles')
@_user_management.route('/role/<int:rid>', methods=['GET'], endpoint='role')
@roles_required('Administrator')
def role(rid):
    """

    Args:
      rid: Role id

    Returns: List of pgAdmin4 users roles or single role if rid is provided.

    """
    result = []
    if rid:
        r = Role.query.get(rid)
        if r is not None:
            result.append({'id': r.id, 'name': r.name})
    else:
        roles = Role.query.all()

        for r in roles:
            result.append({'id': r.id,'name': r.name})

    result = Result(200, "SUCCESS", "SUCCESS", extra_fields={"results": result})
    return result.http_response()