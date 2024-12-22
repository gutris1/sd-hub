version = "5.0.0"

import os, sys
from pathlib import Path
from typing import List

def xyz(y: str) -> List[str]:
    if 'COLAB_JUPYTER_TRANSPORT' in os.environ:
        x = Path('/usr/local/bin')
    else:
        x = Path(sys.executable).parent

    z = x / y
    return [str(z)]
