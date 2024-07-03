version = "3.3.3"

import sys
from pathlib import Path

def xyz(z):
    x = Path(sys.executable).name

    if 'python3' in x:
        y = x.replace('python3', z)
    elif 'python' in x:
        y = x.replace('python', z)

    return [y]
