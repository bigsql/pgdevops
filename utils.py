from datetime import datetime, timedelta

import pytz
import os
import json

def get_readable_time_diff(amount, units='secs', precision=0):

    def process_time(amount, units):

        INTERVALS = [1, 60,
                     60*60,
                     60*60*24,
                     60*60*24*7,
                     60*60*24*7*4,
                     60*60*24*7*4*12]

        NAMES = [('sec', 'secs'),
                 ('min', 'mins'),
                 ('hr', 'hrs'),
                 ('day', 'days'),
                 ('week', 'weeks'),
                 ('month', 'months'),
                 ('year', 'years')]

        result = []

        unit = map(lambda a: a[1], NAMES).index(units)
        # Convert to seconds
        amount = amount * INTERVALS[unit]

        for i in range(len(NAMES)-1, -1, -1):
            a = amount // INTERVALS[i]
            if a > 0:
                result.append((a, NAMES[i][1 % a]))
                amount -= a * INTERVALS[i]

        return result

    if int(amount)==0:
      return "0 secs"
    rd = process_time(int(amount), units)
    cont = 0
    for u in rd:
        if u[0] > 0:
            cont += 1

    buf = ''
    i = 0

    if precision > 0 and len(rd) > 2:
        rd = rd[:precision]
    for u in rd:
        if u[0] > 0:
            buf += "%d %s" % (u[0], u[1])
            cont -= 1

        if i < (len(rd)-1):
            if cont > 1:
                buf += ", "
            else:
                buf += " and "

        i += 1

    return buf


def get_current_time(format='%Y-%m-%d %H:%M:%S.%f %z'):
    """
    Generate the current time string in the given format.
    """
    return datetime.utcnow().replace(
        tzinfo=pytz.utc
    ).strftime(format)

def get_process_status(process_log_dir,line_count=None):
    process_dict = {}
    status_file = os.path.join(process_log_dir, "status")
    if os.path.exists(status_file):
        with open(status_file) as data_file:
            data = json.load(data_file)
            process_dict = data
            err_file = os.path.join(process_log_dir, "err")
            out_file = os.path.join(process_log_dir, "out")
            exit_code = process_dict.get("exit_code", None)
            err_data_content = None
            out_data_content = None
            process_dict['out_data'] = ""
            with open(out_file) as out_data:
                if line_count is None:
                    out_data_content = out_data.readlines()
                else:
                    out_data_content = out_data.readlines()[-line_count:]
                    line_count = line_count - len(out_data_content)
                out_data_content = "".join(out_data_content).replace("\r", "\n").strip()

            with open(err_file) as err_data:
                if line_count is None:
                    err_data_content = err_data.readlines()
                else:
                    err_data_content = err_data.readlines()[-line_count:]
                err_data_content = "".join(err_data_content).replace("\r", "\n").strip()

            if err_data_content and out_data_content:
                process_dict['out_data'] = '\n'.join([out_data_content, err_data_content])
            elif err_data_content:
                process_dict['out_data'] = err_data_content
            elif out_data_content:
                process_dict['out_data'] = out_data_content
    return process_dict
