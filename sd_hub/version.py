version = "3.3.3"

import sys
from pathlib import Path

def xyz(z):
    x = Path(sys.executable).name

    if sys.version_info.major == 2:
        y = x.replace('python', z)
    elif sys.version_info.major == 3:
        y = x.replace('python3', z)

    return [y]
