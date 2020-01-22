from wtforms import StringField, ValidationError, HiddenField
from flask_security.forms import RegisterForm, EqualTo, password_required
from wtforms.validators import InputRequired, Email, Length
from Components import Components as pgc
import os, sys
import subprocess
import json

PGC_HOME = os.getenv("PGC_HOME", "")
PGC_LOGS = os.getenv("PGC_LOGS", "")

pgc_scripts_path = os.path.join(PGC_HOME, 'hub', 'scripts')
if pgc_scripts_path not in sys.path:
    sys.path.append(pgc_scripts_path)


def check_ami(ami_id="pgdevops"):
    cmd = os.path.join(PGC_HOME, "pgc")
    pgcCmd = "{0} {1} {2} {3}".format(cmd, "verify-ami", ami_id, "--json")
    rc = 0
    msg = ""
    try:
        process = subprocess.check_output(pgcCmd,
                                          shell=True)
    except Exception as e:
        rc = e.returncode
        if rc > 0:
            final_out = json.loads(e.output.strip().decode('ascii'))[0]
            msg = str(final_out['msg'])
    return {"rc": rc, "msg": msg}


class RegisterForm(RegisterForm):
    checkAMI = check_ami()
    if checkAMI.get('rc') != 2:
        ami_form = True
        ami_id = StringField('AMI Instance ID', validators=[Length(max=50)])

        def validate_ami_id(form, field):
            validationData = check_ami(str(field.data))
            if validationData['rc'] != 0:
                raise ValidationError(validationData['msg'])
            else:
                pass
