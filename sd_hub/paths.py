from modules.paths_internal import models_path, data_path, extensions_dir
from modules.sd_models import model_path
from modules.shared import cmd_opts
from pathlib import Path
import os

Root = Path(data_path)
Models = Path(models_path)

def hub_path():
    p = path_path()
    pd = {}

    for d, fp in p:
        pd[d.lower()] = fp
        
    return pd
  
def path_path():
    tags_list = {
        "$ckpt": cmd_opts.ckpt_dir or model_path,
        "$lora": cmd_opts.lora_dir,
        "$vae": cmd_opts.vae_dir or Models / 'VAE',
        "$emb": cmd_opts.embeddings_dir,
        "$ups": cmd_opts.esrgan_models_path or Models / 'ESRGAN',
        "$cn": cmd_opts.controlnet_dir or Models / 'ControlNet',
        "$hn": cmd_opts.hypernetwork_dir or Models / 'hypernetworks',
        "$ad": Models / 'adetailer',
        "$cf": cmd_opts.codeformer_models_path or Models / 'Codeformer',
        "$ext": extensions_dir,
    }

    paths = []

    for t, d in tags_list.items():
        paths.append([t, str(d)])

    paths.append(["$root", Root])

    e = {
        'COLAB_JUPYTER_TRANSPORT': '/content',
        'SAGEMAKER_INTERNAL_IMAGE_URI': '/home/studio-lab-user',
        'KAGGLE_DATA_PROXY_TOKEN': '/kaggle/working'
    }

    if cmd_opts.enable_insecure_extension_access:
        for v, p in e.items():
            if v in os.environ:
                paths.append(["$home", p])
                break

    return paths
