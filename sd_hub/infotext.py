from modules.scripts import basedir
from pathlib import Path
import urllib.request
import shutil
import json
import re

from sd_hub.version import version
print(f"\033[38;5;208m▶\033[0m SD-Hub: \033[38;5;39mv{version}\033[0m")

blt = "<strong>•</strong>"

dl_title = """
<h3 class='sdhub-tab-title sdhub-downloader-tab-title' style="
    display: flex;
    align-items: center;
    justify-content: center;">
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"
      viewBox="0 0 32 32" style="margin-right: 8px;">
    <path
      fill="var(--primary-500)"
      stroke="var(--primary-500)"
      stroke-width="1.8"
      d="M26 24v4H6v-4H4v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4zm0-10
      l-1.41-1.41L17 20.17V2h-2v18.17l-7.59-7.58L6 14l10 10l10-10z">
    </path>
  </svg>
  Download Command Center
</h3>
"""

dl_info = f"""
<p class='sdhub-tab-info sdhub-downloader-tab-info'>
  Enter your <strong>Huggingface Token</strong> with the role <strong>READ</strong> to download from your private repo. 
  Get one <a href="https://huggingface.co/settings/tokens" class="sdhub-link">Here</a><br>
  Enter your <strong>Civitai API Key</strong> if you encounter an Authorization failed error. Get your key 
  <a href="https://civitai.com/user/account" class="sdhub-link">Here</a><br>
  Save = To automatically load token upon Reload UI or Webui launch<br>
  Load = Load token<br>
  Supported Domains: {blt} <a class="sdhub-nonlink">Civitai</a> {blt} <a class="sdhub-nonlink">Huggingface</a> {blt} 
  <a class="sdhub-nonlink">Github</a> {blt} <a class="sdhub-nonlink">Drive.Google</a> {blt}<br>
  See usage <a href="https://github.com/gutris1/sd-hub/blob/master/README.md#downloader" class="sdhub-link">Here</a>
</p>
"""

def getUploaderSVG():
    url = 'https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg'
    fp = Path(__file__).parent / 'hf-logo.svg'

    if fp.exists():
        svg = fp.read_text()
    else:
        with urllib.request.urlopen(url) as r, open(fp, 'wb') as o:
            shutil.copyfileobj(r, o)
        svg = fp.read_text()

    svg = re.sub(r'width="\d+"', 'width="40"', svg)
    svg = re.sub(r'height="\d+"', 'height="40"', svg)
    svg = re.sub(r'<svg([^>]+)>', r'<svg\1 style="margin-right: 8px;">', svg)
    svg = re.sub(r'fill="white"', 'fill="transparent"', svg)

    return svg

uploaderSVG = getUploaderSVG()

upl_title = f"""
<h3 class='sdhub-tab-title sdhub-uploader-tab-title' style="
    display: flex; 
    flex-wrap: wrap; 
    align-items: center; 
    justify-content: center; 
    margin-bottom: 3px;
    margin-top: -5px;">
  {uploaderSVG} Upload To Huggingface
</h3>
"""

upl_info = """
<p class='sdhub-tab-info sdhub-uploader-tab-info'>
  <strong>Colab</strong>: /content/stable-diffusion-webui/model.safetensors<br>
  <strong>Kaggle</strong>: /kaggle/working/stable-diffusion-webui/model.safetensors<br>
  <strong>Sagemaker Studio Lab</strong>: /home/studio-lab-user/stable-diffusion-webui/model.safetensors<br>
  <br>
  Get your <strong>Huggingface Token</strong> with the role <strong>WRITE</strong> from
  <a href="https://huggingface.co/settings/tokens" class="sdhub-link">Here</a><br>
  See usage <a href="https://github.com/gutris1/sd-hub/blob/master/README.md#uploader" class="sdhub-link">Here</a>
  <br>
</p>
"""

arc_info = """
<p class='sdhub-tab-info sdhub-archiver-tab-info'>
  <strong>Archive</strong> :<br>
  <a class="sdhub-nonlink">Name</a> Name for the compressed file (excluding the file extension)<br>
  <a class="sdhub-nonlink">Input Path</a> Path pointing a single file or folder containing multiple files<br>
  <a class="sdhub-nonlink">Output Path</a> Path where the compressed file will be saved<br>
  <a class="sdhub-nonlink">Create Directory</a> To automatically creates a new folder at the Output Path if not already existing<br>
  <a class="sdhub-nonlink">Split by</a> Divide the compression into multiple files based on number of files in <strong>Input Path</strong><br>
  <br><br>
  <strong>Extract</strong> :<br>
  <a class="sdhub-nonlink">Input Path</a> Path pointing to a compressed file<br>
  <a class="sdhub-nonlink">Output Path</a> Path where the compressed file will be extracted<br>
  <a class="sdhub-nonlink">Create Directory</a> To automatically creates a new folder at the Output Path if not already existing<br>
  <br>
</p>
"""

sdhub_repo = f"""
<h4 id="SDHub-Repo">
  <a href="https://github.com/gutris1/sd-hub">
    SD-Hub • v{version}
  </a>
</h4>
"""

config = Path(basedir()) / '.sd-hub-config.json'

def LoadConfig():
    if config.exists():
        try:
            d = config.read_text(encoding='utf-8').strip()
            return json.loads(d) if d else {}
        except json.JSONDecodeError:
            return {}
    else:
        return {}

Keys = {
    'write': ('huggingface-token-write', 'Huggingface Token (WRITE)'),
    'read': ('huggingface-token-read', 'Huggingface Token (READ)'),
    'civitai': ('civitai-api-key', 'Civitai API Key')
}

def LoadToken(Tab: str = 'all'):
    i = {k[0]: (f'{k[1]} Loaded', f'{k[1]} Not Found') for k in Keys.values()}

    try:
        c = config.read_text(encoding='utf-8').strip()
        d = json.loads(c) if c else {}
        T = d.get('Token', {})
    except FileNotFoundError:
        return '', '', '', f'{config} Not Found.', f'{config} Not Found.'
    except json.JSONDecodeError:
        return '', '', '', f'{config} Invalid JSON.', f'{config} Invalid JSON.'

    v = {k[0]: T.get(k[0], '') for k in Keys.values()}

    if Tab == 'uploader':
        r = [Keys['write'][0]]
        v[Keys['read'][0]], v[Keys['civitai'][0]] = '', ''
    elif Tab == 'downloader':
        r = [Keys['read'][0], Keys['civitai'][0]]
        v[Keys['write'][0]] = ''
    else:
        r = [k[0] for k in Keys.values()]

    m = ', '.join(i[k][0] if v[k] else i[k][1] for k in r) or 'No Token Found.'
    print(f'SD-Hub : {m}')

    return v[Keys['write'][0]], v[Keys['read'][0]], v[Keys['civitai'][0]], m, config

def SaveToken(HFW=None, HFR=None, CAK=None):
    v = LoadConfig()
    T = v.get('Token', {})

    s = []
    i = {k[0]: k[1] for k in Keys.values()}

    for k, t in zip([Keys['write'][0], Keys['read'][0], Keys['civitai'][0]], [HFW, HFR, CAK]):
        if t:
            T[k] = t
            s.append(i[k])

    v['Token'] = T

    m = ', '.join(s) if s else 'No Token Saved.'
    config.write_text(json.dumps(v, indent=4), encoding='utf-8')

    return f'{m}\nSaved To: {config}' if s else 'No Token Saved.'