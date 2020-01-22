####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

from werkzeug.wsgi import DispatcherMiddleware
from flask import Flask


import os, sys, platform

sys.path.append(os.path.join(os.path.dirname(__file__), 'pgadmin'))

this_uname = str(platform.system())

if this_uname == "Darwin":
    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib', 'osx'))
elif this_uname == "Linux":
    sys.path.append(os.path.join(os.path.dirname(__file__), 'lib', 'linux'))

from pgAdmin4 import app as backend
from web import application as frontend
#from webflask import application as backend
import config
import os

application = Flask(__name__)

application.config.from_object(config)


if not os.path.exists(config.SESSION_DB_PATH):
    os.mkdir(config.SESSION_DB_PATH)
    os.chmod(config.SESSION_DB_PATH, int('700', 8))

application.wsgi_app = DispatcherMiddleware(frontend.wsgi_app, {
    '/admin': backend.wsgi_app
})


if __name__ == '__main__':
    application.run()
