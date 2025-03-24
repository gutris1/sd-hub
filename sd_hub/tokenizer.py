from modules.scripts import basedir
from pathlib import Path
import json

Token = Path(basedir()) / '.sd-hub-token.json'

Keys = {
    'write': ('huggingface-token-write', 'Huggingface Token (WRITE)'),
    'read': ('huggingface-token-read', 'Huggingface Token (READ)'),
    'civitai': ('civitai-api-key', 'Civitai API Key')
}

def load_token(Tab: str = 'all'):
    i = {k[0]: (f'{k[1]} Loaded', f'{k[1]} Not Found') for k in Keys.values()}

    try:
        v = json.loads(Token.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return '', '', '', f'{Token} Not Found.', f'{Token} Not Found.'

    t = {k[0]: v.get(k[0], '') for k in Keys.values()}

    if Tab == 'uploader':
        r = [Keys['write'][0]]
        t[Keys['read'][0]], t[Keys['civitai'][0]] = '', ''
    elif Tab == 'downloader':
        r = [Keys['read'][0], Keys['civitai'][0]]
        t[Keys['write'][0]] = ''
    else:
        r = [k[0] for k in Keys.values()]

    m = ', '.join(i[k][0] if t[k] else i[k][1] for k in r) or 'No Token Found.'
    print(f'SD-Hub : {m}')

    return t[Keys['write'][0]], t[Keys['read'][0]], t[Keys['civitai'][0]], m, m

def save_token(token1=None, token2=None, token3=None):
    if Token.exists():
        try:
            v = json.loads(Token.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            v = {}
    else:
        v = {}

    s = []
    i = {k[0]: k[1] for k in Keys.values()}

    for k, t in zip([Keys['write'][0], Keys['read'][0], Keys['civitai'][0]], [token1, token2, token3]):
        if t:
            v[k] = t
            s.append(i[k])

    m = ', '.join(s) if s else 'No Token Saved.'
    Token.write_text(json.dumps(v, indent=4), encoding='utf-8')

    return f'{m}\nSaved To: {Token}' if s else 'No Token Saved.'
