from modules.scripts import basedir
from pathlib import Path
import json

Token = Path(basedir()) / '.sd-hub-token.json'

Keys = {
    'write': 'huggingface-token-write',
    'read': 'huggingface-token-read',
    'civitai': 'civitai-api-key'
}

def load_token(Tab: str = 'all'):
    Info = {
        Keys['write']: 'Huggingface Token (WRITE) loaded',
        Keys['read']: 'Huggingface Token (READ) loaded',
        Keys['civitai']: 'Civitai API Key loaded'
    }

    try:
        v = json.loads(Token.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return '', '', '', f'{Token.name} Not Found', f'{Token.name} Not Found'

    t = {key: v.get(key, '') for key in Keys.values()}

    if Tab == 'uploader':
        t[Keys['read']] = ''
        t[Keys['civitai']] = ''
    elif Tab == 'downloader':
        t[Keys['write']] = ''

    parts = [Info[key] for key, val in t.items() if val]
    msg = ', '.join(parts) if parts else "No Token Found"

    print(f"SD-Hub : {msg}")
    return t[Keys['write']], t[Keys['read']], t[Keys['civitai']], msg, msg

def save_token(token1=None, token2=None, token3=None):
    if Token.exists():
        try:
            v = json.loads(Token.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            v = {}
    else:
        v = {}

    for key, token in zip(Keys.values(), [token1, token2, token3]):
        v[key] = token if token is not None else v.get(key, '')

    Token.write_text(json.dumps(v, indent=4), encoding='utf-8')
    return f'Token Saved To: {Token}'
