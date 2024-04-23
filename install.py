from pathlib import Path
import subprocess
import sys
from typing import List, Tuple

def _sub(inputs: List[str]) -> bool:
    try:
        subprocess.run(inputs, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False

def _env() -> str:
    env_list = {'Colab': '/content',
                'SageMaker Studio Lab': '/home/studio-lab-user',
                'Kaggle': '/kaggle/working'}
    
    for env, path in env_list.items():
        if Path(path).exists():
            return env
        
    return 'Unknown'

def _check_req(pkg: str, args: str, cmd: str, is_not_installed: List[str]) -> None:
    try:
        subprocess.run([pkg, args], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        is_not_installed.append(pkg)
        _sub(cmd.split())

def _install_req(env: str) -> None:
    pkg_list = [('aria2c', '-h', f'{sys.executable} -m pip install aria2'),
                ('huggingface-cli', '-h', f'{sys.executable} -m pip install huggingface-hub'),
                ('gdown', '-h', f'{sys.executable} -m pip install gdown')]

    if env in ['Colab', 'Kaggle']:
        if _sub(['apt-get', 'update']):
            pkg_list.extend([('pv', '-V', 'apt -y install pv'),
                             ('lz4', '-V', 'apt -y install lz4')])
            
    elif env == 'SageMaker Studio Lab':
        pkg_list.extend([('pv', '-V', 'conda install -qyc conda-forge pv'),
                         ('lz4', '-V', 'conda install -qyc conda-forge lz4-c')])
        
    elif env == 'Unknown':
        if _sub(['apt', '--version']):
            if _sub(['apt-get', 'update']):
                pkg_list.extend([('pv', '-V', 'apt -y install pv'),
                                 ('lz4', '-V', 'apt -y install lz4')])
                
        elif _sub(['conda', '--version']):
            pkg_list.extend([('pv', '-V', 'conda install -qyc conda-forge pv'),
                             ('lz4', '-V', 'conda install -qyc conda-forge lz4-c')])
            
        else:
            print("SD-Hub: Failed to install pv and lz4 in an unknown environment")

    is_not_installed: List[str] = []
    for pkg, args, cmd in pkg_list:
        _check_req(pkg, args, cmd, is_not_installed)
    
    if is_not_installed:
        print(f"Installing SD-Hub requirements: {' '.join(is_not_installed)}".replace('aria2c', 'aria2'))

_install_req(_env())