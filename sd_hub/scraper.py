from modules.scripts import basedir
from urllib.parse import urlparse
from pathlib import Path
import gradio as gr
import subprocess
import requests
import shutil
import stat
import sys
import os

tmp_dir = Path(basedir()) / 'tmp'

def is_valid_url(url):
    parsing = urlparse(url)
    return all([parsing.scheme, parsing.netloc])

def remove_readonly(func, path, exc_info):
    """
    Clear the readonly bit and reattempt the removal
    https://bugs.python.org/issue43657#msg389724
    """

    if func not in (os.unlink, os.rmdir) or exc_info[1].winerror != 5:
        raise exc_info[1]
    os.chmod(path, stat.S_IWRITE)
    func(path)

def scraping(input_string, token=None):
    _lines = input_string.split('\n')
    _outputs = []
    _h = {"User-Agent": "Mozilla/5.0"}
    
    if tmp_dir.exists():
        if sys.platform == 'win32':
            shutil.rmtree(tmp_dir, onerror=remove_readonly)
        else:
            os.system(f"rm -rf {tmp_dir}")

    if not input_string.strip():
        yield "Nothing To Scrape Here", True

    for line in _lines:
        url = line.strip()
        url = url.rstrip('/')
        asd = 'huggingface.co' in url or 'pastebin.com' in url

        if 'huggingface.co' in url:
            if '/tree/' not in url and '/resolve/' in url:
                _outputs.append(line)
                continue
            elif '/tree/' not in url and '/resolve/' not in url:
                _outputs.append(line)
                yield "Input should be at least huggingface.co/username/repo/tree/main", True
                continue

            else:
                base_url = url
                ext = None

                if ' - ' in url:
                    base_url, ext = url.split(' - ')

                response = requests.get(base_url, headers=_h)
                if response.status_code == 401 and not token:
                    _outputs.append(line)
                    yield (
                        f"{base_url}\n"
                        f"{response.status_code} {response.reason}\n"
                        "Please Enter your Huggingface Token with the role Read"
                    ), True
                    continue

                if response.status_code != 200 and response.status_code != 401:
                    _outputs.append(line)
                    yield (
                        f"{base_url}\n"
                        f"{response.status_code} {response.reason}\n"
                    ), True
                    continue

                tmp_dir.mkdir(exist_ok=True)
                _parts = urlparse(base_url).path.split('/')
                _tree = _parts.index('tree')
                _branch = _parts[_tree + 1]
                _folder = '/'.join(_parts[_tree + 2:]) if len(_parts) > _tree + 2 else None
                _url = base_url.split('/tree/')[0]

                if token:
                    _url = f"https://hf_user:{token}@huggingface.co/{_url.split('huggingface.co/')[1]}"

                if _branch != 'main':
                    subprocess.run(["git", "clone", "--no-checkout", "--depth=1", "-b", _branch, _url, tmp_dir],
                                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

                else:
                    subprocess.run(["git", "clone", "--no-checkout", "--depth=1", _url, tmp_dir],
                                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

                output = subprocess.run(["git", "--git-dir", tmp_dir / ".git", "ls-tree", "-r", _branch],
                                        capture_output=True, text=True)

                _file_list = output.stdout.split('\n')

                if ext:
                    _ext_list = ext.split()
                else:
                    _ext_list = ['.safetensors', '.bin', '.pth', '.pt', '.ckpt', '.yaml']

                for _items in _file_list:
                    if not _items:
                        continue

                    _file = " ".join(_items.split()[3:])
                    _file_parts = _file.split('/')

                    if (
                        (_folder and _file.startswith(_folder)) 
                        or (not _folder and len(_file_parts) == 1)
                    ):
                        if any(_file.endswith(ext) for ext in _ext_list):
                            if _folder and _file.startswith(_folder + '/') and _file.count('/') == _folder.count('/') + 1:
                                _file = _file[len(_folder)+1:]
                            elif not _folder and _file.count('/') == 0:
                                pass
                            else:
                                continue

                            url_url = base_url.replace('/tree/', '/resolve/') + f'/{_file}'

                            _outputs.append(url_url)

                            if tmp_dir.exists():
                                if sys.platform == 'win32':
                                    shutil.rmtree(tmp_dir, onerror=remove_readonly)
                                else:
                                    os.system(f"rm -rf {tmp_dir}")

        elif 'pastebin.com' in url:
            p_url = url.replace('pastebin.com', 'pastebin.com/raw')
            response = requests.get(p_url, headers=_h)

            if not response.status_code == 200:
                _outputs.append(line)
                yield (
                    f"{url}\n"
                    f"{response.status_code} {response.reason}\n"
                ), True
                continue

            else:
                _p_content = response.text

                tagz_list = {'#model': '$ckpt',
                             '#lora': '$lora',
                             '#vae': '$vae',
                             '#embed': '$emb',
                             '#hynet': '$hn',
                             '#cnet': '$cn',
                             '#ext': '$ext',
                             '#upscaler': '$ups',
                             '#lycoris': '$lora'}

                _replaced = _p_content
                for _tags, to_replace in tagz_list.items():
                    _replaced = _replaced.replace(_tags, to_replace)

                _outputs.append(_replaced)
        
        else:
            if is_valid_url(url):
                _outputs.append(line)
                if not asd:
                    yield f"Unsupported domain: {url}\n\nSupported Domains:\n{'':<10}huggingface.co\n{'':<10}pastebin.com", True
                else:
                    yield f"Supported Domains:\n{'':<10}huggingface.co\n{'':<10}pastebin.com", True
            else:
                _outputs.append(line)

    yield '\n'.join(_outputs), False
    
def scraper(input_string, token, box_state=gr.State()):
    output_box = box_state if box_state else []

    ngword = [
        "Nothing",
        "should be",
        "Supported Domains"
    ]

    for _text, _flag in scraping(input_string, token):
        if not _flag:
            if any(k in _text for k in ngword):
                yield _text, "\n".join(output_box)
            else:
                yield _text, "\n".join(output_box)
        else:
            output_box.append(_text)

    return gr.update(), gr.State(output_box)
