# Secret key for signing CSRF data. Override this in config_local.py if
# running on a web server
import json
import os

config_json_file=os.path.join(os.path.dirname(__file__), "configuration.json")

if os.path.exists(config_json_file):
    with open(config_json_file) as f:
        config = json.load(f)
        CSRF_SESSION_KEY = config['CSRF_SESSION_KEY']
        SECURITY_PASSWORD_SALT = config['SECURITY_PASSWORD_SALT']
        SECRET_KEY = config['SECRET_KEY']
else:
    CSRF_SESSION_KEY = ""
    SECURITY_PASSWORD_SALT = ""
    SECRET_KEY = ""

# Hashing algorithm used for password storage
SECURITY_PASSWORD_HASH = 'pbkdf2_sha512'

#SESSION_COOKIE_DOMAIN="0.0.0.0"
#SESSION_TYPE="sqlalchemy"

SECURITY_LOGIN_URL= "/auth"

SESSION_COOKIE_NAME = 'pgdevops_session'

APP_NAME = "pgAdmin4 Web"

PGADMIN_APP_NAME = "pgAdmin4 Web"

APP_ICON = 'icon-bigsql-pgadmin-alt'

MAIL_ENABLED = False

# Need to send the email when password has been changed
SECURITY_SEND_PASSWORD_CHANGE_EMAIL=False


DATA_DIR = os.path.join(os.getenv("PGC_HOME"), "data", "pgdevops")
# Log file name
LOG_FILE = os.path.join(DATA_DIR, 'pgadmin4.log')

#sqlite path
SQLITE_PATH = os.path.join(
    DATA_DIR,
    'devops.db'
)

STORAGE_DIR = os.path.join(DATA_DIR, 'storage')
SESSION_DB_PATH = os.path.join(DATA_DIR, 'sessions')

# The default path for SQLite database for testing
TEST_SQLITE_PATH = os.path.join(DATA_DIR, 'test_pgadmin4.db')

UPGRADE_CHECK_ENABLED = False
