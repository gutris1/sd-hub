version = "4.5.6"

import sys
from pathlib import Path

def xyz(y):
    x = Path(sys.executable).parent
    z = x / y

    return [str(z)]
