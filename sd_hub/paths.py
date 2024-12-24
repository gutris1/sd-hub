from modules.paths_internal import models_path, data_path, extensions_dir
from modules.sd_models import model_path
from modules.shared import cmd_opts
from pathlib import Path
import os

BLOCK = (
    "Downloading files outside of Models or Embeddings folder is blocked "
    "\nAdd --enable-insecure-extension-access command line argument to proceed at your own risk."
)

class SDPaths:
    root = Path(data_path)
    models = Path(models_path)

    ckpt_dir = cmd_opts.ckpt_dir or model_path
    lora_dir = cmd_opts.lora_dir
    vae_dir = cmd_opts.vae_dir or models / "VAE"
    embeddings_dir = cmd_opts.embeddings_dir
    esrgan_dir = cmd_opts.esrgan_models_path or models / "ESRGAN"
    controlnet_dir = cmd_opts.controlnet_dir or models / "ControlNet"
    hypernetwork_dir = cmd_opts.hypernetwork_dir or models / "hypernetworks"
    ad_model = models / "adetailer"
    codeformer_dir = cmd_opts.codeformer_models_path or models / "Codeformer"
    extensions_dir = extensions_dir

    @staticmethod
    def SDHubTagsAndPaths():
        tags_list = {
            "$ckpt": SDPaths.ckpt_dir,
            "$lora": SDPaths.lora_dir,
            "$vae": SDPaths.vae_dir,
            "$emb": SDPaths.embeddings_dir,
            "$ups": SDPaths.esrgan_dir,
            "$cn": SDPaths.controlnet_dir,
            "$hn": SDPaths.hypernetwork_dir,
            "$ad": SDPaths.ad_model,
            "$cf": SDPaths.codeformer_dir
        }

        paths = [[t, str(d)] for t, d in tags_list.items()]

        if cmd_opts.enable_insecure_extension_access:
            paths.append(["$ext", str(SDPaths.extensions_dir)])
            paths.append(["$root", str(SDPaths.root)])

            env_list = {
                "COLAB_JUPYTER_TRANSPORT": "/content",
                "SAGEMAKER_INTERNAL_IMAGE_URI": "/home/studio-lab-user",
                "KAGGLE_DATA_PROXY_TOKEN": "/kaggle/working"
            }

            for var, path in env_list.items():
                if var in os.environ:
                    paths.append(["$home", path])
                    break

        return paths

    @staticmethod
    def SDHubPaths():
        paths = SDPaths.SDHubTagsAndPaths()
        return {tag.lower(): path for tag, path in paths}

    def SDHubCheckPaths(self, inputs):
        target = Path(inputs).resolve()
        allowed_dirs = [
            Path(self.ckpt_dir).resolve(),
            Path(self.lora_dir).resolve(),
            Path(self.vae_dir).resolve(),
            Path(self.embeddings_dir).resolve(),
            Path(self.esrgan_dir).resolve(),
            Path(self.controlnet_dir).resolve(),
            Path(self.hypernetwork_dir).resolve(),
            Path(self.ad_model).resolve(),
            Path(self.codeformer_dir).resolve(),
        ]

        if not any(dirs in target.parents or target == dirs for dirs in allowed_dirs):
            return False, f"{target}\n{BLOCK}"

        return True, ""
