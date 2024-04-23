from huggingface_hub import model_info, create_repo, create_branch
from huggingface_hub.utils import RepositoryNotFoundError
from pathlib import Path
import gradio as gr
import subprocess
import re
from scripts.hub_folder import paths_dict

def push_push(repo_id, file_path, file_name, token, branch, is_private=False, commit_message=""):
    cme = commit_message.replace('"', '\\"')

    cmd = ['huggingface-cli', 'upload', repo_id, file_path, file_name,
           '--token', token, '--revision', branch, '--commit-message', cme]
    
    if is_private:
        cmd.append('--private')

    gasss = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        for dirantai in iter(gasss.stdout.readline, ''):
            asu = dirantai.strip()
            kandang = asu.split(':', 1)
            if len(kandang) > 1:
                asu = kandang[1].strip()
            else:
                continue
                
            lari = re.compile(r'\d+%|\d+M/\d+G|\d+\.\d+MB/s')
            if lari.search(asu):
                yield asu, False
                
            elif "Consider using" in asu:
                continue
                
    finally:
        gasss.stdout.close()
        gasss.wait()
            
def up_up(inputs, user, repo, branch, token, repo_radio):
    input_lines = [line.strip() for line in inputs.strip().splitlines()]

    if not inputs.strip() or not all([user, repo, branch, token]):
        params = [name for name, value in zip(
            ["Input", "Username", "Repository", "Branch", "Token"],
            [inputs.strip(), user, repo, branch, token]) if not value]
        
        missing = ', '.join(params)
        
        yield f"Missing: [ {missing} ]", True
        return

    repo_id = f"{user}/{repo}"
    tag_tag = paths_dict()
    task_task = []

    for line in input_lines:
        if " - " in line:
            parts = line.split(" - ", 1)
            input_path = parts[0].strip()
            given_fn = parts[1].strip() if len(parts) > 1 else None
        else:
            input_path = line.strip()
            given_fn = None

        full_path = Path(input_path) if not input_path.startswith('$') else None
        if input_path.startswith('$'):
            tag_key, _, subpath_or_file = input_path[1:].partition('/')
            resolved_path = tag_tag.get(tag_key)
            if resolved_path is None:
                yield f"{tag_key}\nInvalid tag.", True
                return
            full_path = Path(resolved_path, subpath_or_file)

        if full_path:
            if full_path.is_file():
                type_ = "file"
            elif full_path.is_dir():
                type_ = "folder"
            else:
                type_ = "unknown"
        else:
            yield f"{input_path}\nInput Path does not exist.", True
            return

        if given_fn and not Path(given_fn).suffix and full_path.is_file():
            given_fn += full_path.suffix

        task_task.append((full_path, given_fn or full_path.name, type_))

    for file_path, file_name, type_ in task_task:
        yield f"Uploading: {file_name}", False

        try:
            model_info(repo_id, token=token)
        except RepositoryNotFoundError:
            is_private = repo_radio == "Private"
            create_repo(repo_id, private=is_private, token=token)

        create_branch(repo_id=repo_id, branch=branch, token=token, exist_ok=True)
        repo_info = model_info(repo_id, token=token)

        for output in push_push(
            repo_id=repo_id,
            file_path=str(file_path),
            file_name=file_name,
            token=token,
            branch=branch,
            is_private=repo_radio == "Private",
            commit_message=f"Upload {file_name} using SD-Hub extension"):
            
            yield output

        croottt = (f"{repo_info.id}/{branch}\n"
                   f"{file_name}\n"
                   f"{repo_info.last_modified.strftime('%Y-%m-%d %H:%M:%S')}\n")

        yield croottt, True
        
def uploader(inputs, user, repo, branch, token, repo_radio, box_state=gr.State()):
    output_box = box_state if box_state else []
    
    for _text, _flag in up_up(inputs, user, repo, branch, token, repo_radio):
        if not _flag:
            if "Uploading" in _text:
                yield _text, "\n".join(output_box)
            yield _text, "\n".join(output_box)
        else:
            output_box.append(_text)
            
    catcher = ["not", "Missing", "Error", "Invalid"]
    
    if any(asu in wc for asu in catcher for wc in output_box):
        yield "Error", "\n".join(output_box)
    else:
        yield "Done", "\n".join(output_box)
        
    return gr.update(), gr.State(output_box)