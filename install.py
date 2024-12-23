from importlib import metadata
from packaging import version
from typing import List, Dict
from pathlib import Path
import subprocess, requests, zipfile, launch, sys, os

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
                    _version = metadata.version(pkg_name)
                    if version.parse(_version) < version.parse(pkg_version):
                        reqs.append(pkg)
                        names.append(pkg_name)
                        
                except metadata.PackageNotFoundError:
                    reqs.append(pkg)
                    names.append(pkg_name)
                    
            else:
                if not launch.is_installed(pkg):
                    reqs.append(pkg)
                    names.append(pkg)
        
        if not sys.platform == 'win32':
            if not launch.is_installed('aria2'):
                reqs.append('aria2')
                names.append('aria2')

        if reqs:
            print(
                f"Installing SD-Hub requirement: "
                f"{' '.join(f'{orange_}{pkg}{reset_}' for pkg in names)}"
            )

            for pkg in reqs:
                subprocess.run(
                    [sys.executable, '-m', 'pip', 'install', '-q', pkg]
                )


def _install_req_2() -> None:
    pkg_list: List[str] = []

    if sys.platform == 'win32':
        aria2_exe = base / 'aria2c.exe'

        if not launch.is_installed('lz4'):
            pkg_list.append('lz4')

        if not aria2_exe.exists():
            pkg_list.append('aria2')

        for pkg_name in pkg_list:
            if pkg_name == 'lz4':
                subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'lz4'])
            elif pkg_name == 'aria2':
                aria2_url = 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip'

                with requests.get(aria2_url, stream=True) as r:
                    r.raise_for_status()
                    aria2_zip = base / Path(aria2_url).name
                    with open(aria2_zip, 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)

                with zipfile.ZipFile(aria2_zip, 'r') as zip_ref:
                    for f in zip_ref.infolist():
                        if f.filename.endswith('aria2c.exe'):
                            f.filename = Path(f.filename).name
                            zip_ref.extract(f, base)
                            break

                aria2_zip.unlink()

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
