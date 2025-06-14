from modules.ui_components import FormRow, FormColumn
from modules.scripts import basedir
from modules.shared import cmd_opts
from urllib.parse import urlparse
from pathlib import Path
import gradio as gr
import subprocess
import requests
import shlex
import time
import sys
import re

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

def ariari(url, target_path=None, fn=None, token2=None, token3=None):
    aria2cmd = [aria2cexe] if sys.platform == 'win32' else xyz('aria2c')

    if any(domain in url for domain in ['huggingface.co', 'gitHub.com']):
        url = url.replace('/blob/', '/raw/' if 'gitHub.com' in url else '/resolve/')

        if 'huggingface.co' in url and token2:
            aria2cmd.extend([
                '--header=User-Agent: Mozilla/5.0',
                f'--header=Authorization: Bearer {token2}'
            ])

    elif 'civitai.com/models/' in url:
        try:
            model_id = url.split('/models/')[1].split('/')[0]
            version_id = url.split('?modelVersionId=')[1] if '?modelVersionId=' in url else None
            there = bool(version_id)

            api_url = (
                f'https://civitai.com/api/v1/model-versions/{version_id}'
                if there else f'https://civitai.com/api/v1/models/{model_id}'
            )

            r = requests.get(api_url)
            r.raise_for_status()
            v = r.json()

            earlyAccess = (
                v.get('earlyAccessEndsAt') if there
                else next((v for v in v.get('modelVersions', []) if v.get('availability') == 'EarlyAccess'), None)
            )

            if earlyAccess:
                id = v.get('id') if there else earlyAccess.get('id')
                page = url if there else f'https://civitai.com/models/{model_id}?modelVersionId={id}'
                msg = f'{page}\n-> The model is in early access and requires payment for downloading.'
                yield msg, False
                return

            download = v.get('downloadUrl') or (v.get('modelVersions', [{}])[0].get('downloadUrl') if not there else '')
            url = f'{download}?token={token3}' if token3 and download else download
            if not url:
                yield f'Unable to find download URL for\n-> {api_url}\n', False
                return

        except requests.exceptions.RequestException as e:
            yield f'{str(e)}\n', True
            return

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

    p.wait()

def get_fn(url):
    fn_fn = urlparse(url)

    if 'civitai.com' in fn_fn.netloc or 'drive.google.com' in fn_fn.netloc:
        return None
    else:
        fn = Path(fn_fn.path).name
        return fn

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

def lobby(command, token2=None, token3=None):
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
            token2,
            token3
        ):
            yield output

def downloader(inputs, token2, token3, box_state=gr.State()):
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

    for t, f in lobby(inputs, token2, token3):
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
        'exist', 'Invalid', 'Tag', 'Output', 'Nothing', 'URL',
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
    _, token2, token3, _, _ = LoadToken('downloader')
    TokenBlur = '() => { SDHubTokenBlur(); }'

    with gr.TabItem('Downloader', elem_id='SDHub-Downloader-Tab'):
        gr.HTML(dl_title)

        with FormRow():
            with FormColumn(scale=7):
                gr.HTML(dl_info)

            with FormColumn(scale=3):
                dl_token1 = gr.TextArea(
                    value=token2,
                    label='Huggingface Token (READ)',
                    lines=1,
                    max_lines=1,
                    placeholder='Your Huggingface Token here (role = READ)',
                    interactive=True,
                    elem_id='SDHub-Downloader-Token-1',
                    elem_classes='sdhub-input'
                )

                dl_token2 = gr.TextArea(
                    value=token3,
                    label='Civitai API Key',
                    lines=1,
                    max_lines=1,
                    placeholder='Your Civitai API Key here',
                    interactive=True,
                    elem_id='SDHub-Downloader-Token-2',
                    elem_classes='sdhub-input'
                )

                with FormRow():
                    dl_save = gr.Button(
                        value='SAVE',
                        variant='primary',
                        min_width=0,
                        elem_id='SDHub-Downloader-Save-Button',
                        elem_classes='sdhub-buttons'
                    )

                    dl_load = gr.Button(
                        value='LOAD',
                        variant='primary',
                        min_width=0,
                        elem_id='SDHub-Downloader-Load-Button',
                        elem_classes='sdhub-buttons'
                    )

        dl_input = gr.Textbox(
            show_label=False,
            lines=5,
            placeholder='$tag\nURL',
            elem_id='SDHub-Downloader-Input',
            elem_classes='sdhub-input'
        )

        with FormRow(elem_id='SDHub-Downloader-Button-Row'):
            with FormColumn(scale=1):
                dl_dl = gr.Button(
                    'DOWNLOAD',
                    variant='primary',
                    elem_id='SDHub-Downloader-Download-Button',
                    elem_classes='sdhub-buttons'
                )

            with FormColumn(scale=1), FormRow(variant='compact'):
                dl_scrape = gr.Button(
                    'Scrape',
                    variant='secondary',
                    min_width=0,
                    elem_id='SDHub-Downloader-Scrape-Button'
                )

                dl_txt = gr.UploadButton(
                    label='Insert TXT',
                    variant='secondary',
                    file_count='single',
                    file_types=['.txt'],
                    min_width=0,
                    elem_id='SDHub-Downloader-Txt-Button'
                )

            with FormColumn(scale=2, variant='compact'):
                dl_out1 = gr.Textbox(
                    show_label=False,
                    interactive=False,
                    max_lines=1,
                    elem_classes='sdhub-output'
                )

                dl_out2 = gr.TextArea(
                    show_label=False,
                    interactive=False,
                    lines=5,
                    elem_classes='sdhub-output'
                )

        dl_load.click(
            fn=lambda: LoadToken('downloader'),
            inputs=[],
            outputs=[dl_out2, dl_token1, dl_token2, dl_out2]
        ).then(fn=None, _js=TokenBlur)

        dl_save.click(
            fn=lambda token2, token3: SaveToken(None, token2, token3),
            inputs=[dl_token1, dl_token2],
            outputs=dl_out2
        ).then(fn=None, _js=TokenBlur)

        dl_dl.click(
            fn=downloader,
            inputs=[dl_input, dl_token1, dl_token2, gr.State()],
            outputs=[dl_out1, dl_out2],
            _js="""
                () => {
                    let el = {
                        input: '#SDHub-Downloader-Input textarea',
                        token1: '#SDHub-Downloader-Token-1 input',
                        token2: '#SDHub-Downloader-Token-2 input'
                    };

                    let v = Object.entries(el).map(([k, id]) => 
                        document.querySelector(id)?.value || ''
                    );

                    window.SDHubDownloaderInputsValue = v[0];
                    return [...v, null];
                }
            """
        ).then(fn=None, _js='() => { SDHubDownloader(); }')

        dl_txt.upload(fn=read_txt, inputs=[dl_txt, dl_input], outputs=dl_input)
        dl_scrape.click(fn=scraper, inputs=[dl_input, dl_token1, gr.State()], outputs=[dl_input, dl_out2])