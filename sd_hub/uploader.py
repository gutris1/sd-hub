from huggingface_hub import model_info, create_repo, create_branch
from huggingface_hub.utils import RepositoryNotFoundError
from modules.shared import cmd_opts
from modules.scripts import basedir
from pathlib import Path
import gradio as gr
import subprocess, re, sys, time, json, shlex

from sd_hub.paths import SDHubPaths, BLOCK
from sd_hub.version import xyz

tag_tag = SDHubPaths().SDHubTagsAndPaths()

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


def isEmpty(fp):
    for f in fp.iterdir():
        rp = f.resolve()
        if rp.is_file() or (rp.is_dir() and any(rp.iterdir())):
            return False
    return True


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
    task_task = []

    for line in input_lines:
        parts = shlex.split(line)
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
            tag_key = f"${tag_key.lower()}"
            resolved_path = tag_tag.get(tag_key)
            if resolved_path is None:
                yield f"{tag_key}\nInvalid tag.", True
                return
            full_path = Path(resolved_path, subpath_or_file)

        if not cmd_opts.enable_insecure_extension_access:
            allowed, err = SDHubPaths().SDHubCheckPaths(full_path)
            if not allowed:
                yield err, False
                return

        if full_path.exists():
            if full_path.is_file():
                type_ = "file"
            elif full_path.is_dir():
                if isEmpty(full_path):
                    yield f"{full_path}\nInput Path is empty.", True
                    return
                type_ = "folder"
            else:
                type_ = "unknown"
        else:
            yield f"{full_path}\nInput Path does not exist.", True
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


jsonpath = Path(basedir()) / 'uploader-info.json'

def SaveUploaderInfo(user, repo, branch):
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
            if "files from/to outside" in _text: 
                yield "Blocked", "\n".join([_text] + output_box)
                assert not cmd_opts.disable_extension_access, BLOCK

            if "Uploading" in _text:
                yield _text, "\n".join(output_box)

            yield _text, "\n".join(output_box)
        else:
            output_box.append(_text)
            
    catcher = ["not", "Missing", "Error", "Invalid"]
    
    if any(k in w for k in catcher for w in output_box):
        yield "Error", "\n".join(output_box)
    else:
        yield "Done", "\n".join(output_box)
        
    return gr.update(), gr.State(output_box)
