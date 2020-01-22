####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

from __future__ import print_function

# To make print function compatible with python2 & python3

import os
import sys
from subprocess import Popen, PIPE
from datetime import datetime
from dateutil import parser
import pytz

sys.path.append(os.path.join(os.path.dirname(__file__), 'pgadmin'))
import config
from pgadmin.utils import IS_PY2, u, file_quote, fs_encoding


def convert_environment_variables(env):
    """
    This function is use to convert environment variable to string
    because environment variable must be string in popen
    :param env: Dict of environment variable
    :return: Encoded environment variable as string
    """
    encoding = sys.getdefaultencoding()
    if encoding is None or encoding == 'ascii':
        encoding = 'utf-8'
    temp_env = dict()
    for key, value in env.items():
        if not isinstance(key, str):
            key = key.encode(encoding)
        if not isinstance(value, str):
            value = value.encode(encoding)
        temp_env[key] = value
    return temp_env


def which(program, paths):
    def is_exe(fpath):
        return os.path.exists(fpath) and os.access(fpath, os.X_OK)

    for path in paths:
        if not os.path.isdir(path):
            continue
        exe_file = os.path.join(u(path, fs_encoding), program)
        if is_exe(exe_file):
            return file_quote(exe_file)
    return None

def get_current_time(format='%Y-%m-%d %H:%M:%S.%f %z'):
    """
    Generate the current time string in the given format.
    """
    return datetime.utcnow().replace(
        tzinfo=pytz.utc
    ).strftime(format)

def detached_process(p_cmd, p_ctime=None, report_file=None, stdin_str=None, is_local=False, process_type=None, exclude_str=None):


    executor = file_quote(os.path.join(
        os.path.dirname(u(__file__)), u'process_executor.py'
    ))

    if is_local:
        executor = file_quote(os.path.join(
            os.path.dirname(u(__file__)), u'local_process_executor.py'
        ))
    paths = sys.path[:]
    interpreter = None

    if os.name == 'nt':
        paths.insert(0, os.path.join(u(sys.prefix), u'Scripts'))
        paths.insert(0, u(sys.prefix))

        interpreter = which(u'pythonw.exe', paths)
        if interpreter is None:
            interpreter = which(u'python.exe', paths)
    else:
        paths.insert(0, os.path.join(u(sys.prefix), u'bin'))
        interpreter = which(u'python', paths)

    p = None
    cmd = [
        interpreter if interpreter is not None else 'python',
        executor, p_cmd
    ]
    #cmd.extend(self.args)

    if not p_ctime:
        ctime = get_current_time(format='%y%m%d%H%M%S%f')
    else:
        ctime = p_ctime
    log_dir = os.path.join(
        config.SESSION_DB_PATH, 'process_logs'
    )
    if not os.path.exists(log_dir):
        os.mkdir(log_dir)
    id = ctime
    log_dir = os.path.join(log_dir, id)
    if not os.path.exists(log_dir):
        os.mkdir(log_dir)
    # Make a copy of environment, and add new variables to support
    env = os.environ.copy()
    env['PROCID'] = id
    env['OUTDIR'] = log_dir
    env['PGA_BGP_FOREGROUND'] = "1"
    if stdin_str:
        env['stdin_str'] = stdin_str
    if report_file:
        env['report_file'] = report_file
    if process_type:
        env['process_type'] = process_type
    if exclude_str:
        env["EXCLUDE_STR"] = exclude_str
    if IS_PY2:
        # We need environment variables & values in string
        env = convert_environment_variables(env)

    if os.name == 'nt':
        DETACHED_PROCESS = 0x00000008
        from subprocess import CREATE_NEW_PROCESS_GROUP

        # We need to redirect the standard input, standard output, and
        # standard error to devnull in order to allow it start in detached
        # mode on
        stdout = os.devnull
        stderr = stdout
        stdin = open(os.devnull, "r")
        stdout = open(stdout, "a")
        stderr = open(stderr, "a")

        p = Popen(
            cmd, close_fds=False, env=env, stdout=stdout.fileno(),
            stderr=stderr.fileno(), stdin=stdin.fileno(),
            creationflags=(CREATE_NEW_PROCESS_GROUP | DETACHED_PROCESS)
        )
    else:
        def preexec_function():
            import signal
            # Detaching from the parent process group
            os.setpgrp()
            # Explicitly ignoring signals in the child process
            #signal.signal(signal.SIGINT, signal.SIG_IGN)

        p = Popen(
            cmd, close_fds=True, stdout=None, stderr=None, stdin=None,
            preexec_fn=preexec_function, env=env
        )

    ecode = p.poll()

    # Execution completed immediately.
    # Process executor can not update the status, if it was not able to
    # start properly.
    process_completed=False
    if ecode is not None and ecode != 0:
        # There is no way to find out the error message from this process
        # as standard output, and standard error were redirected to
        # devnull.
        process_completed=True
    return {"status":process_completed, "log_dir":log_dir, 'process_log_id':id}

