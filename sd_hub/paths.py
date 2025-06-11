from modules.paths_internal import models_path, data_path, extensions_dir
from modules.sd_models import model_path as ckpt_path
from modules.shared import cmd_opts, opts
from pathlib import Path
import os

BLOCK = (
    'Downloading/Uploading/etc files from/to outside models/embeddings/outputs folders is blocked. '
    '\nAdd --enable-insecure-extension-access command line argument to proceed at your own risk.'
)

ROOT_PATH = Path(data_path).resolve()
MODELS_PATH = Path(models_path).resolve()

INSECURE_ACCESS = cmd_opts.enable_insecure_extension_access

class SDPathsSDHub:
    def __init__(self, root_path=None, models_path=None):
        root_path = Path(root_path or ROOT_PATH).resolve()
        models_path = Path(models_path or MODELS_PATH).resolve()

        Tags = [
            ('$ckpt', 'ckpt_dir', ckpt_path, None),
            ('$lora', 'lora_dir', None, models_path / 'Lora'),
            ('$vae', 'vae_dir', None, models_path / 'VAE'),
            ('$emb', 'embeddings_dir', None, root_path / 'embeddings'),
            ('$ups', 'esrgan_models_path', None, models_path / 'ESRGAN'),
            ('$cn', 'controlnet_dir', None, models_path / 'ControlNet'),
            ('$hn', 'hypernetwork_dir', None, models_path / 'hypernetwork'),
            ('$cf', 'codeformer_models_path', None, models_path / 'Codeformer'),
            ('$ad', 'ad_no_huggingface', None, models_path / 'adetailer', True),
        ]

        self.SDHubTagsList = {}

        for t, a, f, p, *r in Tags:
            c = r[0] if r else False

            if c:
                if hasattr(cmd_opts, a): self.SDHubTagsList[t] = Path(p).resolve()
            else:
                path = getattr(cmd_opts, a, None) or f or p
                if path: self.SDHubTagsList[t] = Path(path).resolve()

        if INSECURE_ACCESS:
            self.SDHubTagsList['$ext'] = Path(extensions_dir).resolve()
            self.SDHubTagsList['$root'] = root_path

        if (home := self.getENV()): self.SDHubTagsList['$home'] = home

    def SDHubCheckPaths(self, paths):
        paths = Path(paths).resolve()
        outpath = []

        try:
            outdirs = [
                'outdir_txt2img_samples', 'outdir_img2img_samples', 'outdir_extras_samples',
                'outdir_txt2img_grids', 'outdir_img2img_grids',
                'outdir_save', 'outdir_init_images',
                'outdir_samples', 'outdir_grids'
            ]

            for attr in outdirs:
                try:
                    v = getattr(opts, attr, None)
                    if isinstance(v, str) and v:
                        outpath.append(Path(v).resolve())
                except Exception:
                    pass

        except Exception as e:
            print(f'Error outdir: {e}')
            outpath = []

        allowed = list(self.SDHubTagsList.values()) + outpath

        if not any(d in paths.parents or paths == d for d in allowed):
            return False, f'{paths}\n\n{BLOCK}'
        return True, ''

    def SDHubTagsAndPaths(self):
        return {t.lower(): str(p) for t, p in self.SDHubTagsList.items()}

    def getENV(self):
        if not INSECURE_ACCESS: return None

        e = {
            'COLAB_JUPYTER_TOKEN': Path('/content'),
            'SAGEMAKER_INTERNAL_IMAGE_URI': Path('/home/studio-lab-user'),
            'KAGGLE_DATA_PROXY_TOKEN': Path('/kaggle/working'),
        }

        for v, p in e.items():
            if v in os.environ: return p.resolve()
        return None

SDHubPaths = SDPathsSDHub(ROOT_PATH, MODELS_PATH)