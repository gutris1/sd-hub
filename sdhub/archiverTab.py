from pathlib import Path
from tqdm import tqdm
import gradio as gr
import subprocess
import zipfile
import select
import sys
import os

if sys.platform == 'win32': import tarfile, gzip, lz4.frame
else: import pty

from modules.ui_components import FormRow, FormColumn
from modules.shared import cmd_opts

from sdhub.paths import SDHubPaths, BLOCK
from sdhub.zipoutputs import ZipOutputs
from sdhub.infotext import arc_info

tag_tag = SDHubPaths.SDHubTagsAndPaths()

def _paths(*args):
    names, values = zip(*args)
    values = [v.strip('"').strip("'") if isinstance(v, str) else v for v in values]
    missing = ', '.join(n for n, v in zip(names, values) if not v)
    if missing: return None, f'Missing: {missing}'

    if sys.platform == 'win32': values = [Path(v).as_posix() for v in values]

    return values, None

def _paths_check(input, output, mkdir):
    if input or output:
        if not input.exists(): return f'input path: {input} does not exist'
        if output.suffix: return f'Output Path: {output} is not a directory.'
        if not mkdir and not output.exists(): return f'Output Path: {output} does not exist'
        if mkdir: output.mkdir(parents=True, exist_ok=True)

def tar_win_process(inputs, paths, formats, outputs):
    tar_out = str(outputs) + '.tar'

    with tarfile.open(tar_out, 'w') as tar:
        for file in inputs:
            tar.add(paths / file, arcname=str(paths.name / file.name))

    if formats == 'lz4':
        lz4_out = str(outputs) + '.tar.lz4'
        with open(tar_out, 'rb') as tar_file, lz4.frame.open(lz4_out, 'wb') as lz4_file:
            while chunk := tar_file.read(4 * 1024 * 1024):
                lz4_file.write(chunk)
        Path(tar_out).unlink()

    elif formats == 'gz':
        gz_out = str(outputs) + '.tar.gz'
        with open(tar_out, 'rb') as tar_file, gzip.open(gz_out, 'wb') as gz_file:
            while chunk := tar_file.read(4 * 1024 * 1024):
                gz_file.write(chunk)
        Path(tar_out).unlink()

    yield f'Saved to: {outputs}.tar.{formats}', True

def tar_win(input_path, file_name, output_path, input_type, format_type, split_by):
    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    yield f'Compressing {input_path_obj}', False

    if input_type == 'folder':
        all_files = [f for f in input_path_obj.iterdir() if f.is_file() or f.is_dir()]

        total_parts = len(all_files)
        files_split = min(split_by, total_parts) if split_by > 0 else 1

        for i in range(files_split):
            start = i * (total_parts // files_split)
            end = start + (total_parts // files_split) if i < files_split - 1 else None
            split = all_files[start:end]

            output = output_path_obj / f"{file_name}{'_' + str(i + 1) if split_by > 0 else ''}"
            yield from tar_win_process(split, input_path_obj, format_type, output)

    else:
        output = output_path_obj / f'{file_name}'
        yield from tar_win_process([input_path_obj], input_path_obj.parent, format_type, output)

def tar_process(_tar, _pv, _format, _output):
    for chunk, _ in unix_pipe([_tar, _pv, _format], output=_output, pty_cmd_index=1):
        yield chunk, False

    yield f'Saved to: {_output}', True

def tar_tar(input_path, file_name, output_path, input_type, format_type, split_by):
    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    parent_dir = str(input_path_obj.parent)

    if format_type == 'gz': comp_type = 'gzip'
    elif format_type == 'lz4': comp_type = 'lz4'

    _pv = ['pv']
    _format = [comp_type]

    cmd = ['tar', 'cf', '-', '-C', parent_dir, input_path_obj.name]

    if input_type == 'folder':
        all_files = [
            f.relative_to(input_path_obj.parent)
            for f in input_path_obj.rglob('*')
            if f.is_file() or (f.is_dir() and any(f.iterdir()))
        ]

        count = 0
        total_parts = len(all_files)
        files_split = min(split_by, total_parts) if split_by > 0 else 1

        for i in range(files_split):
            start = i * (total_parts // files_split)
            end = start + (total_parts // files_split) if i < files_split - 1 else None
            _split = all_files[start:end]
            count += 1
            _output = output_path_obj / f"{file_name}{'_' + str(count) if split_by > 0 else ''}.tar.{format_type}"
            cmds = ['tar', 'cfh', '-', '-C', parent_dir] + [str(f) for f in _split]
            params = (cmds if files_split > 1 else cmd, _pv, _format, _output)
            yield from tar_process(*params)

    else:
        _output = output_path_obj / f'{file_name}.tar.{format_type}'
        yield from tar_process(cmd, _pv, _format, _output)

def _zip(input_path, file_name, output_path, input_type, format_type, split_by):
    _ = format_type
    zip_in = Path(input_path)
    zip_out = Path(output_path)
    _bar = '{percentage:3.0f}% | {n_fmt}/{total_fmt} | {rate_fmt}{postfix}'

    if input_type == 'folder':
        cwd = zip_in
        all_files = [
            file for file in cwd.iterdir()
            if (file.is_file() or (file.is_dir() and any(file.iterdir())))
        ]

        _count = 0
        total_parts = len(all_files)
        files_split = min(split_by, total_parts) if split_by > 0 else 1

        for i in range(files_split):
            start = i * (total_parts // files_split)
            end = (i + 1) * (total_parts // files_split) if i < files_split - 1 else None
            _split = all_files[start:end]

            if not _split: continue

            _count += 1
            output_zip = zip_out / f"{file_name}{'_' + str(_count) if split_by > 0 else ''}.zip"

            yield f'Compressing {output_zip.name}', False

            with tqdm(
                total=sum(f.stat().st_size for f in _split if f.is_file()),
                unit='B', unit_scale=True, bar_format=_bar
            ) as pbar:
                with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file in _split:
                        if file.is_file():
                            zipf.write(file, file.relative_to(cwd))
                            pbar.update(file.stat().st_size)

                        else:
                            for sub_file in file.rglob('*'):
                                if sub_file.is_file():
                                    zipf.write(sub_file, sub_file.relative_to(cwd))
                                    pbar.update(sub_file.stat().st_size)

                        yield pbar, False

            yield f'Saved To: {output_zip}', True

    else:
        output_zip = zip_out / f'{file_name}.zip'

        yield f'Compressing {output_zip.name}', False

        with tqdm(total=zip_in.stat().st_size, unit='B', unit_scale=True, bar_format=_bar) as pbar:
            with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
                chunk_size = 4096 * 1024
                with open(zip_in, 'rb') as file_to_compress, zipf.open(zip_in.name, 'w') as dest:
                    while chunk := file_to_compress.read(chunk_size):
                        dest.write(chunk)
                        pbar.update(len(chunk))
                        yield pbar, False

        yield f'Saved To: {output_zip}', True

def path_archive(input_path, file_name, output_path, archiver_format, archiver_mkdir, split_by):
    P, err = _paths(('Input Path', input_path), ('Name', file_name), ('Output Path', output_path))
    if err: yield err, True; return
    input_path, file_name, output_path = P

    for i, path_str in enumerate([input_path, output_path]):
        if path_str.startswith('$'):
            tag_key, _, subpath_or_file = path_str[1:].partition('/')
            tag_key = f'${tag_key.lower()}'
            resolved_path = tag_tag.get(tag_key)

            if resolved_path is None: yield f'{tag_key}\nInvalid tag.', True; return

            resolved_path = Path(resolved_path, subpath_or_file)
            if i == 0: input_path = resolved_path
            else: output_path = resolved_path

    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if input_path_obj or output_path_obj:
        if err := _paths_check(input_path_obj, output_path_obj, archiver_mkdir): yield err, True; return

        if not cmd_opts.enable_insecure_extension_access:
            for path in [input_path_obj, output_path_obj]:
                allowed, err = SDHubPaths.SDHubCheckPaths(path)
                if not allowed: yield err, True; return

    if input_path_obj.is_file(): input_type = 'file'
    elif input_path_obj.is_dir(): input_type = 'folder'

    tar = tar_win if sys.platform == 'win32' else tar_tar
    select_arc = {'zip': _zip, 'tar.gz': tar, 'tar.lz4': tar}

    arc_select = select_arc.get(archiver_format)

    split_dict = {'None': 0, '2': 2, '3': 3, '4': 4, '5': 5}
    split_by = split_dict.get(split_by, 0)

    for output in arc_select(
        input_path,
        file_name,
        output_path, 
        input_type,
        format_type=archiver_format.split('.')[-1],
        split_by=split_by
    ):
        yield output

def archive(input_path, file_name, output_path, archiver_format, archiver_mkdir, split_by, s=gr.State()):
    output_box = s if s else []

    for l, f in path_archive(input_path, file_name, output_path, archiver_format, archiver_mkdir, split_by):
        if not f: yield l, '\n'.join(output_box)
        else: output_box.append(l)

    c = ['not', 'Missing', 'Invalid']

    if any(t in l for t in c for l in output_box):
        yield 'Error', '\n'.join(output_box)

    elif any(BLOCK in l for l in output_box):
        yield 'Blocked', '\n'.join(output_box)
        assert not cmd_opts.disable_extension_access, BLOCK

    else: yield '', '\n'.join(output_box)

####################################################################################
####################################################################################

def unix_pipe(commands, output=None, pty_cmd_index=0):
    ayu, rika = pty.openpty()  # type: ignore

    procs = []
    prev = None
    out_file = None

    for i, cmd in enumerate(commands):
        last = (i == len(commands) - 1)
        stderr = rika if i == pty_cmd_index else subprocess.PIPE

        if last and output:
            out_file = open(str(output), 'wb')
            stdout = out_file
        else:
            stdout = subprocess.PIPE

        p = subprocess.Popen(cmd, stdin=prev, stdout=stdout, stderr=stderr, text=True)
        procs.append(p)
        prev = p.stdout

    os.close(rika)

    while True:
        try:
            ready, _, _ = select.select([ayu], [], [])
            if ready:
                chunk = os.read(ayu, 8192)
                if not chunk: break
                yield chunk.decode('utf-8'), False
        except OSError:
            break

    for p in procs[:-1]:
        if p.stdout: p.stdout.close()

    for p in procs:
        p.wait()

    if out_file: out_file.close()
    os.close(ayu)

####################################################################################
####################################################################################

def extraction_win(input_path, output_path, format_type):
    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)
    is_done = False

    yield f'Extracting: {input_path_obj}', False

    if format_type == 'zip':
        _bar = '{n_fmt}/{total_fmt} | [{bar:26}]'

        with zipfile.ZipFile(input_path_obj, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            total_files = len(file_list)

            with tqdm(total=total_files, unit='file', bar_format=_bar, ascii='▷▶') as pbar:
                for file_name in file_list:
                    zip_ref.extract(file_name, output_path_obj)
                    pbar.update(1)
                    yield pbar, False

                is_done = True

    elif format_type in ['tar.gz', 'tar.lz4']:
        mode = 'r:gz' if format_type == 'tar.gz' else 'r|' if format_type == 'tar.lz4' else None

        if format_type == 'tar.lz4':
            with open(input_path_obj, 'rb') as lz4_file:
                with lz4.frame.open(lz4_file, mode='rb') as tar_lz4_file:
                    with tarfile.open(fileobj=tar_lz4_file, mode=mode) as tar:
                        tar.extractall(output_path_obj)

        elif format_type == 'tar.gz':
            with tarfile.open(input_path_obj, mode=mode) as tar:
                tar.extractall(output_path_obj)

        is_done = True

    if is_done: yield f'Extracted To: {output_path}', True

def extraction(input_path, output_path, format_type):
    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)
    is_done = False

    yield f'Extracting: {input_path_obj}', False

    if format_type == 'zip':
        _bar = '{n_fmt}/{total_fmt} | [{bar:26}]'

        with zipfile.ZipFile(input_path_obj, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            total_files = len(file_list)

            with tqdm(total=total_files, unit='file', bar_format=_bar, ascii='▷▶') as pbar:
                for file_name in file_list:
                    zip_ref.extract(file_name, output_path_obj)
                    pbar.update(1)
                    yield pbar, False
                    is_done = True

    elif format_type in ['tar.gz', 'tar.lz4']:
        _pv = ['pv', str(input_path_obj)]
        _type = ['gzip', '-d'] if format_type == 'tar.gz' else ['lz4', '-d']
        _tar = ['tar', 'xf', '-', '-C', str(output_path_obj)]

        for chunk, _ in unix_pipe([_pv, _type, _tar], pty_cmd_index=0):
            yield chunk, False
            is_done = True

    if is_done: yield f'Extracted To: {output_path}', True

def path_extract(input_path, output_path, extractor_mkdir):
    P, err = _paths(('Input Path', input_path), ('Output Path', output_path))
    if err: yield err, True; return
    input_path, output_path = P

    for i, path_str in enumerate([input_path, output_path]):
        if path_str.startswith('$'):
            tag_key, _, subpath_or_file = path_str[1:].partition('/')
            tag_key = f'${tag_key.lower()}'
            resolved_path = tag_tag.get(tag_key)

            if resolved_path is None: yield f'{tag_key}\nInvalid tag.', True; return

            resolved_path = Path(resolved_path, subpath_or_file)
            if i == 0: input_path = resolved_path
            else: output_path = resolved_path

    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if input_path_obj or output_path_obj:
        if err := _paths_check(input_path_obj, output_path_obj, extractor_mkdir): yield err, True; return

        if not cmd_opts.enable_insecure_extension_access:
            for path in [input_path_obj, output_path_obj]:
                allowed, err = SDHubPaths.SDHubCheckPaths(path)
                if not allowed: yield err, True; return

    select_ext = {'.zip': 'zip', '.tar.gz': 'tar.gz', '.tar.lz4': 'tar.lz4'}
    input_ext = ''.join(input_path_obj.suffixes)
    format_type = select_ext.get(input_ext)

    if not format_type: yield f'Unsupported format: {input_ext}', True; return

    ext_func = extraction_win if sys.platform == 'win32' else extraction

    for output in ext_func(input_path, output_path, format_type): yield output

def extract(input_path, output_path, extractor_mkdir, s=gr.State()):
    output_box = s if s else []

    for t, f in path_extract(input_path, output_path, extractor_mkdir):
        if not f: yield t, '\n'.join(output_box)
        else: output_box.append(t)

    c = ['not', 'Missing', 'Invalid', 'Unsupported']

    if any(t in l for t in c for l in output_box):
        yield 'Error', '\n'.join(output_box)

    elif 'files from/to outside' in output_box:
        yield 'Blocked', '\n'.join(output_box)
        assert not cmd_opts.disable_extension_access, BLOCK

    else: yield '', '\n'.join(output_box)

def ArchiverTab():
    with gr.TabItem('Archiver', elem_id='SDHub-Archiver-Tab'):
        with gr.Accordion(
            'ReadMe',
            open=False,
            elem_id='SDHub-Archiver-Accordion-Readme',
            elem_classes='sdhub-accordion'
        ):
            gr.HTML(arc_info)

        ZipOutputs()

        with FormRow():
            with FormColumn(elem_classes='sdhub-column'):
                gr.HTML("""<h3 style='font-size: 17px;' id='SDHub-Archiver-Archive-Title'>Archive</h3>""")

                with FormRow(elem_id='SDHub-Archiver-Radio-Row'):
                    archiver_format = gr.Radio(
                        ['tar.lz4', 'tar.gz', 'zip'],
                        value='tar.lz4',
                        label='Format',
                        scale=5,
                        interactive=True,
                        elem_id='SDHub-Archiver-Radio-Format',
                        elem_classes='sdhub-radio'
                    )

                    archiver_split = gr.Radio(
                        ['None', '2', '3', '4', '5'],
                        value='None',
                        label='Split by',
                        scale=5,
                        interactive=True,
                        elem_id='SDHub-Archiver-Radio-Split',
                        elem_classes='sdhub-radio'
                    )

                with FormRow(elem_classes='sdhub-button-output-row'):
                    with FormColumn(scale=6, elem_classes='sdhub-column'):
                        archiver_name = gr.Textbox(
                            max_lines=1,
                            placeholder='Name',
                            show_label=False,
                            elem_id='SDHub-Archiver-Archive-Input-Name',
                            elem_classes='sdhub-input'
                        )

                        archiver_input = gr.Textbox(
                            max_lines=1,
                            placeholder='Input Path',
                            show_label=False,
                            elem_id='SDHub-Archiver-Archive-Input-Path',
                            elem_classes='sdhub-input'
                        )

                        archiver_output = gr.Textbox(
                            max_lines=1,
                            placeholder='Output Path',
                            show_label=False,
                            elem_id='SDHub-Archiver-Archive-Output-Path',
                            elem_classes='sdhub-input'
                        )

                        with FormRow(elem_classes='sdhub-button-output-row'):
                            with FormRow(elem_classes='sdhub-button-row-1'):
                                archiver_button = gr.Button(
                                    'Compress',
                                    variant='primary',
                                    elem_id='SDHub-Archiver-Archive-Button',
                                    elem_classes='sdhub-buttons'
                                )

                            with FormRow(elem_classes='sdhub-button-row-2'):
                                archiver_mkdir = gr.Checkbox(
                                    label='Create Directory',
                                    elem_id='SDHub-Archiver-Archive-Checkbox',
                                    elem_classes='sdhub-checkbox'
                                )

                    with FormColumn(scale=4, elem_id='SDHub-Archiver-Output', elem_classes='sdhub-column'):
                        archiver_output_1 = gr.Textbox(
                            show_label=False,
                            interactive=False,
                            max_lines=1,
                            elem_classes='sdhub-output'
                        )

                        archiver_output_2 = gr.Textbox(
                            show_label=False,
                            interactive=False,
                            lines=5,
                            elem_classes='sdhub-output'
                        )

        with FormRow(elem_id='SDHub-Archiver-Extract-Row', elem_classes='sdhub-button-output-row'):
            with FormColumn(scale=6, elem_classes='sdhub-column'):
                gr.HTML("""<h3 style='font-size: 17px;' id='SDHub-Archiver-Extract-Title'>Extract</h3>""")

                extractor_input = gr.Textbox(
                    max_lines=1,
                    placeholder='Input Path',
                    show_label=False,
                    elem_id='SDHub-Archiver-Extract-Input-Path',
                    elem_classes='sdhub-input'
                )

                extractor_output = gr.Textbox(
                    max_lines=1,
                    placeholder='Output Path',
                    show_label=False,
                    elem_id='SDHub-Archiver-Extract-Output-Path',
                    elem_classes='sdhub-input'
                )

                with FormRow(elem_classes='sdhub-button-output-row'):
                    with FormRow(elem_classes='sdhub-button-row-1'):
                        extractor_button = gr.Button(
                            'Decompress',
                            variant='primary',
                            elem_id='SDHub-Archiver-Extract-Button',
                            elem_classes='sdhub-buttons'
                        )

                    with FormRow(elem_classes='sdhub-button-row-2'):
                        extractor_mkdir = gr.Checkbox(
                            label='Create Directory',
                            elem_id='SDHub-Archiver-Extract-Checkbox',
                            elem_classes='sdhub-checkbox'
                        )

            with FormColumn(scale=4, elem_classes='sdhub-column'):
                gr.Textbox(max_lines=1, show_label=False, elem_classes='sdhub-hidden')

        finish = '() => SDHubArchiver("finish")'

        archiver_button.click(
            fn=archive,
            inputs=[archiver_input, archiver_name, archiver_output, archiver_format, archiver_mkdir, archiver_split, gr.State()],
            outputs=[archiver_output_1, archiver_output_2]
        ).then(fn=None, _js=finish)

        extractor_button.click(
            fn=extract,
            inputs=[extractor_input, extractor_output, extractor_mkdir, gr.State()],
            outputs=[archiver_output_1, archiver_output_2]
        ).then(fn=None, _js=finish)