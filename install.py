import launch
import os
import subprocess

def check_env():
    if os.path.exists('/content'):
        return 'Colab'
    elif os.path.exists('/home/studio-lab-user'):
        return 'SageMaker Studio Lab'
    elif os.path.exists('/kaggle'):
        return 'Kaggle'
    else:
        print("SD-Hub: Unknown environment, aria2 installation skipped")
        return None

def install_aria2(env):
    if env in ['Colab', 'Kaggle']:
        try:
            subprocess.run(['aria2c', '--version'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except FileNotFoundError:
            print("Installing aria2")
            subprocess.run(['apt-get', 'update'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(['apt', 'install', '-y', 'aria2'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
    elif env == 'SageMaker Studio Lab':
        if not launch.is_installed("aria2"):
            launch.run_pip("install aria2", "aria2")
        
def install_pkg():
    pkg_list = [
        ("gdown", "gdown"),
        ("lz4", "lz4"),
        ("huggingface-hub", "huggingface-hub")
    ]


    pkg_install = [pkg for pkg, _ in pkg_list if not launch.is_installed(pkg)]

    if pkg_install:
        for pkg in pkg_install:
            desc = next(desc for p, desc in pkg_list if p == pkg)
            launch.run_pip(f"install {pkg}", desc)

env = check_env()
install_aria2(env)
install_pkg()