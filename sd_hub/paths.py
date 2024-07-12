from modules.paths_internal import models_path, data_path
from pathlib import Path
import os

_data = Path(data_path)
_model = Path(models_path)

def hub_path():
    paths = path_path()
    paths_dict = {}
    
    for _desc, full_path in paths:
        paths_dict[_desc.lower()] = full_path
        
    return paths_dict
  
def path_path():
    tags_list = {
        "ckpt": ("stable-diffusion", "_model"),
        "lora": ("lora", "_model"),
        "vae": ("vae", "_model"),
        "emb": ("embeddings", "_data"),
        "ups": ("esrgan", "_model"),
        "ups2": ("gfpgan", "_model"),
        "ups3": ("realesrgan", "_model"),
        "cn": ("controlnet", "_model"),
        "hn": ("hypernetworks", "_model"),
        "ad": ("adetailer", "_model"),
        "cf": ("codeformer", "_model"),
        "ext": ("extensions", "_data"),
    }

    paths = []

    for _desc, (_name, _in) in tags_list.items():
        if _name is not None:
            if _in == "_model":
                model_dir = next(os.walk(str(_model)))[1]
                model_dir_lower = [d.lower() for d in model_dir]
                if _name.lower() in model_dir_lower:
                    path_model = _model / model_dir[model_dir_lower.index(_name.lower())]
                    paths.append([_desc, path_model])

            if _in == "_data":
                data_dir = next(os.walk(str(_data)))[1]
                data_dir_lower = [d.lower() for d in data_dir]
                if _name.lower() in data_dir_lower:
                    path_data = _data / data_dir[data_dir_lower.index(_name.lower())]
                    paths.append([_desc, path_data])
 
            if _desc == "cn":
                cn_path = _data / "extensions/sd-webui-controlnet/models"
                if cn_path.is_dir():
                    cn_dir = next(os.walk(str(cn_path)))[1]
                    cn_dir_lower = [d.lower() for d in cn_dir]
                    if _name.lower() in cn_dir_lower:
                        path_cn = cn_path / cn_dir[cn_dir_lower.index(_name.lower())]
                        paths.append(["cn", path_cn])
                else:
                    paths.append(["cn", ""])

    paths.append(["root", str(_data)])

    env_list = {
        'COLAB_JUPYTER_TRANSPORT': '/content',
        'SAGEMAKER_INTERNAL_IMAGE_URI': '/home/studio-lab-user',
        'KAGGLE_DATA_PROXY_TOKEN': '/kaggle/working'
    }

    for var, path in env_list.items():
        if var in os.environ:
            paths.append(["home", path])
            break    

    return paths
