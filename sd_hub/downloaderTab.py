from modules.ui_components import FormRow, FormColumn
from modules.scripts import basedir
from modules.shared import cmd_opts
from urllib.parse import urlparse
from pathlib import Path
from PIL import Image
import gradio as gr
import subprocess
import requests
import shlex
import time
import json
import sys
import re
import io
import os

from sd_hub.infotext import dl_title, dl_info, LoadToken, SaveToken
from sd_hub.paths import SDHubPaths, BLOCK
from sd_hub.scraper import scraper
from sd_hub.version import xyz

tag_tag = SDHubPaths.SDHubTagsAndPaths()
aria2cexe = Path(basedir()) / 'aria2c.exe'

def gitclown(url, target_path):
    cmd = ['git', 'clone'] + shlex.split(url)

    p = subprocess.Popen(
        cmd, cwd=str(target_path),
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        bufsize=1, text=True
    )

    git_output = []

    for output in iter(p.stdout.readline, ''):
        git_output.append(output)
        yield output, False

    for line in git_output:
        yield line, True

    p.wait()

def gdrown(url, target_path=None, fn=None):
    gfolder = 'drive.google.com/drive/folders' in url
    cli = xyz('gdown.exe') if sys.platform == 'win32' else xyz('gdown')
    cmd = cli + ['--fuzzy', url]
    fn and cmd.extend(['-O', fn])
    gfolder and cmd.append('--folder')

    cwd = target_path if target_path else Path.cwd()

    p = subprocess.Popen(
        cmd, cwd=cwd,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        bufsize=1, text=True
    )

    gdown_output, gdown_progress, starting_line, failure = '', None, time.time(), False

    while (output := p.stdout.readline()):  
        gdown_output += output  
        failure |= 'Failed to retrieve file url' in output  
        gdown_progress = output.strip() if re.search(r'\d{1,3}%', output) else gdown_progress  
        if gdown_progress and time.time() - starting_line >= 1:  
            yield gdown_progress, False  
            starting_line = time.time()

    if failure:
        failed = gdown_output.find('Failed to retrieve file url')
        lines = gdown_output[failed:]
        yield lines, False

    for lines in gdown_output.split('\n'):
        if lines.startswith('To:'):
            completed = re.search(r'[^/]*$', lines)
            if completed:
                yield f'Saved To: {target_path}/{completed.group()}', True

    p.wait()

def ariari(url, target_path=None, fn=None, HFR=None, CAK=None):
    aria2cmd = [aria2cexe] if sys.platform == 'win32' else xyz('aria2c')

    aria2cmd.extend([
        '--console-log-level=error', '--stderr=true', '--summary-interval=1',
        '-c', '-x16', '-s16', '-k1M', '-j5'
    ])

    if target_path:
        if not cmd_opts.enable_insecure_extension_access:
            allowed, err = SDHubPaths.SDHubCheckPaths(target_path)
            if not allowed:
                yield err, True
                return
            else:
                aria2cmd.extend(['--allow-overwrite=true'])
        else:
            aria2cmd.extend(['--allow-overwrite=true'])

        aria2cmd.extend(['-d', target_path])

    fn and aria2cmd.extend(['-o', fn])

    if any(domain in url for domain in ['huggingface.co', 'github.com']):
        civitai = False
        url = url.replace('/blob/', '/raw/' if 'github.com' in url else '/resolve/')
        if 'huggingface.co' in url and HFR:
            aria2cmd.extend(['--header=User-Agent: Mozilla/5.0', f'--header=Authorization: Bearer {HFR}'])

    elif 'civitai.com' in url:
        civitai = True
        input_url = url

        url = url.split('?token=')[0] if '?token=' in url else url

        try:
            if 'civitai.com/api/download/models/' in url:
                versionId = url.split('models/')[1].split('/')[0].split('?')[0]
                api_url = f'https://civitai.com/api/v1/model-versions/{versionId}'

            elif 'civitai.com/models/' in url:
                modelId = url.split('models/')[1].split('/')[0].split('?')[0]
                versionId = url.split('?modelVersionId=')[1] if '?modelVersionId=' in url else None

                if versionId:
                    api_url = f'https://civitai.com/api/v1/model-versions/{versionId}'
                else:
                    api_url = f'https://civitai.com/api/v1/models/{modelId}'

            r = requests.get(api_url)
            r.raise_for_status()
            j = r.json()

            msg = civitai_earlyAccess(j)
            if msg: yield msg; return

            civitai_infotags(j, target_path, fn)
            preview = civitai_preview(j, target_path, fn)

            url = j.get('downloadUrl')
            url = url.replace('?type=', f'?token={CAK}&type=') if '?type=' in url else f'{url}?token={CAK}'
            print(url)

            if not url:
                yield f'Unable to find download URL for\n-> {input_url}\n', False
                return

        except requests.exceptions.RequestException as e:
            yield f'{str(e)}\n', True
            return

    aria2cmd.append(url)

    p = subprocess.Popen(
        aria2cmd,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        bufsize=1, text=True
    )

    aria2_output, break_line, error = '', False, False

    while (output := p.stdout.readline()):
        aria2_output += output

        if 'errorCode=24' in output:
            if (uri_pattern := re.search(r'URI=(https?://\S+)', output)):
                uri = uri_pattern.group(1)
                url_list = {
                    'huggingface.co': f'## Authorization Failed, Enter your Huggingface Token\n-> {url}\n',
                    'civitai.com': f'## Authorization Failed, Enter your Civitai API Key\n-> {url}\n'
                }
                for domain, msg in url_list.items():
                    if domain in uri:
                        yield msg, False
                        error = True
                        break
            continue

        if 'errorCode' in output:
            if (arrow := aria2_output.find('->')) != -1:
                if (lines := aria2_output.find('\n', arrow)) != -1:
                    errorcode = aria2_output[arrow:lines]
                    if (uri_pattern := re.search(r'URI=(https?://\S+)', aria2_output)):
                        errorcode += f'\n{uri_pattern.group(1)}\n'
                    yield errorcode, False
                    error = True
            continue

        for lines in output.splitlines():
            if (dl_line := re.match(r'\[#\w{6}\s(.*?)\((\d+\%)\).*?DL:(.*?)\s', lines)):
                sizes, percent, speed = dl_line.groups()
                yield f'{percent} | {sizes} | {speed}/s', False
                break_line, error = True, False
                break

    if not error and (stripe := aria2_output.find('======+====+===========')) != -1:
        for lines in aria2_output[stripe:].splitlines():
            if '|' in lines and (pipe := lines.split('|')) and len(pipe) > 3:
                yield f'Saved To: {pipe[3].strip()}', True

        if civitai and preview:
            yield preview, False

    p.wait()

def get_fn(url):
    fn_fn = urlparse(url)

    if 'civitai.com' in fn_fn.netloc or 'drive.google.com' in fn_fn.netloc:
        return None
    else:
        fn = Path(fn_fn.path).name
        return fn

def resize(b):
    img = Image.open(io.BytesIO(b))
    w, h = img.size
    s = (512, int(h * 512 / w)) if w > h else (int(w * 512 / h), 512)
    out = io.BytesIO()
    img.resize(s, Image.LANCZOS).save(out, format='PNG')
    out.seek(0)
    return out

def civitai_preview(j, p, fn):
    encrypt = 'COLAB_JUPYTER_TOKEN' in os.environ
    if encrypt:
        try:
            import sd_image_encryption  # type: ignore
        except ImportError as e:
            err = f"{str(e)}\nimage preview skipped\nInstall https://github.com/gutris1/sd-image-encryption extension or you'll get banned by Kaggle."
            print(err)
            return err

    v = j['modelVersions'][0] if 'modelVersions' in j else j
    images = v.get('images', [])
    name = fn or v.get('files', [{}])[0].get('name')
    path = Path(p) / f'{Path(name).stem}.preview.png'
    if path.exists(): return

    preview = next((img.get('url', '') for img in images if not img.get('url', '').lower().endswith(('.mp4', '.gif'))), None)
    if not preview: return

    r = requests.get(preview, headers={'User-Agent': 'Mozilla/5.0'}).content
    resized = resize(r)

    if encrypt:
        img = Image.open(resized)
        info = img.info or {}
        if not all(t in info for t in ['Encrypt', 'EncryptPwdSha']):
            sd_image_encryption.EncryptedImage.from_image(img).save(path)
    else:
        path.write_bytes(resized.read())

def civitai_infotags(j, p, fn):
    if 'modelVersions' in j:
        modelId = j.get('id')
        v = j['modelVersions'][0]
        modelVersionId = v.get('id')
    else:
        v = j
        modelId = v.get('modelId')
        modelVersionId = v.get('id')

    name = fn or v.get('files', [{}])[0].get('name')
    info = Path(p) / f'{Path(name).stem}.json'
    if info.exists(): return

    sha256 = v.get('files', [{}])[0].get('hashes', {}).get('SHA256')
    data = {
        'activation text': ', '.join(v.get('trainedWords', [])),
        'modelId': modelId,
        'modelVersionId': modelVersionId,
        'sha256': sha256
    }

    info.write_text(json.dumps(data, indent=4))

def civitai_earlyAccess(j):
    v = None

    if 'modelVersions' in j:
        v = next((v for v in j.get('modelVersions', []) if v.get('availability') == 'EarlyAccess'), None)
        model_id = j.get('id')
    elif j.get('earlyAccessEndsAt'):
        v = j
        model_id = j.get('modelId')

    if v:
        version_id = v.get('id')
        page = f'https://civitai.com/models/{model_id}?modelVersionId={version_id}'
        return f'{page}\n-> The model is in early access and requires payment for downloading.', False

    return None

def url_check(url):
    try:
        url_parsed = urlparse(url)
        supported = {
            'civitai.com',
            'huggingface.co',
            'github.com',
            'drive.google.com'
        }

        if not (url_parsed.scheme and url_parsed.netloc):
            return False, 'Invalid URL.'

        if url_parsed.netloc not in supported:
            return False, f'Supported Domain:\n' + '\n'.join(supported)

        return True, ''
    except Exception as e:
        return False, str(e)

def process_inputs(url_line, current_path, ext_tag, github_repo):
    if any(url_line.startswith(char) for char in ('/', '\\', '#')):
        return None, None, None, 'Invalid usage, Tag should start with $'

    if url_line.startswith('$'):
        parts = url_line[1:].strip().split('/', 1)
        tags_key = f'${parts[0].lower()}'
        subfolder = parts[1] if len(parts) > 1 else None
        base_path = tag_tag.get(tags_key)
        if base_path is not None:
            full_path = Path(base_path, subfolder) if subfolder else Path(base_path)
            current_path = full_path
        else:
            return None, None, None, f'{tags_key}\nInvalid Tag.'
        return current_path, None, None, None

    parts = shlex.split(url_line)
    url = parts[0].strip()

    if not (ext_tag and github_repo):
        is_valid, err = url_check(url)
        if not is_valid:
            return None, None, None, err

    optional_path = optional_fn = None

    if len(parts) > 1:
        if ext_tag and github_repo:
            url = ' '.join(parts).strip()
        else:
            if '=' in parts:
                dash_index = parts.index('=')
                optional_path_raw = ' '.join(parts[1:dash_index]).strip()
                optional_fn = ' '.join(parts[dash_index + 1:]).strip()
            else:
                optional_path_raw = ' '.join(parts[1:]).strip()

            optional_path_raw = optional_path_raw.strip('"').strip("'")

            if sys.platform == 'win32' and optional_path_raw:
                optional_path_raw = Path(optional_path_raw).as_posix()

            optional_path = Path(optional_path_raw) if optional_path_raw else None

    if optional_path and optional_path.suffix:
        return None, None, None, f'{optional_path}\nOutput path is not a path.'

    if optional_fn:
        optional_fn_path = Path(optional_fn)
        if not optional_fn_path.suffix:
            return None, None, None, f'{optional_fn}\nOutput filename is missing its extension.'

    target_path = optional_path if optional_path else current_path
    if target_path is None or not target_path.exists():
        return None, None, None, f'{target_path}\nDoes not exist.'

    fn = get_fn(url) if not optional_fn else optional_fn

    return target_path, url, fn, None

def lobby(command, HFR=None, CAK=None):
    if not command.strip():
        yield 'Nothing To See Here.', True
        return

    current_path = None
    urls = [url_line for url_line in command.strip().split('\n') if url_line.strip()]

    if len(urls) == 1 and urls[0].startswith('$'):
        yield 'Missing URL.', True
        return

    ext_tag = urls[0].startswith('$ext')
    github_repo = any('github.com' in url_line and not Path(urlparse(url_line).path).suffix for url_line in urls)

    for url_line in urls:
        target_path, url, fn, error = process_inputs(url_line, current_path, ext_tag, github_repo)

        if error:
            yield error, True
            return

        if not url:
            current_path = target_path
            continue

        if ext_tag and github_repo:
            if cmd_opts.enable_insecure_extension_access:
                for msg, err in gitclown(url, target_path):
                    yield msg, err
                continue

        if 'drive.google' in url:
            for msg, err in gdrown(url, target_path, fn):
                yield msg, err
            continue

        for output in ariari(
            url,
            target_path,
            fn,
            HFR,
            CAK
        ):
            yield output

def downloader(inputs, HFR, CAK, box_state=gr.State()):
    output_box = box_state if box_state else []

    ngword = [
        '## Authorization Failed',
        'The model is in early access',
        'Unable to find',
        'errorCode',
        'Failed to retrieve',
        'fatal:'
    ]

    yield 'Downloading...', ''

    for t, f in lobby(inputs, HFR, CAK):
        if not f:
            if any(k in t for k in ngword):
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
        'filename', 'Supported Domain:', '500 Server Error', 'fatal'
    ]

    if any(w in l for w in catcher for l in output_box):
        yield 'Error', '\n'.join(output_box)
    elif any(BLOCK in l for l in output_box):
        yield 'Blocked', '\n'.join(output_box)
        assert not cmd_opts.disable_extension_access, BLOCK
    else:
        yield 'Done', '\n'.join(output_box)

    return gr.update(), gr.State(output_box)

def read_txt(f, box):
    text_box = [box] if box.strip() else []

    if f is not None:
        txt = Path(f.name).read_text()
        text_box.append(txt)

    return '\n'.join(text_box)

def DownloaderTab():
    _, HFR, CAK, _, _ = LoadToken('downloader')
    TokenBlur = '() => { SDHubTokenBlur(); }'

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

        civitai_preview_checkbox = gr.Checkbox(
            label='Civitai Preview',
            elem_id='SDHub-Downloader-Preview-Checkbox',
            elem_classes='sdhub-checkbox'
        )

        input_box = gr.Textbox(
            show_label=False,
            lines=5,
            placeholder='$tag\nURL',
            elem_id='SDHub-Downloader-Input',
            elem_classes='sdhub-input'
        )

        with FormRow(elem_id='SDHub-Downloader-Button-Row'):
            with FormColumn(scale=1), FormRow(elem_classes='sdhub-row'):
                download_button = gr.Button(
                    'DOWNLOAD',
                    variant='primary',
                    elem_id='SDHub-Downloader-Download-Button',
                    elem_classes='sdhub-buttons'
                )

                with FormRow(variant='compact'):
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

            with FormColumn(scale=1):
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

        load_button.click(
            fn=lambda: LoadToken('downloader'), inputs=[], outputs=[output_2, token_1, token_2, output_2]
        ).then(fn=None, _js=TokenBlur)

        save_button.click(
            fn=lambda HFR, CAK: SaveToken(None, HFR, CAK), inputs=[token_1, token_2], outputs=output_2
        ).then(fn=None, _js=TokenBlur)

        download_button.click(
            fn=downloader, inputs=[input_box, token_1, token_2, gr.State()], outputs=[output_1, output_2],
            _js="""
                () => {
                    let el = {input: '#SDHub-Downloader-Input textarea', token1: '#SDHub-Downloader-HFR input', token2: '#SDHub-Downloader-CAK input'};
                    let v = Object.entries(el).map(([k, id]) => document.querySelector(id)?.value || '');
                    window.SDHubDownloaderInputsValue = v[0];
                    return [...v, null];
                }
            """
        ).then(fn=None, _js='() => { SDHubDownloader(); }')

        txt_button.upload(fn=read_txt, inputs=[txt_button, input_box], outputs=input_box)
        scrape_button.click(fn=scraper, inputs=[input_box, token_1, gr.State()], outputs=[input_box, output_2])