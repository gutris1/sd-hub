import subprocess, sys, os, pkg_resources
from packaging import version
from typing import List, Dict
from pathlib import Path
import launch


req_ = Path(__file__).parent / "requirements.txt"

orange_ = '\033[38;5;208m'
blue_ = '\033[38;5;39m'
reset_ = '\033[0m'


def _sub(inputs: List[str]) -> bool:
    try:
        subprocess.run(
            inputs, check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT
        )

        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {' '.join(inputs)}")
        print(f"Error message: {e}")
        return False


def _check_req(pkg: str, args: str, cmd: str, pkg_list: List[str]) -> None:
    try:
        subprocess.run(
            [pkg, args],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
    except FileNotFoundError:
        pkg_list.append(pkg)
        _sub(cmd.split())


def _install_req_1() -> None:
    reqs = []
    names = []

    with open(req_) as file:
        for pkg in file:
            pkg = pkg.strip()
            
            if '==' in pkg:
                pkg_name, pkg_version = pkg.split('==')
                try:
                    _version = pkg_resources.get_distribution(pkg_name).version
                    if version.parse(_version) < version.parse(pkg_version):
                        reqs.append(pkg)
                        names.append(pkg_name)
                        
                except pkg_resources.DistributionNotFound:
                    reqs.append(pkg)
                    names.append(pkg_name)
                    
            else:
                if not launch.is_installed(pkg):
                    reqs.append(pkg)
                    names.append(pkg)
                    
        if reqs:                
            print(
                f"Installing SD-Hub requirement: "
                f"{' '.join(f'{orange_}{pkg}{reset_}' for pkg in names)}"
            )

            for pkg in reqs:
                subprocess.run(
                    [sys.executable, '-m', 'pip', 'install', pkg],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )


def _install_req_2() -> None:
    env_list: Dict[str, str] = {
        'Colab': 'COLAB_JUPYTER_TRANSPORT',
        'SageMaker Studio Lab': 'SAGEMAKER_INTERNAL_IMAGE_URI',
        'Kaggle': 'KAGGLE_DATA_PROXY_TOKEN'
    }

    env = 'Unknown'
    
    for envs, var in env_list.items():
        if var in os.environ:
            env = envs
            break

    pkg_cmds: Dict[str, str] = {
        'apt': 'apt-get update',
        'conda': 'conda --version'
    }

    pv_lz4: Dict[str, str] = {
        'pv': '-V',
        'lz4': '-V'
    }
    
    pkg_list: List[str] = []
    
    if env in ['Colab', 'Kaggle']:
        if _sub(pkg_cmds['apt']):
            for pkg, args in pv_lz4.items():
                _check_req(pkg, args, f"apt -y install {pkg}", pkg_list)
            
    elif env == 'SageMaker Studio Lab':
        for pkg, args in pv_lz4.items():
            _check_req(pkg, args, f"conda install -qyc conda-forge {pkg}", pkg_list)
        
    elif env == 'Unknown':
        for pkg_cmd, args in pkg_cmds.items():
            if _sub(args):
                for pkg, args in pv_lz4.items():
                    _check_req(pkg, args, f"{pkg_cmd} -y install {pkg}", pkg_list)
                
        else:
            print("SD-Hub: Failed to install pv and lz4 in an unknown environment")

    if pkg_list:
        print(
            f"Installing SD-Hub requirement: "
            f"{' '.join(f'{blue_}{pkg}{reset_}' for pkg in pkg_list)}"
        )


_install_req_1()
_install_req_2()
