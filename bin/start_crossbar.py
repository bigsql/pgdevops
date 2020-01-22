####################################################################
#########         Copyright 2016-2017 BigSQL             ###########
####################################################################

import re
import sys

from crossbar.controller.cli import run

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw|\.exe)?$', '', sys.argv[0])
    sys.exit(run())