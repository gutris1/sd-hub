from pathlib import Path
import urllib.request
import shutil
import re

from sdhub.config import LoadConfig, Keys

version = '13'

dl_title = """
<h3 class='sdhub-tab-title sdhub-downloader-tab-title'>
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 32 32" style="margin-right: 8px;">
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

dl_info = """<p class='sdhub-tab-info sdhub-downloader-tab-info'></p>"""

def uploaderTabsvg():
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

hflogo = uploaderTabsvg()
upl_title = f"""<h3 class='sdhub-tab-title sdhub-uploader-tab-title'>{hflogo} Upload To Huggingface</h3>"""

upl_info = """<p class='sdhub-tab-info sdhub-uploader-tab-info'></p>"""

arc_info = """<p class='sdhub-tab-info sdhub-archiver-tab-info'></p>"""

repo = f"""
<h4 id="SDHub-Repo">
  <a href="https://github.com/gutris1/sd-hub">
    SD-Hub • v{version}
  </a>
</h4>
"""

def info():
    m = f'\033[38;5;208m▶\033[0m SD-Hub: \033[38;5;39mv{version}\033[0m'

    d = LoadConfig().get('Token', {})
    l = [f'{v[1]} Loaded' for v in Keys.values() if d.get(v[0])]
    if l: m += ' | ' + ', '.join(l)

    print(m)

info()