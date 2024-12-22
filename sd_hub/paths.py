from modules.paths_internal import models_path, data_path, extensions_dir
from modules import shared, sd_models
from pathlib import Path
import os

Root = Path(data_path)
Models = Path(models_path)

def hub_path():
    paths = path_path()
    paths_dict = {}
    
    for _desc, full_path in paths:
        paths_dict[_desc.lower()] = full_path
        
    return paths_dict
  
def path_path():
    tags_list = {
        "$ckpt": shared.cmd_opts.ckpt_dir or sd_models.model_path,
        "$lora": shared.cmd_opts.lora_dir,
        "$vae": shared.cmd_opts.vae_dir or Models / 'VAE',
        "$emb": shared.cmd_opts.embeddings_dir,
        "$ups": shared.cmd_opts.esrgan_models_path or Models / 'ESRGAN',
        "$cn": shared.cmd_opts.controlnet_dir or Models / 'ControlNet',
        "$hn": shared.cmd_opts.hypernetwork_dir or Models / 'hypernetworks',
        "$ad": Models / 'adetailer',
        "$cf": shared.cmd_opts.codeformer_models_path or Models / 'Codeformer',
        "$ext": extensions_dir,
    }

    paths = []

    for t, d in tags_list.items():
        paths.append([t, str(d)])

    paths.append(["$root", str(Root)])

    e = {
        'COLAB_JUPYTER_TRANSPORT': '/content',
        'SAGEMAKER_INTERNAL_IMAGE_URI': '/home/studio-lab-user',
        'KAGGLE_DATA_PROXY_TOKEN': '/kaggle/working'
    }

    for v, p in e.items():
        if v in os.environ:
            paths.append(["$home", p])
            break    

    return paths
