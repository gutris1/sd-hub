from modules.paths_internal import models_path, data_path, extensions_dir
from modules.sd_models import model_path as ckpt_path
from modules.shared import cmd_opts
from pathlib import Path
import os

BLOCK = (
    "Downloading/Uploading files from/to outside Models or Embeddings folders is blocked. "
    "\nAdd --enable-insecure-extension-access command line argument to proceed at your own risk."
)

ROOT_PATH = Path(data_path).resolve()
MODELS_PATH = Path(models_path).resolve()

class SDPaths:
    def __init__(self, root_path=None, models_path=None):
        root_path = Path(root_path or ROOT_PATH).resolve()
        models_path = Path(models_path or MODELS_PATH).resolve()

        self.SDHubTagsList = {
            "$ckpt": Path(cmd_opts.ckpt_dir or ckpt_path).resolve(),
            "$lora": Path(cmd_opts.lora_dir or models_path / "Lora").resolve(),
            "$vae": Path(cmd_opts.vae_dir or models_path / "VAE").resolve(),
            "$emb": Path(cmd_opts.embeddings_dir or root_path / "embeddings").resolve(),
            "$ups": Path(cmd_opts.esrgan_models_path or models_path / "ESRGAN").resolve(),
            **({
                "$cn": Path(cmd_opts.controlnet_dir or models_path / "ControlNet").resolve()
                } if hasattr(cmd_opts, "controlnet_dir") else {}
            ),
            "$hn": Path(cmd_opts.hypernetwork_dir or models_path / "hypernetwork").resolve(),
            **({
                "$ad": (models_path / "adetailer").resolve()
                } if hasattr(cmd_opts, "ad_no_huggingface") else {}
            ),
            "$cf": Path(cmd_opts.codeformer_models_path or models_path / "Codeformer").resolve(),
        }

        if cmd_opts.enable_insecure_extension_access:
            self.SDHubTagsList["$ext"] = Path(extensions_dir).resolve()
            self.SDHubTagsList["$root"] = root_path

            env_path = {
                "COLAB_JUPYTER_TOKEN": Path("/content"),
                "SAGEMAKER_INTERNAL_IMAGE_URI": Path("/home/studio-lab-user"),
                "KAGGLE_DATA_PROXY_TOKEN": Path("/kaggle/working"),
            }
            for env_var, path in env_path.items():
                if env_var in os.environ:
                    self.SDHubTagsList["$home"] = path.resolve()

    def SDHubCheckPaths(self, paths):
        paths = Path(paths).resolve()

        if not any(
            dirs in paths.parents or paths == dirs for dirs in self.SDHubTagsList.values()
        ):
            return False, f"{paths}\n\n{BLOCK}"
        return True, ""

    def SDHubTagsAndPaths(self):
        return {tag.lower(): str(path) for tag, path in self.SDHubTagsList.items()}

SDHubPaths = SDPaths(ROOT_PATH, MODELS_PATH)
