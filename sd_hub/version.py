version = "5.6.5"

import os, sys
from pathlib import Path

def xyz(y):
    if 'COLAB_JUPYTER_TOKEN' in os.environ:
        x = Path('/usr/local/bin') / y
        if not x.exists():
            x = Path(sys.executable).parent / y
    else:
        x = Path(sys.executable).parent / y

    return [str(x)]
