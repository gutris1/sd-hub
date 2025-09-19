from pathlib import Path
import json
import sys
import os

from modules.scripts import basedir

config = Path(basedir()) / '.sd-hub-config.json'

GalleryDefault = {
    'images-per-page': 100,
    'thumbnail-shape': 'aspect_ratio',
    'thumbnail-position': 'center',
    'thumbnail-layout': 'masonry',
    'thumbnail-size': 260,
    'show-filename': False,
    'show-buttons': False,
    'image-info-layout': 'full_width',
    'single-delete-permanent': False,
    'single-delete-suppress-warning': False,
    'batch-delete-permanent': False,
    'batch-delete-suppress-warning': False,
    'switch-tab-suppress-warning': False,
}

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

def xyz(y):
    if 'COLAB_JUPYTER_TOKEN' in os.environ:
        x = Path('/usr/local/bin') / y
        if not x.exists(): x = Path(sys.executable).parent / y
    else:
        x = Path(sys.executable).parent / y

    return [str(x)]