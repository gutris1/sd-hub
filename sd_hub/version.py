from pathlib import Path
import sys
import os

def xyz(y):
    if 'COLAB_JUPYTER_TOKEN' in os.environ:
        x = Path('/usr/local/bin') / y
        if not x.exists():
            x = Path(sys.executable).parent / y
    else:
        x = Path(sys.executable).parent / y

    return [str(x)]

version = '10.3'