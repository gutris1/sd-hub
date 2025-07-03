from huggingface_hub import model_info, create_repo, create_branch
from huggingface_hub.utils import RepositoryNotFoundError
from modules.ui_components import FormRow, FormColumn
from modules.shared import cmd_opts
from fastapi import FastAPI
from pathlib import Path
import gradio as gr
import subprocess
import shlex
import time
import json
import sys
import re

from sd_hub.infotext import upl_title, upl_info, config, LoadConfig, LoadToken, SaveToken
from sd_hub.paths import SDHubPaths, BLOCK
from sd_hub.version import xyz

tag_tag = SDHubPaths.SDHubTagsAndPaths()

def push_push(
    repo_id, file_path, file_name, token, branch,
    is_private=False, commit_msg='', ex_ext=None, path_in_repo=None
):
    msg = commit_msg.replace('"', '\\"')
    cli = xyz('huggingface-cli.exe') if sys.platform == 'win32' else xyz('huggingface-cli')
    cmd = cli + ['upload', repo_id, file_path]

    if path_in_repo:
        path_in_repo = '/' + path_in_repo.lstrip('/') if path_in_repo.startswith('//') else path_in_repo
        path_in_repo = path_in_repo.rstrip('/')
        cmd += [f'{path_in_repo}/{file_name}']
    else:
        cmd += [file_name]

    cmd += ['--token', token, '--revision', branch, '--commit-message', msg]
    if is_private: cmd.append('--private')
    if ex_ext: cmd += ['--exclude', *[f'*.{ext}' for ext in ex_ext]]

    p = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    failed = False
    error = ''
    starting_line = time.time()

    for line in p.stdout:
        output = line.strip()

        if 'Bad request' in output:
            failed = True
            break

        kandang = output.split(':', 1)
        if len(kandang) > 1:
            asu = kandang[1].strip()
        else:
            continue

        lari = re.compile(r'\d+%|\d+M/\d+G|\d+\.\d+MB/s')
        now_line = time.time()
        if lari.search(asu):
            if now_line - starting_line >= 1:
                if 'Consider using' in asu:
                    continue
                yield asu, False
                starting_line = now_line

    if failed:
        error = output
        while True:
            part = p.stdout.readline()
            if not part:
                break
            error += part
        error = '.\n'.join(error.split('. '))
        yield error, True

    p.stdout.close()
    p.wait()

def isEmpty(fp):
    for f in fp.iterdir():
        rp = f.resolve()
        if rp.is_file() or (rp.is_dir() and any(rp.iterdir())):
            return False
    return True

def up_up(inputs, user, repo, branch, token, repo_radio):
    input_lines = [line.strip() for line in inputs.strip().splitlines()]

    if not inputs.strip() or not all([user, repo, branch, token]):
        params = [
            name for name, value in zip(
                ['Input', 'Username', 'Repository', 'Branch', 'Token'],
                [inputs.strip(), user, repo, branch, token]
            ) 
            if not value
        ]

        missing = ', '.join(params)

        yield f'Missing: [ {missing} ]', True
        return

    repo_id = f'{user}/{repo}'
    task_task = []

    for line in input_lines:
        parts = shlex.split(line)
        input_path = parts[0]
        input_path = input_path.strip('"').strip("'")

        if sys.platform == 'win32':
            input_path = Path(input_path).as_posix()

        given_fn = None
        ex_ext = None
        path_in_repo = None

        if '=' in parts:
            given_fn_idx = parts.index('=') + 1
            if given_fn_idx < len(parts):
                given_fn = parts[given_fn_idx]
            else:
                yield 'Invalid usage\n[ = ]', True
                return

        if '-' in parts:
            ex_ext_idx = parts.index('-') + 1
            if ex_ext_idx < len(parts):
                ex_ext = parts[ex_ext_idx:]
            else:
                yield 'Invalid usage\n[ - ]', True
                return

        if '>' in parts:
            path_in_repo_idx = parts.index('>') + 1
            if path_in_repo_idx < len(parts):
                path_in_repo = parts[path_in_repo_idx]
            else:
                yield 'Invalid usage\n[ > ]', True
                return

        full_path = Path(input_path) if not input_path.startswith('$') else None
        if input_path.startswith('$'):
            tag_key, _, subpath_or_file = input_path[1:].partition('/')
            tag_key = f'${tag_key.lower()}'
            resolved_path = tag_tag.get(tag_key)
            if resolved_path is None:
                yield f'{tag_key}\nInvalid tag.', True
                return
            full_path = Path(resolved_path, subpath_or_file)

        if not cmd_opts.enable_insecure_extension_access:
            allowed, err = SDHubPaths.SDHubCheckPaths(full_path)
            if not allowed:
                yield err, True
                return

        if full_path.exists():
            if full_path.is_file():
                type_ = 'file'
            elif full_path.is_dir():
                if isEmpty(full_path):
                    yield f'{full_path}\nInput Path is empty.', True
                    return
                type_ = 'folder'
            else:
                type_ = 'unknown'
        else:
            yield f'{full_path}\nInput Path does not exist.', True
            return

        if given_fn and not Path(given_fn).suffix and full_path.is_file():
            given_fn += full_path.suffix

        task_task.append((full_path, given_fn or full_path.name, type_, path_in_repo))

    for file_path, file_name, type_, path_in_repo in task_task:
        yield f'Uploading: {file_name}', False

        try:
            model_info(repo_id, token=token)
        except RepositoryNotFoundError:
            is_private = repo_radio == 'Private'
            create_repo(repo_id, private=is_private, token=token)

        create_branch(repo_id=repo_id, branch=branch, token=token, exist_ok=True)
        repo_info = model_info(repo_id, token=token)

        erorr = False

        for output in push_push(
            repo_id=repo_id,
            file_path=str(file_path),
            file_name=file_name,
            token=token,
            branch=branch,
            is_private=repo_radio == 'Private',
            commit_msg=f'Upload {file_name} using SD-Hub',
            ex_ext=ex_ext,
            path_in_repo=path_in_repo):

            yield output

            if output[1]: erorr = True; break

        if not erorr:
            files = f'{path_in_repo}/{file_name}' if path_in_repo else file_name

            details = (
                f'{repo_info.id}/{branch}/{files}\n'
                f'{repo_info.last_modified.strftime("%Y-%m-%d %H:%M:%S")}\n'
            )

            yield details, True

def uploader(inputs, user, repo, branch, token, repo_radio, box_state=gr.State()):
    SaveInfo(user, repo, branch)
    output_box = box_state if box_state else []

    for t, f in up_up(inputs, user, repo, branch, token, repo_radio):
        if not f:
            if 'Uploading' in t:
                yield t, '\n'.join(output_box)
            yield t, '\n'.join(output_box)
        else:
            output_box.append(t)

    catcher = ['not', 'Missing', 'Error', 'Invalid']

    if any(asu in wc for asu in catcher for wc in output_box):
        yield 'Error', '\n'.join(output_box)
    elif any(BLOCK in l for l in output_box):
        yield 'Blocked', '\n'.join(output_box)
        assert not cmd_opts.disable_extension_access, BLOCK
    else:
        yield 'Done', '\n'.join(output_box)

    return gr.update(), gr.State(output_box)

def SaveInfo(user, repo, branch):
    d = LoadConfig()
    d['Uploader-Info'] = {'username': user, 'repository': repo, 'branch': branch}
    config.write_text(json.dumps(d, indent=4), encoding='utf-8')

def LoadInfo():
    default = ('', '', 'main')
    d = LoadConfig()
    u = d.get('Uploader-Info', {})
    return tuple(u.get(k, v) for k, v in zip(['username', 'repository', 'branch'], default))

def LoadUploaderInfo(_: gr.Blocks, app: FastAPI):
    @app.get('/sd-hub/LoadUploaderInfo')
    async def uploaderInfo():
        user, repo, branch = LoadInfo()
        return {'username': user, 'repository': repo, 'branch': branch}

def UploaderTab():
    HFW, _, _, _, _ = LoadToken('uploader')
    TokenBlur = '() => { SDHubTokenBlur(); }'

    with gr.TabItem('Uploader', elem_id='SDHub-Uploader-Tab'):
        gr.HTML(upl_title)

        with FormRow():
            with FormColumn(scale=7):
                gr.HTML(upl_info)

            with FormColumn(scale=3):
                gr.Textbox(visible=False, max_lines=1)
                token_box = gr.TextArea(
                    value=HFW,
                    label='Huggingface Token (WRITE)',
                    lines=1,
                    max_lines=1,
                    placeholder='Your Huggingface Token here (role = WRITE)',
                    interactive=True,
                    elem_id='SDHub-Uploader-HFW',
                    elem_classes='sdhub-input'
                )

                with FormRow(elem_classes='sdhub-row'):
                    save_button = gr.Button(
                        value='SAVE',
                        variant='primary',
                        min_width=0,
                        elem_id='SDHub-Uploader-Save-Button',
                        elem_classes='sdhub-buttons'
                    )

                    load_button = gr.Button(
                        value='LOAD',
                        variant='primary',
                        min_width=0,
                        elem_id='SDHub-Uploader-Load-Button',
                        elem_classes='sdhub-buttons'
                    )

        with FormRow():
            user_box = gr.Textbox(
                max_lines=1,
                placeholder='Username',
                label='Username',
                elem_id='SDHub-Uploader-Username-Box',
                elem_classes='sdhub-input'
            )

            repo_box = gr.Textbox(
                max_lines=1,
                placeholder='Repository',
                label='Repository',
                elem_id='SDHub-Uploader-Repo-Box',
                elem_classes='sdhub-input'
            )

            branch_box = gr.Textbox(
                max_lines=1,
                placeholder='Branch',
                label='Branch',
                elem_id='SDHub-Uploader-Branch-Box',
                elem_classes='sdhub-input'
            )

            repo_radio = gr.Radio(
                ['Public', 'Private'],
                value='Private',
                label='Visibility',
                interactive=True,
                elem_id='SDHub-Uploader-Radio-Box',
                elem_classes='sdhub-radio'
            )

        input_box = gr.Textbox(
            show_label=False,
            lines=5,
            placeholder='Input File Path',
            elem_id='SDHub-Uploader-Input',
            elem_classes='sdhub-input'
        )

        with FormRow(elem_id='SDHub-Uploader-Button-Row'):
            with FormColumn(scale=6):
                with FormRow(elem_classes='sdhub-row'):
                    with FormRow(elem_classes='sdhub-button-row-1'):
                        upload_button = gr.Button(
                            'UPLOAD',
                            variant='primary',
                            elem_id='SDHub-Uploader-Upload-Button',
                            elem_classes='sdhub-buttons'
                        )

                    with FormRow(elem_classes='sdhub-button-row-2'):
                        gr.Button('hantu', variant='primary', elem_classes='hide-this')

            with FormColumn(scale=4):
                output_1 = gr.Textbox(
                    show_label=False,
                    interactive=False,
                    max_lines=1,
                    elem_classes='sdhub-output'
                )

                output_2 = gr.Textbox(
                    show_label=False,
                    interactive=False,
                    lines=5,
                    elem_classes='sdhub-output'
                )

        load_button.click(
            fn=lambda: LoadToken('uploader'), inputs=[], outputs=[token_box, output_2, output_2, output_2]
        ).then(fn=None, _js=TokenBlur)

        save_button.click(
            fn=lambda HFW: SaveToken(HFW, None, None), inputs=[token_box], outputs=output_2
        ).then(fn=None, _js=TokenBlur)

        upload_button.click(
            fn=uploader,
            inputs=[input_box, user_box, repo_box, branch_box, token_box, repo_radio, gr.State()],
            outputs=[output_1, output_2]
        )