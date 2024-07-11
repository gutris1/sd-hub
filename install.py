from packaging import version
from typing import List, Dict
from pathlib import Path
import pkg_resources
import subprocess
import requests
import zipfile
import launch
import sys
import os

base = Path(__file__).parent
req_ = base / "requirements.txt"

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
        
    except subprocess.CalledProcessError:
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
        
        if sys.platform != 'win32':
            reqs.append('aria2')
            names.append('aria2')

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
    pkg_list: List[str] = []

    if sys.platform == 'win32':
        lz4_dir = base / 'lz4'
        lz4_exe = lz4_dir / 'lz4.exe'
        lz4_dir.mkdir(exist_ok=True)

        aria2_exe = base / 'aria2c.exe'

        if not lz4_exe.exists():
            pkg_list.append('lz4')

        if not aria2_exe.exists():
            pkg_list.append('aria2')

        for pkg_name in pkg_list:
            if pkg_name == 'lz4':
                url = 'https://github.com/lz4/lz4/releases/download/v1.9.4/lz4_win64_v1_9_4.zip'
                target_dir = lz4_dir
            elif pkg_name == 'aria2':
                url = 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip'
                target_dir = base

            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                zip_file = base / Path(url).name
                with open(zip_file, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)

            with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                if target_dir == lz4_dir:
                    zip_ref.extractall(target_dir)
                else:
                    for file_info in zip_ref.infolist():
                        if file_info.filename.endswith('aria2c.exe'):
                            file_info.filename = Path(file_info.filename).name
                            zip_ref.extract(file_info, target_dir)
                            break

            zip_file.unlink()

    else:
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
            'apt': 'update',
            'conda': '--version'
        }

        pv_lz4: Dict[str, str] = {
            'pv': '-V',
            'lz4': '-V'
        }
        
        if env in ['Colab', 'Kaggle']:
            if _sub(['apt', pkg_cmds['apt']]):
                for pkg, args in pv_lz4.items():
                    _check_req(pkg, args, f"apt -y install {pkg}", pkg_list)
                
        elif env == 'SageMaker Studio Lab':
            if _sub(['conda', pkg_cmds['conda']]):
                for pkg, args in pv_lz4.items():
                    _check_req(pkg, args, f"conda install -qyc conda-forge {pkg}", pkg_list)

        elif env == 'Unknown':
            if _sub(['apt', pkg_cmds['apt']]):
                for pkg, args in pv_lz4.items():
                    _check_req(pkg, args, f"apt -y install {pkg}", pkg_list)
            elif _sub(['conda', pkg_cmds['conda']]):
                for pkg, args in pv_lz4.items():
                    _check_req(pkg, args, f"conda install -qyc conda-forge {pkg}", pkg_list)
            else:
                print("SD-Hub: Failed to install pv and lz4 in an unknown environment")

    if pkg_list:
        print(
            f"Installing SD-Hub requirement: "
            f"{' '.join(f'{blue_}{pkg}{reset_}' for pkg in pkg_list)}"
        )

_install_req_1()
_install_req_2()
