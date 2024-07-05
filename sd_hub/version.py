version = "3.3.3"

import sys
from pathlib import Path

def xyz(y):
    x = Path(sys.executable).parent
    z = x / y

    return [str(z)]
