from huggingface_hub import model_info, create_repo, create_branch
from huggingface_hub.utils import RepositoryNotFoundError
from pathlib import Path
import gradio as gr
import subprocess, re, sys, time, json

from sd_hub.paths import hub_path
from sd_hub.version import xyz

def push_push(repo_id, file_path, file_name, token, branch, is_private=False, commit_msg="", ex_ext=None):
    msg = commit_msg.replace('"', '\\"')
    cli = xyz('huggingface-cli.exe') if sys.platform == 'win32' else xyz('huggingface-cli')
    cmd = cli + [
        'upload', repo_id, file_path, file_name,
        '--token', token,
        '--revision', branch,
        '--commit-message', msg
    ]

    if is_private:
        cmd.append('--private')

    if ex_ext:
        cmd.append('--exclude')
        cmd.extend([f'*.{ext}' for ext in ex_ext])

    p = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    failed = False
    error = ""
    starting_line = time.time()

    for line in p.stdout:
        output = line.strip()

        if "Bad request" in output:
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
                if "Consider using" in asu:
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
    tag_tag = hub_path()
    task_task = []

    for line in input_lines:
        parts = line.split()
        input_path = parts[0]
        input_path = input_path.strip('"').strip("'")

        given_fn = None
        ex_ext = None

        if '-' in parts:
            given_fn_fn = parts.index('-') + 1
            if given_fn_fn < len(parts):
                given_fn = parts[given_fn_fn]
            else:
                yield "Invalid usage\n[ - ]", True
                return

        if '--' in parts:
            ex_ext_ext = parts.index('--') + 1
            if ex_ext_ext < len(parts):
                ex_ext = parts[ex_ext_ext:]
            else:
                yield "Invalid usage\n[ -- ]", True
                return

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

        erorr = False

        for output in push_push(
            repo_id=repo_id,
            file_path=str(file_path),
            file_name=file_name,
            token=token,
            branch=branch,
            is_private=repo_radio == "Private",
            commit_msg=f"Upload {file_name} using SD-Hub extension",
            ex_ext=ex_ext):

            yield output

            if output[1]:
                erorr = True
                break

        if not erorr:
            details = (
                f"{repo_info.id}/{branch}\n"
                f"{file_name}\n"
                f"{repo_info.last_modified.strftime('%Y-%m-%d %H:%M:%S')}\n"
            )

            yield details, True


def SaveUploaderInfo(user, repo, branch):
    jsonpath = Path(__file__).parent.parent / "uploader-info.json"

    data = {
        "username": user,
        "repository": repo,
        "branch": branch
    }

    with open(jsonpath, "w") as f:
        json.dump(data, f, indent=4)


def uploader(inputs, user, repo, branch, token, repo_radio, box_state=gr.State()):
    SaveUploaderInfo(user, repo, branch)
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
