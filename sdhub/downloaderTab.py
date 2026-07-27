from types import SimpleNamespace as SN
from urllib.parse import urlparse
from pathlib import Path
from PIL import Image
import gradio as gr
import subprocess
import threading
import requests
import shlex
import time
import json
import sys
import re
import io
import os

from modules.ui_components import FormRow, FormColumn
from modules.scripts import basedir
from modules.shared import cmd_opts

from sdhub.config import LoadToken, SaveToken, xyz
from sdhub.infotext import dl_title, dl_info
from sdhub.paths import SDHubPaths, BLOCK
from sdhub.scraper import scraper
from sdhub.civitai import CIVITAI

tag_tag = SDHubPaths.SDHubTagsAndPaths()
aria2cexe = Path(basedir()) / 'aria2c.exe'

DOWNLOAD_CANCEL = threading.Event()

def gitclown(url, fp):
    cmd = ['git', 'clone'] + shlex.split(url)
    p = subprocess.Popen(cmd, cwd=str(fp), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, text=True)
    git_output = []

    for output in iter(p.stdout.readline, ''):
        git_output.append(output)
        yield output, False

    for line in git_output: yield line, True
    p.wait()

def gdrown(url, fp=None, fn=None):
    folder = 'drive.google.com/drive/folders' in url
    cli = xyz('gdown.exe') if sys.platform == 'win32' else xyz('gdown')
    cmd = cli + ['--fuzzy', url]

    fn and cmd.extend(['-O', fn])
    folder and cmd.append('--folder')
    cwd = fp or Path.cwd()

    p = subprocess.Popen(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, text=True)

    sl = time.time()
    output, f, prog, n, s = '', False, None, None, None
    fail = 'Failed to retrieve file url'

    while (o := p.stdout.readline()):
        output += o
        f |= fail in o

        if o.startswith('To:'):
            s = o[4:].strip()
            n = Path(s).name
            continue

        if re.search(r'\d{1,3}%', o):
            o = re.sub(r'\|[^|]*\|', '', o, count=1).strip()
            o = re.sub(r'(\d{1,3}%)', r'(\1)', o, count=1)
            prog = f'{n} {o}'

        if prog and time.time() - sl >= 1:
            yield prog, False
            sl = time.time()

    if f: yield output[output.find(fail):], False

    if s: yield f'Saved To: {Path(s).parent if folder else Path(s)}', True

    p.wait()

def ariari(url, fp=None, fn=None, opts=None):
    def _d(url):
        return (
            CIVITAI.domain(url),
            'huggingface.co' in url,
            'github.com' in url or 'raw.githubusercontent.com' in url
        )

    input_url = url
    civitai, huggingface, github = _d(url)

    headers = {'User-Agent': (CIVITAI.headers()['User-Agent'] if civitai else 'Mozilla/5.0')}

    if fp:
        if not cmd_opts.enable_insecure_extension_access:
            allowed, err = SDHubPaths.SDHubCheckPaths(fp)
            if not allowed: yield err, True; return

    c = None
    cd = None

    if github:
        url = url.replace('/blob/', '/raw/')

    elif huggingface:
        url = url.split('?')[0]
        headers.update({'Authorization': f'Bearer {opts.HFR}'} if opts.HFR else {})
        ext = ('.safetensors', '.pt', '.pth')

        if fn and Path(fn).suffix.lower() in ext:
            try:
                raw = re.sub(r'/(resolve|blob)/', '/raw/', url)
                r = requests.get(raw, headers=headers, timeout=15)

                if m := re.search(r'oid sha256:([a-fA-F0-9]{64})', r.text):
                    c = CIVITAI.from_sha(m.group(1).lower())
                    if c: cd = c.domain_name

            except Exception:
                pass

        url = url.replace('/blob/', '/resolve/')

    elif civitai:
        if not opts.CAK:
            yield 'CivitAI API key is required for downloading models from Civitai', True
            return

        c = CIVITAI.from_url(url)

        if not c:
            yield f'Unable to find download URL for\n-> {url}\n', True
            return

        cd = c.domain_name

        if msg := c.early_access_info():
            yield msg, True
            return

        fn = fn or c.filename

        download_url = c.download_url
        if not download_url:
            yield f'Unable to find download URL for\n-> {url}\n', True
            return

        url = download_url

        try:
            headers['Authorization'] = f'Bearer {opts.CAK}'
            r = requests.get(url, headers=headers, allow_redirects=True, stream=True, timeout=30)
            if r.url and r.url != url: url = r.url
            r.close()
        except Exception as e:
            print(f'Failed: {e}')

    aria2cmd = [
        *([aria2cexe] if sys.platform == 'win32' else xyz('aria2c')),
        f"--header=User-Agent: {headers['User-Agent']}",
        *([f'--header=Authorization: Bearer {opts.HFR}'] if huggingface and opts.HFR else ()),
        '--console-log-level=error', '--stderr=true', '--summary-interval=1', '-c', '-x16', '-s16', '-k1M',
        *(('--allow-overwrite=true', '-d', fp) if fp else ()),
        *(('-o', fn) if fn else ()),
        url,
    ]

    for retry in range(20 if huggingface else 1):
        p = subprocess.Popen(aria2cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, text=True)

        aria2_output, error, auth_error, error_msg = '', False, None, None

        while output := p.stdout.readline():
            if DOWNLOAD_CANCEL.is_set():
                DOWNLOAD_CANCEL.clear()

                p.terminate()
                try:
                    p.wait(timeout=1)
                except Exception:
                    p.kill()

                yield f'Canceled: {fn or input_url}', True
                return

            aria2_output += output

            for line in output.splitlines():
                if m := re.match(r'\[#\w{6}\s(.*?)\((\d+\%)\).*?DL:(.*?)\s', line):
                    size, percent, speed = m.groups()
                    yield f'{fn} ({percent}) {size} {speed}', False
                    break

        p.wait()

        if (huggingface and p.returncode and 'xet-bridge' in aria2_output and 'status=403' in aria2_output):
            yield f'Downloading... ({retry + 1}/20)', ''; time.sleep(1); continue

        for line in aria2_output.splitlines():
            if 'errorCode=24' in line:
                if m := re.search(r'URI=(https?://\S+)', line):
                    uri = m.group(1)

                    auth_errors = {'huggingface.co': f'## Authorization Failed, Enter your Huggingface Token\n-> {url}\n'}
                    if cd: auth_errors[cd] = (f'## Authorization Failed, Enter your Civitai API Key\n-> {url}\n')

                    for d, msg in auth_errors.items():
                        if d in uri: auth_error = msg; error = True; break

                continue

            if 'errorCode' in line:
                if (arrow := aria2_output.find('->')) != -1:
                    if (end := aria2_output.find('\n', arrow)) != -1:
                        error_msg = aria2_output[arrow:end]
                        if m := re.search(r'URI=(https?://\S+)', aria2_output): error_msg += f'\n{m.group(1)}\n'
                        error = True

        if p.returncode:
            if auth_error: yield auth_error, False
            elif error_msg: yield error_msg, False
            break

        for line in aria2_output.splitlines():
            if '|' in line and 'OK' in line:
                pipe = line.split('|')
                if len(pipe) > 3: yield f'Saved To: {pipe[3].strip()}', True; break

        if c and fp:
            for i in c.extras(fp, fn, opts.preview, opts.html):
                yield i, False

        break

def url_check(url):
    try:
        supported = {*CIVITAI.DOMAINS, 'huggingface.co', 'github.com', 'drive.google.com'}

        url_parsed = urlparse(url)
        if not (url_parsed.scheme and url_parsed.netloc):
            return False, 'Invalid URL.'
        if url_parsed.netloc not in supported:
            return False, 'Supported Domain:\n' + '\n'.join(supported)

        return True, ''

    except Exception as e:
        return False, str(e)

def process_inputs(url_line, cp, ext_tag, github_repo):
    if any(url_line.startswith(char) for char in ('/', '\\', '#')):
        return None, None, None, 'Invalid usage, Tag should start with $'

    if url_line.startswith('$'):
        parts = url_line[1:].strip().split('/', 1)
        tags_key = f'${parts[0].lower()}'
        subfolder = parts[1] if len(parts) > 1 else None
        base_path = tag_tag.get(tags_key)

        if base_path is not None:
            full_path = Path(base_path, subfolder) if subfolder else Path(base_path)
            cp = full_path
        else:
            return None, None, None, f'{tags_key}\nInvalid Tag.'

        return cp, None, None, None

    parts = shlex.split(url_line, posix=False) if sys.platform == 'win32' else shlex.split(url_line)
    url = parts[0].strip()

    if not (ext_tag and github_repo):
        allowed, err = url_check(url)
        if not allowed: return None, None, None, err

    op = ofn = None

    if len(parts) > 1:
        if ext_tag and github_repo:
            url = ' '.join(parts).strip()
        else:
            if '=' in parts:
                dash = parts.index('=')
                rop = ' '.join(parts[1:dash]).strip()
                ofn = ' '.join(parts[dash + 1:]).strip()
            else:
                rop = ' '.join(parts[1:]).strip()

            rop = rop.strip('"').strip("'")
            if sys.platform == 'win32' and rop: rop = Path(rop).as_posix()
            op = Path(rop) if rop else None

    if op and op.suffix: return None, None, None, f'{op}\nOutput path is not a path.'

    if ofn:
        optional_fn_path = Path(ofn)
        if not optional_fn_path.suffix:
            return None, None, None, f'{ofn}\nOutput filename is missing its extension.'

    fp = op or cp
    if fp is None or not fp.exists(): return None, None, None, f'{fp}\nDoes not exist.'

    fn = ofn or (None if any(u in url for u in (*CIVITAI.DOMAINS, 'drive.google.com')) else Path(urlparse(url).path).name)

    return fp, url, fn, None

def lobby(inputs, opts):
    if not inputs.strip(): return

    cp = None
    urls = [url_line for url_line in inputs.strip().split('\n') if url_line.strip()]

    if len(urls) == 1 and urls[0].startswith('$'):
        yield 'Missing URL.', True
        return

    ext_tag = urls[0].startswith('$ext')
    github_repo = any(re.match(r'^https?://github\.com/[^/]+/[^/]+/?$', u) for u in urls)

    for url_line in urls:
        fp, url, fn, error = process_inputs(url_line, cp, ext_tag, github_repo)

        if error:
            yield error, True
            return

        if not url:
            cp = fp
            continue

        if ext_tag and github_repo:
            if cmd_opts.enable_insecure_extension_access:
                for msg, err in gitclown(url, fp):
                    yield msg, err
                continue

        if 'drive.google' in url:
            for msg, err in gdrown(url, fp, fn):
                yield msg, err
            continue

        canceled = False

        for msg, done in ariari(url, fp, fn, opts):
            if msg == '__CANCELED__':
                canceled = True
                break

            yield msg, done

        if canceled: continue

def downloader(inputs, HFR, CAK, preview, html, box_state=gr.State()):
    DOWNLOAD_CANCEL.clear()

    opts = SN(
        HFR=HFR,
        CAK=CAK,
        preview=preview,
        html=html,
    )

    output_box = box_state if box_state else []

    ngword = [
        '## Authorization Failed',
        'The model is in early access',
        'Unable to find',
        'errorCode',
        'Failed to retrieve',
        'fatal:'
    ]

    try:
        yield 'Downloading...', ''

        for t, f in lobby(inputs, opts):
            if not f:
                if any(k in t for k in ngword): # line 459
                    yield 'Error', '\n'.join([t] + output_box)
                    return gr.update(), gr.State(output_box)

                if 'files from/to outside' in t: 
                    yield 'Blocked', '\n'.join([t] + output_box)
                    assert not cmd_opts.disable_extension_access, BLOCK

                yield t, '\n'.join(output_box)
            else:
                output_box.append(t)

        catcher = [
            'exist', 'Invalid', 'Tag', 'Output', 'Nothing', 'URL', 'banned by Kaggle',
            'filename', 'Supported Domain:', '500 Server Error', 'fatal', 'key is required'
        ]

        if any(w in l for w in catcher for l in output_box):
            yield 'Error', '\n'.join(output_box)

        elif any(BLOCK in l for l in output_box):
            yield 'Blocked', '\n'.join(output_box)
            assert not cmd_opts.disable_extension_access, BLOCK

        elif '__CANCELED__' in output_box:
            yield 'Canceled', '\n'.join(output_box)

        else:
            yield '', '\n'.join(output_box)

        return gr.update(), gr.State(output_box)

    finally:
        DOWNLOAD_CANCEL.clear()

def read_txt(f, box):
    text_box = [box] if box.strip() else []

    if f is not None:
        txt = Path(f.name).read_text()
        text_box.append(txt)

    return '\n'.join(text_box)

def cancel_download():
    DOWNLOAD_CANCEL.set()

def DownloaderTab():
    _, HFR, CAK, _, _ = LoadToken('downloader')

    with gr.TabItem('Downloader', elem_id='SDHub-Downloader-Tab'):
        gr.HTML(dl_title)

        with FormRow():
            with FormColumn(scale=7):
                gr.HTML(dl_info)

            with FormColumn(scale=3):
                token_1 = gr.TextArea(
                    value=HFR,
                    label='Huggingface Token (READ)',
                    lines=1,
                    max_lines=1,
                    placeholder='Your Huggingface Token here (role = READ)',
                    interactive=True,
                    elem_id='SDHub-Downloader-HFR',
                    elem_classes='sdhub-input'
                )

                token_2 = gr.TextArea(
                    value=CAK,
                    label='Civitai API Key',
                    lines=1,
                    max_lines=1,
                    placeholder='Your Civitai API Key here',
                    interactive=True,
                    elem_id='SDHub-Downloader-CAK',
                    elem_classes='sdhub-input'
                )

                with FormRow(elem_classes='sdhub-row'):
                    save_button = gr.Button(
                        value='SAVE',
                        variant='primary',
                        min_width=0,
                        elem_id='SDHub-Downloader-Save-Button',
                        elem_classes='sdhub-buttons'
                    )

                    load_button = gr.Button(
                        value='LOAD',
                        variant='primary',
                        min_width=0,
                        elem_id='SDHub-Downloader-Load-Button',
                        elem_classes='sdhub-buttons'
                    )

        with FormRow():
            preview = gr.Checkbox(
                label='Civitai Preview',
                elem_id='SDHub-Downloader-Preview-Checkbox',
                elem_classes='sdhub-checkbox'
            )

            html = gr.Checkbox(
                label='Civitai HTML',
                elem_id='SDHub-Downloader-HTML-Checkbox',
                elem_classes='sdhub-checkbox'
            )

        input_box = gr.Textbox(
            show_label=False,
            lines=5,
            placeholder='$tag\nURL',
            elem_id='SDHub-Downloader-Input',
            elem_classes='sdhub-input'
        )

        with FormRow(elem_classes='sdhub-button-output-row'):
            with FormColumn(scale=6), FormRow(elem_classes='sdhub-row'):
                with FormRow(elem_classes='sdhub-button-row-1'):
                    download_button = gr.Button(
                        'DOWNLOAD',
                        variant='primary',
                        elem_id='SDHub-Downloader-Download-Button',
                        elem_classes='sdhub-buttons'
                    )

                    cancel_button = gr.Button(
                        'CANCEL',
                        variant='primary',
                        elem_id='SDHub-Downloader-Cancel-Button',
                        elem_classes='sdhub-buttons'
                    )

                with FormRow(variant='compact', elem_classes='sdhub-button-row-2'):
                    scrape_button = gr.Button(
                        'Scrape',
                        variant='secondary',
                        min_width=0,
                        elem_id='SDHub-Downloader-Scrape-Button'
                    )

                    txt_button = gr.UploadButton(
                        label='Insert TXT',
                        variant='secondary',
                        file_count='single',
                        file_types=['.txt'],
                        min_width=0,
                        elem_id='SDHub-Downloader-Txt-Button'
                    )

            with FormColumn(scale=4):
                output_1 = gr.Textbox(
                    show_label=False,
                    interactive=False,
                    max_lines=1,
                    elem_classes='sdhub-output'
                )

                output_2 = gr.TextArea(
                    show_label=False,
                    interactive=False,
                    lines=5,
                    elem_classes='sdhub-output'
                )

        TokenBlur = '() => SDHubTokenBlur()'

        load_button.click(
            fn=lambda: LoadToken('downloader'), inputs=[], outputs=[output_2, token_1, token_2, output_2]
        ).then(fn=None, _js=TokenBlur)

        save_button.click(
            fn=lambda HFR, CAK: SaveToken(None, HFR, CAK), inputs=[token_1, token_2], outputs=output_2
        ).then(fn=None, _js=TokenBlur)

        download_button.click(
            fn=downloader, inputs=[input_box, token_1, token_2, preview, html, gr.State()], outputs=[output_1, output_2],
            _js="""
            () => {
                const id = '#SDHub-Downloader', c = 'sdhub-buttons-anim';

                let v = [
                    `${id}-Input textarea`,
                    `${id}-HFR input`,
                    `${id}-CAK input`,
                    `${id}-Preview-Checkbox input`,
                    `${id}-HTML-Checkbox input`
                ].map(s => {
                    let e = document.querySelector(s);
                    return e?.type === 'checkbox' ? e.checked : e?.value;
                });

                document.querySelectorAll(`${id}-Download-Button, ${id}-Cancel-Button, ${id}-Input`)
                    .forEach(b => b.classList.add('downloading'));

                const b = document.querySelector(`${id}-Cancel-Button`);
                b.classList.add(c);
                setTimeout(() => b.classList.remove(c), 400);

                window.SDHubDownloaderInputsValue = v[0];
                return [...v, null];
            }
            """
        ).then(fn=None, _js='() => SDHubDownloader()')

        cancel_button.click(fn=cancel_download, outputs=[])

        txt_button.upload(fn=read_txt, inputs=[txt_button, input_box], outputs=input_box)
        scrape_button.click(fn=scraper, inputs=[input_box, token_1, gr.State()], outputs=[input_box, output_2])
