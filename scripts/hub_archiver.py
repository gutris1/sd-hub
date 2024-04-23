from pathlib import Path
from tqdm import tqdm
import gradio as gr
import subprocess
import zipfile
import select
import pty
import os
from scripts.hub_folder import paths_dict

def _zip(input_path, file_name, output_path, input_type, format_type):
    zip_in = Path(input_path)
    zip_out = Path(output_path)
    output_zip = zip_out / f"{file_name}.zip"
    _bar = '{percentage:3.0f}% | {n_fmt}/{total_fmt} | {rate_fmt}{postfix}'
    
    yield f"Compressing {file_name}.zip", False
    
    if input_type == 'file':
        with tqdm(total=os.path.getsize(zip_in), unit="B", unit_scale=True, bar_format=_bar) as pbar:
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
        
    else:
        total_size = sum(f.stat().st_size for f in zip_in.rglob('*') if f.is_file())
        with tqdm(total=total_size, unit="B", unit_scale=True, bar_format=_bar) as pbar:
            with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file in zip_in.rglob('*'):
                    if file.is_file():
                        zipf.write(file, file.relative_to(zip_in))
                        pbar.update(file.stat().st_size)
                        yield pbar, False
    
    yield f"Saved To: {output_zip}", True

def tar_tar(input_path, file_name, output_path, input_type, format_type):
    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if format_type == "gz":
        _output = output_path_obj / f"{file_name}.tar.gz"
        comp_type = "gzip"
    elif format_type == "lz4":
        _output = output_path_obj / f"{file_name}.tar.lz4"
        comp_type = "lz4"

    yield f"Compressing {_output.name}", False

    if input_type == "file":
        _tar = ['tar', 'cf', '-', input_path_obj.name]
        cwd = str(input_path_obj.parent)
    else:
        _tar = ['tar', 'cf', '-', '.']
        cwd = str(input_path_obj)

    _pv = ['pv']
    _format = [comp_type]

    ayu, rika = pty.openpty()

    p_tar = subprocess.Popen(_tar, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    p_pv = subprocess.Popen(_pv, stdin=p_tar.stdout, stdout=subprocess.PIPE, stderr=rika, text=True)
    p_type = subprocess.Popen(_format, stdin=p_pv.stdout, stdout=open(str(_output), 'wb'), stderr=subprocess.PIPE, text=True)

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

    yield f"Saved to: {_output}", True

def arc_process(input_path, file_name, output_path, arc_format, mkdir_cb1):
    params = [name for name, value in zip(
        ["Input Path", "Name", "Output Path"],
        [input_path, file_name, output_path]) if not value]
    
    missing = ', '.join(params)
    
    if missing:
        yield f"Missing: [ {missing} ]", True
        return
    
    tag_tag = paths_dict()

    for i, path_str in enumerate([input_path, output_path]):
        if path_str.startswith('$'):
            tag_key, _, subpath_or_file = path_str[1:].partition('/')
            resolved_path = tag_tag.get(tag_key)
            
            if resolved_path is None:
                yield f"{tag_key}\nInvalid tag.", True
                return
            
            resolved_path = Path(resolved_path, subpath_or_file)
            if i == 0:
                input_path = resolved_path
            else:
                output_path = resolved_path

    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if not input_path_obj.exists():
        yield f"{input_path}\nInput Path does not exist.", True
        return
    
    if output_path_obj.suffix:
        yield f"{output_path}\nOutput Path is not a directory.", True
        return
    
    if input_path_obj.is_file():
        input_type = 'file'
    elif input_path_obj.is_dir():
        input_type = 'folder'

    if mkdir_cb1:
        output_path_obj.mkdir(parents=True, exist_ok=True)
        
    else:
        if not output_path_obj.exists():
            yield f"{output_path}\nOutput Path does not exist.", True
            return

    select_arc = {'zip': _zip, 'tar.gz': tar_tar, 'tar.lz4': tar_tar}
    arc_select = select_arc.get(arc_format)

    for output in arc_select(input_path, file_name, output_path, input_type, format_type=arc_format.split('.')[-1]):
        yield output
        
def archive(input_path, file_name, output_path, arc_format, mkdir_cb1, box_state=gr.State()):
    output_box = box_state if box_state else []
    
    for _text, _flag in arc_process(input_path, file_name, output_path, arc_format, mkdir_cb1):
        if not _flag:
            yield _text, "\n".join(output_box)
            
        else:
            output_box.append(_text)
    
    catcher = ["not", "Missing", "Invalid"]
    
    if any(asu in wc for asu in catcher for wc in output_box):
        yield "Error", "\n".join(output_box)
        
    else:
        yield "Done", "\n".join(output_box)
        
    return gr.update(), gr.State(output_box)

####################################################################################

def extraction(input_path, output_path, format_type):
    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)
    is_done = False
    
    yield f"Extracting: {input_path_obj}", False

    if format_type == 'zip':
        _bar = '{n_fmt}/{total_fmt} | [{bar:26}]'
        
        with zipfile.ZipFile(input_path_obj, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            total_files = len(file_list)
            
            with tqdm(total=total_files, unit='file', bar_format=_bar, ascii="▷▶") as pbar:
                for file_name in file_list:
                    zip_ref.extract(file_name, output_path_obj)
                    pbar.update(1)
                    yield pbar, False
                    is_done = True

    elif format_type in ['tar.gz', 'tar.lz4']:
        _pv = ['pv', str(input_path_obj)]
        _type = ['gzip', '-d'] if format_type == 'tar.gz' else ['lz4', '-d']
        _tar = ['tar', 'xf', '-', '-C', str(output_path_obj)]

        ayu, rika = pty.openpty()

        p_pv = subprocess.Popen(_pv, stdout=subprocess.PIPE, stderr=rika, text=True)
        p_type = subprocess.Popen(_type, stdin=p_pv.stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        p_tar = subprocess.Popen(_tar, stdin=p_type.stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

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
        yield f"Extracted To: {output_path}", True
    
def ext_process(input_path, output_path, mkdir_cb2):
    params = [name for name, value in zip(
        ["Input Path", "Output Path"],
        [input_path, output_path]) if not value]
    
    missing = ', '.join(params)
    
    if missing:
        yield f"Missing: [ {missing} ]", True
        return
    
    tag_tag = paths_dict()

    for i, path_str in enumerate([input_path, output_path]):
        if path_str.startswith('$'):
            tag_key, _, subpath_or_file = path_str[1:].partition('/')
            resolved_path = tag_tag.get(tag_key)
            
            if resolved_path is None:
                yield f"{tag_key}\nInvalid tag.", True
                return
            
            resolved_path = Path(resolved_path, subpath_or_file)
            if i == 0:
                input_path = resolved_path
            else:
                output_path = resolved_path

    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if not input_path_obj.exists():
        yield f"{input_path}\nInput Path does not exist.", True
        return

    if output_path_obj.suffix:
        yield f"{output_path}\nOutput Path is not a directory.", True
        return

    if mkdir_cb2:
        output_path_obj.mkdir(parents=True, exist_ok=True)
    else:
        if not output_path_obj.exists():
            yield f"{output_path}\nOutput Path does not exist.", True
            return
        
    select_ext = {'.zip': 'zip', '.tar.gz': 'tar.gz', '.tar.lz4': 'tar.lz4'}
    input_ext = ''.join(input_path_obj.suffixes)
    format_type = select_ext.get(input_ext)
    
    if not format_type:
        yield f"Unsupported format: {input_ext}", True
        return
    
    for output in extraction(input_path, output_path, format_type):
        yield output
        
def extract(input_path, output_path, mkdir_cb2, box_state=gr.State()):
    output_box = box_state if box_state else []
    
    for _text, _flag in ext_process(input_path, output_path, mkdir_cb2):
        if not _flag:
            yield _text, "\n".join(output_box)
        else:
            output_box.append(_text)
    
    catcher = ["not", "Missing", "Invalid", "Unsupported"]
    
    if any(asu in wc for asu in catcher for wc in output_box):
        yield "Error", "\n".join(output_box)
    else:
        yield "Done", "\n".join(output_box)
        
    return gr.update(), gr.State(output_box)