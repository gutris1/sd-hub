from importlib import metadata
from packaging import version
from pathlib import Path
import urllib.request
import subprocess
import requests
import zipfile
import sys
import os

from modules.launch_utils import run_git, git_clone
from modules.paths_internal import extensions_dir
import launch

ORG = '\033[38;5;208m'
BLU = '\033[38;5;39m'
RST = '\033[0m'

base = Path(__file__).parent
py = sys.executable
run = subprocess.run

def _js():
    n = 'sd-image-scripts'
    p = Path(extensions_dir) / n

    if p.exists(): run_git(str(p), n, 'pull', desc='', errdesc='')
    else: git_clone(f'https://github.com/gutris1/{n}', str(p), n)

    e = {
        (p / 'javascript/exif-reader.js'): 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/dist/exif-reader.js',
        (p / 'javascript/exif-reader-LICENSE'): 'https://raw.githubusercontent.com/mattiasw/ExifReader/main/LICENSE',
        (base / 'javascript/XLSX-reader.js'): 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        (base / 'javascript/XLSX-reader-LICENSE'): 'https://raw.githubusercontent.com/SheetJS/sheetjs/github/LICENSE',
    }

    for f, u in e.items():
        if not f.exists():
            f.write_bytes(urllib.request.urlopen(u).read())

def _req1():
    r, n = [], []

    with open(base / 'requirements.txt') as file:
        for p in map(str.strip, file):
            if '==' in p or '>=' in p:
                pn, pv = p.split('==' if '==' in p else '>=')

                try:
                    installed = version.parse(metadata.version(pn))
                    required = version.parse(pv)

                    if ('==' in p and installed < required) or ('>=' in p and installed < required):
                        r.append(p)
                        n.append(pn)

                except metadata.PackageNotFoundError:
                    r.append(p)
                    n.append(pn)

            elif not launch.is_installed(p):
                r.append(p)
                n.append(p)

        if sys.platform != 'win32' and not launch.is_installed('aria2'):
            r.append('aria2')
            n.append('aria2')

        if r:
            print(f"Installing SD-Hub requirement: {' '.join(f'{ORG}{p}{RST}' for p in n)}")
            for p in r: run([py, '-m', 'pip', 'install', '-q', p])

def _req2():
    pkgs = []

    if sys.platform == 'win32':
        if not launch.is_installed('lz4'): pkgs.append('lz4')
        if not (base / 'aria2c.exe').exists(): pkgs.append('aria2')

        for pn in pkgs:
            if pn == 'lz4':
                run([py, '-m', 'pip', 'install', '-q', 'lz4'])

            elif pn == 'aria2':
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
        pkg_cmds = {'apt': '--version', 'conda': '--version'}
        pv_lz4 = {'pv': '-V', 'lz4': '-V'}

        if env in ['Colab', 'Kaggle'] and _sub(['apt', pkg_cmds['apt']]):
            for p, a in pv_lz4.items(): _check(p, a, f'apt -y install {p}', pkgs)

        elif env == 'SageMaker Studio Lab' and _sub(['conda', pkg_cmds['conda']]):
            for p, a in pv_lz4.items(): _check(p, a, f'conda install -qyc conda-forge {p}', pkgs)

        elif env == 'Unknown':
            if _sub(['apt', pkg_cmds['apt']]):
                for p, a in pv_lz4.items(): _check(p, a, f'apt -y install {p}', pkgs)

            elif _sub(['conda', pkg_cmds['conda']]):
                for p, a in pv_lz4.items(): _check(p, a, f'conda install -qyc conda-forge {p}', pkgs)

            else:
                print('SD-Hub: Failed to install pv and lz4 in an unknown environment')

    if pkgs: print(f"Installing SD-Hub requirement: {' '.join(f'{BLU}{p}{RST}' for p in pkgs)}")

def _sub(c):
    try:
        run(c, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
        return True
    except subprocess.CalledProcessError:
        return False

def _check(p, a, cmd, pkgs):
    try:
        run([p, a], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        pkgs.append(p)
        _sub(cmd.split())

_js()
_req1()
_req2()