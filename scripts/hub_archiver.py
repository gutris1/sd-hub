import os
import tarfile
import zipfile
import lz4.frame
import gradio as gr
from tqdm import tqdm
from pathlib import Path
from scripts.hub_builder import paths_dict

bar_format = '{percentage:3.0f}% | {n_fmt}/{total_fmt} | {rate_fmt}{postfix}'

def _zip(input_path, file_name, output_path, input_type):
    zip_in = Path(input_path)
    zip_out = Path(output_path)
    output_zip = zip_out / f"{file_name}.zip"
    
    yield f"Compressing {file_name}.zip", False
    
    if input_type == 'file':
        with tqdm(total=os.path.getsize(zip_in), unit="B", unit_scale=True, bar_format=bar_format) as pbar:
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
        with tqdm(total=total_size, unit="B", unit_scale=True, bar_format=bar_format) as pbar:
            with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file in zip_in.rglob('*'):
                    if file.is_file():
                        zipf.write(file, file.relative_to(zip_in))
                        pbar.update(file.stat().st_size)
                        yield pbar, False
    
    yield f"Saved To: {output_zip}", True

def tar_gz(input_path, file_name, output_path, input_type):
    input_path = Path(input_path)
    output_path = Path(output_path)
    output_gz = output_path / f"{file_name}.tar.gz"

    yield f"Compressing {file_name}.tar.gz", False

    if input_type == 'file':
        total_size = input_path.stat().st_size
        chunk_size = 4096 * 1024

        with tqdm(total=total_size, unit='B', unit_scale=True, bar_format=bar_format) as pbar:
            with tarfile.open(output_gz, "w:gz") as tar, input_path.open('rb') as file:
                tar_info = tarfile.TarInfo(name=input_path.name)
                tar_info.size = total_size 
                tar.addfile(tarinfo=tar_info)
                while True:
                    chunk = file.read(chunk_size)
                    if not chunk:
                        break
                    tar.fileobj.write(chunk)
                    pbar.update(len(chunk))
                    yield pbar, False
                    
    else:
        file_list = [(f, f.relative_to(input_path)) for f in input_path.glob('**/*') if f.is_file()]
        total_size = sum(f[0].stat().st_size for f in file_list)
        
        with tqdm(total=total_size, unit='B', unit_scale=True, bar_format=bar_format) as pbar:
            with tarfile.open(output_gz, "w:gz") as tar:
                for file, arcname in file_list:
                    tar.add(file, arcname=str(arcname))
                    pbar.update(file.stat().st_size)
                    yield pbar, False  

    yield f"Saved to: {output_gz}", True
    
def tar_lz4(input_path, file_name, output_path, input_type):
    input_path = Path(input_path)
    output_path = Path(output_path)
    output_lz4 = output_path / f"{file_name}.tar.lz4"

    yield f"Compressing {file_name}.tar.lz4", False

    if input_type == 'file':
        total_size = input_path.stat().st_size
        chunk_size = 4096 * 1024
        
        with tqdm(total=total_size, unit='B', unit_scale=True, bar_format=bar_format) as pbar:
            with lz4.frame.open(output_lz4, 'wb') as lz4_file:
                with tarfile.open(fileobj=lz4_file, mode="w|") as tar:
                    tar_info = tar.gettarinfo(name=str(input_path), arcname=input_path.name)
                    tar_info.size = total_size
                    tar.addfile(tarinfo=tar_info)

                    with open(input_path, 'rb') as file:
                        while True:
                            chunk = file.read(chunk_size)
                            if not chunk:
                                break
                            tar.fileobj.write(chunk)
                            pbar.update(len(chunk))
                            yield pbar, False
                    
    else:
        file_list = [(f, f.relative_to(input_path)) for f in input_path.glob('**/*') if f.is_file()]
        total_size = sum(f[0].stat().st_size for f in file_list)

        with tqdm(total=total_size, unit='B', unit_scale=True, bar_format=bar_format) as pbar:
            with lz4.frame.open(output_lz4, 'wb') as lz4_file:
                with tarfile.open(fileobj=lz4_file, mode="w|") as tar:
                    for file, arcname in file_list:
                        tar.add(file, arcname=str(arcname))
                        pbar.update(file.stat().st_size)
                        yield pbar, False

    yield f"Saved to: {output_lz4}", True
    
def arc_process(input_path, file_name, output_path, com_for):
    params = [name for name, value in zip(
        ["Input Path", "Output Name", "Output Path"],
        [input_path, file_name, output_path]) if not value]
    missing = ', '.join(params)
    if missing:
        yield f"Missing: [ {missing} ]", True
        return

    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)
    
    if not input_path_obj.exists():
        yield f"{input_path}\nInput Path does not exist.", True
        return

    if input_path_obj.is_file():
        input_type = 'file'
    elif input_path_obj.is_dir():
        input_type = 'folder'

    if not output_path_obj.exists():
        yield f"{output_path}\nOutput Path does not exist.", True
        return
    
    if not output_path_obj.is_dir():
        yield f"{output_path}\nOutput Path is not a directory.", True
        return
    
    select_arc = {'zip': _zip, 'tar.gz': tar_gz, 'tar.lz4': tar_lz4}
    com_type = select_arc.get(com_for)
        
    for output in com_type(input_path, file_name, output_path, input_type):
        yield output
        
def archive(input_path, file_name, output_path, com_for, hantu=gr.State()):
    yanto = hantu if hantu else []
    for udin, bambang in arc_process(input_path, file_name, output_path, com_for):
        if not bambang:
            yield udin, "\n".join(yanto)
        else:
            yanto.append(udin)
    
    catcher = ["not", "Missing", "Error", "Invalid"]
    if any(asu in wc for asu in catcher for wc in yanto):
        yield "Error", "\n".join(yanto)
    else:
        yield "Done", "\n".join(yanto)
    return gr.update(), gr.State(yanto)

####################################################################################

def extraction(input_path, output_path, format_type):
    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if format_type == 'zip':
        with zipfile.ZipFile(input_path_obj, 'r') as zip_ref:
            zip_ref.extractall(output_path_obj)
            yield f"Extracting ZIP: {input_path} to {output_path}", False

    elif format_type == 'tar.gz':
        with tarfile.open(input_path_obj, 'r:gz') as tar_ref:
            tar_ref.extractall(output_path_obj)
            yield f"Extracting TAR.GZ: {input_path} to {output_path}", False

    elif format_type == 'tar.lz4':
        with lz4.frame.open(input_path_obj, 'rb') as lz4_ref:
            with tarfile.open(fileobj=lz4_ref, mode="r|") as tar_ref:
                tar_ref.extractall(output_path_obj)
            yield f"Extracting TAR.LZ4: {input_path} to {output_path}", False
    else:
        yield "Unsupported format for extraction", True
    
def ext_process(input_path, output_path):
    params = [name for name, value in zip(
        ["Input Path", "Output Path"],
        [input_path, output_path]) if not value]
    missing = ', '.join(params)
    if missing:
        yield f"Missing: [ {missing} ]", True
        return

    input_path_obj = Path(input_path)
    output_path_obj = Path(output_path)

    if not input_path_obj.exists():
        yield f"{input_path}\nInput Path does not exist.", True
        return

    format_extensions = {'.zip': 'zip', '.tar.gz': 'tar.gz', '.tar.lz4': 'tar.lz4'}
    input_extension = ''.join(input_path_obj.suffixes)
    com_for = format_extensions.get(input_extension)
    
    if not com_for:
        yield f"Unsupported format: {input_extension}", True
        return

    if output_path_obj.suffix:
        yield "Output Path should be a directory, not a file", True
        return

    if not output_path_obj.exists():
        yield f"Output Path does not exist: {output_path}", True
        return

    for output in extraction(input_path, output_path, com_for):
        yield output
        
def extract(input_path, output_path, hantu=gr.State()):
    yanto = hantu if hantu else []
    for udin, bambang in ext_process(input_path, output_path):
        if not bambang:
            yield udin, "\n".join(yanto)
        else:
            yanto.append(udin)
    
    catcher = ["not", "Missing", "Error", "Invalid"]
    if any(asu in wc for asu in catcher for wc in yanto):
        yield "Error", "\n".join(yanto)
    else:
        yield "Done", "\n".join(yanto)
    return gr.update(), gr.State(yanto)