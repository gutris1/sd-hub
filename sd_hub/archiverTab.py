from modules.ui_components import FormRow
from modules.shared import cmd_opts
from pathlib import Path
from tqdm import tqdm
import gradio as gr
import subprocess
import zipfile
import select
import sys
import os

if sys.platform == 'win32':
    import tarfile, gzip, lz4.frame
else:
    import pty

from sd_hub.paths import SDHubPaths, BLOCK
from sd_hub.infotext import arc_info

tag_tag = SDHubPaths.SDHubTagsAndPaths()

def tar_win_process(inputs, paths, formats, outputs):
    tar_out = str(outputs) + '.tar'

    with tarfile.open(tar_out, 'w') as tar:
        for file in inputs:
            tar.add(paths / file, arcname=str(paths.name / file.name))

    if formats == 'lz4':
        lz4_out = str(outputs) + '.tar.lz4'
        with open(tar_out, 'rb') as tar_file:
            with open(lz4_out, 'wb') as lz4_file:
                data = lz4.frame.compress(tar_file.read())
                lz4_file.write(data)

        Path(tar_out).unlink()

    elif formats == 'gz':
        gz_out = str(outputs) + '.tar.gz'
        with open(tar_out, 'rb') as tar_file:
            with gzip.open(gz_out, 'wb') as gz_file:
                gz_file.write(tar_file.read())

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
    ayu, rika = pty.openpty() # type: ignore

    p_tar = subprocess.Popen(
        _tar,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    p_pv = subprocess.Popen(
        _pv,
        stdin=p_tar.stdout,
        stdout=subprocess.PIPE,
        stderr=rika,
        text=True
    )

    p_type = subprocess.Popen(
        _format,
        stdin=p_pv.stdout,
        stdout=open(str(_output), 'wb'),
        stderr=subprocess.PIPE,
        text=True
    )

    os.close(rika)

    while True:
        try:
            temenan, _, _ = select.select([ayu], [], [])
            if temenan:
                ketemuan = os.read(ayu, 8192)
                if not ketemuan:
                    break

                yield ketemuan.decode('utf-8'), False

        except OSError:
            break

    p_tar.stdout.close()
    p_pv.stdout.close()

    _ = p_tar.wait()
    _ = p_pv.wait()
    _ = p_type.wait()

    yield f'Saved to: {_output}', True

def tar_tar(input_path, file_name, output_path, input_type, format_type, split_by):
    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    parent_dir = str(input_path_obj.parent)

    if format_type == 'gz':
        comp_type = 'gzip'
    elif format_type == 'lz4':
        comp_type = 'lz4'

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

            if not _split:
                continue

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

        with tqdm(
            total=zip_in.stat().st_size, unit='B', unit_scale=True, bar_format=_bar
        ) as pbar:
            with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
                chunk_size = 4096 * 1024
                with open(zip_in, 'rb') as file_to_compress:
                    while True:
                        chunk = file_to_compress.read(chunk_size)
                        if not chunk:
                            break

                        zipf.writestr(zip_in.name, chunk)
                        pbar.update(len(chunk))

                        yield pbar, False

        yield f'Saved To: {output_zip}', True

def path_archive(input_path, file_name, output_path, arc_format, mkdir_cb1, split_by):
    input_path = input_path.strip('"').strip("'")
    output_path = output_path.strip('"').strip("'")

    if sys.platform == 'win32':
        input_path = Path(input_path).as_posix()
        output_path = Path(output_path).as_posix()

    params = [
        name for name, value in zip(
            ['Input Path', 'Name', 'Output Path'],
            [input_path, file_name, output_path]
        ) if not value
    ]

    missing = ', '.join(params)

    if missing:
        yield f'Missing: [ {missing} ]', True
        return

    for i, path_str in enumerate([input_path, output_path]):
        if path_str.startswith('$'):
            tag_key, _, subpath_or_file = path_str[1:].partition('/')
            tag_key = f'${tag_key.lower()}'
            resolved_path = tag_tag.get(tag_key)

            if resolved_path is None:
                yield f'{tag_key}\nInvalid tag.', True
                return

            resolved_path = Path(resolved_path, subpath_or_file)
            if i == 0:
                input_path = resolved_path
            else:
                output_path = resolved_path

    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if input_path_obj or output_path_obj:
        if not input_path_obj.exists():
            yield f'{input_path_obj}\ndoes not exist', True
            return

        if output_path_obj.suffix:
            yield f'{output_path}\nOutput Path is not a directory.', True
            return

        if not mkdir_cb1 and not output_path_obj.exists():
            yield f'{output_path_obj}\ndoes not exist', True
            return
        elif mkdir_cb1:
            output_path_obj.mkdir(parents=True, exist_ok=True)

        if not cmd_opts.enable_insecure_extension_access:
            for path in [input_path_obj, output_path_obj]:
                allowed, err = SDHubPaths.SDHubCheckPaths(path)
                if not allowed:
                    yield err, True
                    return

    if input_path_obj.is_file():
        input_type = 'file'
    elif input_path_obj.is_dir():
        input_type = 'folder'

    if sys.platform == 'win32':
        select_arc = {'zip': _zip, 'tar.gz': tar_win, 'tar.lz4': tar_win}
    else:
        select_arc = {'zip': _zip, 'tar.gz': tar_tar, 'tar.lz4': tar_tar}

    arc_select = select_arc.get(arc_format)

    split_dict = {'None': 0, '2': 2, '3': 3, '4': 4, '5': 5}
    split_by = split_dict.get(split_by, 0)

    for output in arc_select(
        input_path,
        file_name,
        output_path, 
        input_type,
        format_type=arc_format.split('.')[-1],
        split_by=split_by
    ):
        yield output

def archive(input_path, file_name, output_path, arc_format, mkdir_cb1, split_by, box_state=gr.State()):
    output_box = box_state if box_state else []

    for t, f in path_archive(input_path, file_name, output_path, arc_format, mkdir_cb1, split_by):
        if not f:
            yield t, '\n'.join(output_box)
        else:
            output_box.append(t)

    catcher = ['not', 'Missing', 'Invalid']

    if any(asu in wc for asu in catcher for wc in output_box):
        yield 'Error', '\n'.join(output_box)
    elif any(BLOCK in l for l in output_box):
        yield 'Blocked', '\n'.join(output_box)
        assert not cmd_opts.disable_extension_access, BLOCK
    else:
        yield 'Done', '\n'.join(output_box)

    return gr.update(), gr.State(output_box)

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

            with tqdm(
                total=total_files,
                unit='file',
                bar_format=_bar,
                ascii='▷▶'
            ) as pbar:
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

    if is_done:
        yield f'Extracted To: {output_path}', True

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

            with tqdm(
                total=total_files,
                unit='file',
                bar_format=_bar,
                ascii='▷▶'
            ) as pbar:
                for file_name in file_list:
                    zip_ref.extract(file_name, output_path_obj)
                    pbar.update(1)
                    yield pbar, False
                    is_done = True

    elif format_type in ['tar.gz', 'tar.lz4']:
        _pv = ['pv', str(input_path_obj)]
        _type = ['gzip', '-d'] if format_type == 'tar.gz' else ['lz4', '-d']
        _tar = ['tar', 'xf', '-', '-C', str(output_path_obj)]

        ayu, rika = pty.openpty() # type: ignore

        p_pv = subprocess.Popen(
            _pv, 
            stdout=subprocess.PIPE, 
            stderr=rika, 
            text=True
        )

        p_type = subprocess.Popen(
            _type, 
            stdin=p_pv.stdout, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True
        )

        p_tar = subprocess.Popen(
            _tar, 
            stdin=p_type.stdout, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True
        )

        os.close(rika)

        while True:
            try:
                temenan, _, _ = select.select([ayu], [], [])
                if temenan:
                    ketemuan = os.read(ayu, 8192)
                    if not ketemuan:
                        break

                    yield ketemuan.decode('utf-8'), False
                    is_done = True

            except OSError:
                break

        p_pv.stdout.close()
        p_type.stdout.close()

        _ = p_pv.wait()
        _ = p_type.wait()
        _ = p_tar.wait()

    if is_done:
        yield f'Extracted To: {output_path}', True

def path_extract(input_path, output_path, mkdir_cb2):
    input_path = input_path.strip('"').strip("'")
    output_path = output_path.strip('"').strip("'")

    if sys.platform == 'win32':
        input_path = Path(input_path).as_posix()
        output_path = Path(output_path).as_posix()

    params = [
        name for name, value in zip(
            ['Input Path', 'Output Path'],
            [input_path, output_path]
        ) if not value
    ]

    missing = ', '.join(params)

    if missing:
        yield f'Missing: [ {missing} ]', True
        return

    for i, path_str in enumerate([input_path, output_path]):
        if path_str.startswith('$'):
            tag_key, _, subpath_or_file = path_str[1:].partition('/')
            tag_key = f'${tag_key.lower()}'
            resolved_path = tag_tag.get(tag_key)

            if resolved_path is None:
                yield f'{tag_key}\nInvalid tag.', True
                return

            resolved_path = Path(resolved_path, subpath_or_file)
            if i == 0:
                input_path = resolved_path
            else:
                output_path = resolved_path

    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if input_path_obj or output_path_obj:
        if not input_path_obj.exists():
            yield f'{input_path_obj}\ndoes not exist', True
            return

        if output_path_obj.suffix:
            yield f'{output_path}\nOutput Path is not a directory.', True
            return

        if not mkdir_cb2 and not output_path_obj.exists():
            yield f'{output_path_obj}\ndoes not exist', True
            return
        elif mkdir_cb2:
            output_path_obj.mkdir(parents=True, exist_ok=True)

        if not cmd_opts.enable_insecure_extension_access:
            for path in [input_path_obj, output_path_obj]:
                allowed, err = SDHubPaths.SDHubCheckPaths(path)
                if not allowed:
                    yield err, True
                    return

    select_ext = {'.zip': 'zip', '.tar.gz': 'tar.gz', '.tar.lz4': 'tar.lz4'}
    input_ext = ''.join(input_path_obj.suffixes)
    format_type = select_ext.get(input_ext)

    if not format_type:
        yield f'Unsupported format: {input_ext}', True
        return

    ext_func = extraction_win if sys.platform == 'win32' else extraction

    for output in ext_func(input_path, output_path, format_type):
        yield output

def extract(input_path, output_path, mkdir_cb2, box_state=gr.State()):
    output_box = box_state if box_state else []

    for t, f in path_extract(input_path, output_path, mkdir_cb2):
        if not f:
            yield t, '\n'.join(output_box)
        else:
            output_box.append(t)

    catcher = ['not', 'Missing', 'Invalid', 'Unsupported']

    if any(asu in wc for asu in catcher for wc in output_box):
        yield 'Error', '\n'.join(output_box)
    elif 'files from/to outside' in output_box:
        yield 'Blocked', '\n'.join(output_box)
        assert not cmd_opts.disable_extension_access, BLOCK
    else:
        yield 'Done', '\n'.join(output_box)

    return gr.update(), gr.State(output_box)

def ArchiverTab():
    with gr.TabItem('Archiver', elem_id='SDHub-Archiver-Tab'):
        with gr.Accordion(
            'ReadMe',
            open=False,
            elem_id='SDHub-Archiver-Accordion-Readme',
            elem_classes='sdhub-accordion'
        ):
            gr.HTML(arc_info)

        if SDHubPaths.getENV():
            from sd_hub.zipoutputs import ZipOutputs; ZipOutputs()

        gr.HTML("""<h3 style='font-size: 17px;' id='SDHub-Archiver-Archive-Title'>Archive</h3>""")
        with FormRow(elem_id='SDHub-Archiver-Radio-Row'):
            arc_format = gr.Radio(
                ['tar.lz4', 'tar.gz', 'zip'],
                value='tar.lz4',
                label='Format',
                scale=5,
                interactive=True,
                elem_id='SDHub-Archiver-Radio-Format',
                elem_classes='sdhub-radio'
            )

            arc_split = gr.Radio(
                ['None', '2', '3', '4', '5'],
                value='None',
                label='Split by',
                scale=5,
                interactive=True,
                elem_id='SDHub-Archiver-Radio-Split',
                elem_classes='sdhub-radio'
            )

        with FormRow():
            arc_name = gr.Textbox(
                max_lines=1,
                placeholder='Name',
                show_label=False,
                elem_id='SDHub-Archiver-Archive-Input-Name',
                elem_classes='sdhub-input'
            )

        with gr.Column(elem_classes='arc-row'):
            arc_in = gr.Textbox(
                max_lines=1,
                placeholder='Input Path',
                show_label=False,
                elem_id='SDHub-Archiver-Archive-Input-Path',
                elem_classes='sdhub-input'
            )

            arc_out = gr.Textbox(
                max_lines=1,
                placeholder='Output Path',
                show_label=False,
                elem_id='SDHub-Archiver-Archive-Output-Path',
                elem_classes='sdhub-input'
            )

        with gr.Row(elem_classes='arc-row'):
            with gr.Column():
                with gr.Row():
                    arc_run = gr.Button(
                        'Compress',
                        variant='primary',
                        elem_id='SDHub-Archiver-Archive-Button',
                        elem_classes='sdhub-buttons'
                    )

                    mkdir_cb1 = gr.Checkbox(
                        label='Create Directory',
                        elem_id='SDHub-Archiver-Archive-Checkbox',
                        elem_classes='sdhub-checkbox'
                    )

            with gr.Column():
                arc_output1 = gr.Textbox(
                    show_label=False,
                    interactive=False,
                    max_lines=1,
                    elem_classes='sdhub-output'
                )

                arc_output2 = gr.Textbox(
                    show_label=False,
                    interactive=False,
                    lines=5,
                    elem_classes='sdhub-output'
                )

        gr.HTML("""<h3 style='font-size: 17px;' id='SDHub-Archiver-Extract-Title'>Extract</h3>""")
        extr_in = gr.Textbox(
            max_lines=1,
            placeholder='Input Path',
            show_label=False,
            elem_id='SDHub-Archiver-Extract-Input-Path',
            elem_classes='sdhub-input'
        )

        extr_out = gr.Textbox(
            max_lines=1,
            placeholder='Output Path',
            show_label=False,
            elem_id='SDHub-Archiver-Extract-Output-Path',
            elem_classes='sdhub-input'
        )

        with gr.Row(elem_classes='arc-row'):
            with gr.Column():
                with gr.Row():
                    extr_btn = gr.Button(
                        'Decompress',
                        variant='primary',
                        elem_id='SDHub-Archiver-Extract-Button',
                        elem_classes='sdhub-buttons'
                    )

                    mkdir_cb2 = gr.Checkbox(
                        label='Create Directory',
                        elem_id='SDHub-Archiver-Extract-Checkbox',
                        elem_classes='sdhub-checkbox'
                    )

            with gr.Column():
                gr.Textbox(show_label=False, max_lines=1, elem_classes='hide-this')

        arc_run.click(
            fn=archive,
            inputs=[arc_in, arc_name, arc_out, arc_format, mkdir_cb1, arc_split, gr.State()],
            outputs=[arc_output1, arc_output2]
        )

        extr_btn.click(
            fn=extract,
            inputs=[extr_in, extr_out, mkdir_cb2, gr.State()],
            outputs=[arc_output1, arc_output2]
        )