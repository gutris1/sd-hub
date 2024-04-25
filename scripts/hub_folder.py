from modules.paths import models_path, script_path
from pathlib import Path

def paths_dict():
    paths = paths_paths()
    paths_dict = {}
    for desc, full_path in paths:
        paths_dict[desc.lower()] = full_path
    return paths_dict
  
def paths_paths():
    sub_models = {
        "Stable-diffusion": "ckpt",
        "Lora": "lora",
        "VAE": "vae",
        "ESRGAN": "ups",
        "ControlNet": "cn",
        "hypernetworks": "hn",
        "adetailer": "ad",
        "Codeformer": "cf",}
    
    sub_script = {
        "extensions": "ext",
        "embeddings": "emb",}

    models_path_obj = Path(models_path)
    script_path_obj = Path(script_path)

    paths = [
        ["home", "/path"],
        ["root", script_path],]

    env = {
        'Colab': '/content',
        'SageMaker Studio Lab': '/home/studio-lab-user',
        'Kaggle': '/kaggle/working',}

    for platform, path in env.items():
        if Path(path) in script_path_obj.parents:
            paths[0][1] = path
            break

    for subdir, desc in sub_models.items():
        full_path = models_path_obj / subdir
        if full_path.exists():
            paths.append([desc, str(full_path)])

    for subdir, desc in sub_script.items():
        full_path = script_path_obj / subdir
        if full_path.exists():
            paths.append([desc, str(full_path)])

    return paths