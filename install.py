from importlib import metadata
from packaging import version
from pathlib import Path
import urllib.request
import subprocess
import requests
import zipfile
import launch
import sys
import os

ORG = '\033[38;5;208m'
BLU = '\033[38;5;39m'
RST = '\033[0m'

base = Path(__file__).parent

def _SDHubReq():
    req = {
        'sd-hub-translations.xlsx': 'https://huggingface.co/gutris1/sd-hub/resolve/main/sd-hub-translations.xlsx',
        'javascript/exif-reader.js': 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/dist/exif-reader.js',
        'javascript/exif-reader-LICENSE': 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/LICENSE'
    }
    for file, url in req.items():
        fp = base / file
        if not fp.exists():
            fp.write_bytes(urllib.request.urlopen(url).read())

def _sub(inputs):
    try:
        subprocess.run(inputs, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        return True
    except subprocess.CalledProcessError:
        return False

def _check_req(pkg, args, cmd, pkg_list):
    try:
        subprocess.run([pkg, args], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        pkg_list.append(pkg)
        _sub(cmd.split())

def _install_req_1():
    reqs, names = [], []

    with open(base / 'requirements.txt') as file:
        for pkg in map(str.strip, file):
            if '==' in pkg:
                pkg_name, pkg_version = pkg.split('==')
                try:
                    if version.parse(metadata.version(pkg_name)) < version.parse(pkg_version):
                        reqs.append(pkg)
                        names.append(pkg_name)
                except metadata.PackageNotFoundError:
                    reqs.append(pkg)
                    names.append(pkg_name)

            elif not launch.is_installed(pkg):
                reqs.append(pkg)
                names.append(pkg)

        if sys.platform != 'win32' and not launch.is_installed('aria2'):
            reqs.append('aria2')
            names.append('aria2')

        if reqs:
            print(f"Installing SD-Hub requirement: {' '.join(f'{ORG}{pkg}{RST}' for pkg in names)}")
            for pkg in reqs:
                subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', pkg])

def _install_req_2():
    pkg_list = []

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
                aria2_zip = base / Path(aria2_url).name

                with requests.get(aria2_url, stream=True) as r:
                    r.raise_for_status()
                    aria2_zip.write_bytes(r.content)

                with zipfile.ZipFile(aria2_zip, 'r') as zip_ref:
                    for f in zip_ref.infolist():
                        if f.filename.endswith('aria2c.exe'):
                            f.filename = Path(f.filename).name
                            zip_ref.extract(f, base)
                            break

                aria2_zip.unlink()

    else:
        env_list = {
            'Colab': 'COLAB_JUPYTER_TOKEN',
            'SageMaker Studio Lab': 'SAGEMAKER_INTERNAL_IMAGE_URI',
            'Kaggle': 'KAGGLE_DATA_PROXY_TOKEN'
        }

        env = next((envs for envs, var in env_list.items() if var in os.environ), 'Unknown')
        pkg_cmds = {'apt': 'update', 'conda': '--version'}
        pv_lz4 = {'pv': '-V', 'lz4': '-V'}

        if env in ['Colab', 'Kaggle'] and _sub(['apt', pkg_cmds['apt']]):
            for pkg, args in pv_lz4.items():
                _check_req(pkg, args, f"apt -y install {pkg}", pkg_list)

        elif env == 'SageMaker Studio Lab' and _sub(['conda', pkg_cmds['conda']]):
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
        print(f"Installing SD-Hub requirement: {' '.join(f'{BLU}{pkg}{RST}' for pkg in pkg_list)}")

_SDHubReq()
_install_req_1()
_install_req_2()
