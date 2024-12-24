from urllib.parse import urlparse
from pathlib import Path
from modules.paths_internal import models_path
from modules.shared import cmd_opts
from modules.scripts import basedir
import gradio as gr
import subprocess, re, sys, requests, time

from sd_hub.paths import SDHubPath
from sd_hub.version import xyz

def gdrown(url, target_path=None, fn=None):
    gfolder = "drive.google.com/drive/folders" in url
    cli = xyz('gdown.exe') if sys.platform == 'win32' else xyz('gdown')
    cmd = cli + ["--fuzzy", url]

    if fn:
        cmd += ["-O", fn]
    if gfolder:
        cmd.append("--folder")

    cwd = target_path if target_path else Path.cwd()

    p = subprocess.Popen(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
        text=True
    )

    gdown_output = ""
    gdown_progress = None
    starting_line = time.time()
    failure = False

    while True:
        output = p.stdout.readline()
        if not output:
            break
        gdown_output += output

        if "Failed to retrieve file url" in output:
            failure = True

        if re.search(r'\d{1,3}%', output):
            gdown_progress = output.strip()

        if gdown_progress and time.time() - starting_line >= 1:
            yield gdown_progress, False
            starting_line = time.time()

    if failure:
        failed = gdown_output.find("Failed to retrieve file url")
        lines = gdown_output[failed:]
        yield lines, False
    
    for lines in gdown_output.split('\n'):
        if lines.startswith("To:"):
            completed = re.search(r'[^/]*$', lines)
            if completed:
                yield f"Saved To: {target_path}/{completed.group()}", True
    p.wait()


BLOCK = (
    "Downloading files outside of Models or Embeddings folder is blocked "
    "\nAdd --enable-insecure-extension-access command line argument to proceed at your own risk."
)

def CheckPath(inputs):
    target = Path(inputs).resolve()
    models = Path(models_path).resolve()
    embeddings = Path(cmd_opts.embeddings_dir)

    if models not in target.parents and target != embeddings:
        return False, BLOCK

    return True, ""

aria2cexe = Path(basedir()) / 'aria2c.exe'

def ariari(url, target_path=None, fn=None, token2=None, token3=None):
    aria2cmd = [aria2cexe] if sys.platform == 'win32' else xyz('aria2c')

    if "huggingface.co" in url:
        if "/blob/" in url:
            url = url.replace("/blob/", "/resolve/")

        if token2:
            aria2cmd.extend(["--header=User-Agent: Mozilla/5.0",
                             f"--header=Authorization: Bearer {token2}"])

    elif "civitai.com" in url:
        if token3:
            aria2cmd.extend(["--header=User-Agent: Mozilla/5.0"])

            if '?token=' in url:
                url = url.split('?token=')[0]
            if '?type=' in url:
                url = url.replace('?type=', f'?token={token3}&type=')
            else:
                url = f"{url}?token={token3}"

        if "civitai.com/models/" in url:
            try:
                if '?modelVersionId=' in url:
                    version_id = url.split('?modelVersionId=')[1]
                    response = requests.get(f"https://civitai.com/api/v1/model-versions/{version_id}")
                else:
                    model_id = url.split('/models/')[1].split('/')[0]
                    response = requests.get(f"https://civitai.com/api/v1/models/{model_id}")

                response.raise_for_status()
                data = response.json()

                if "downloadUrl" in data:
                    download_url = data["downloadUrl"]
                    early_access = data.get("earlyAccessConfig")
                    if early_access and early_access.get("chargeForDownload", False):
                        yield f"-> {download_url}\nThe model is in early access and requires payment for downloading.", False
                        return
                elif "modelVersions" in data and data["modelVersions"]:
                    download_url = data["modelVersions"][0].get("downloadUrl", "")
                else:
                    yield f"Unable to find download URL for\n-> {url}\n", False
                    return

                url = f"{download_url}?token={token3}" if token3 else download_url

            except requests.exceptions.RequestException as e:
                yield f"{str(e)}\n", True
                return

    aria2cmd.extend([
        "--console-log-level=error",
        "--stderr=true",
        "--summary-interval=1",
        "-c", 
        "-x16", 
        "-s16", 
        "-k1M", 
        "-j5"
    ])

    if target_path:
        allowed, err = CheckPath(target_path)
        if not allowed:
            yield err, False
            return

        else:
            aria2cmd.extend(["--allow-overwrite=true"])

        aria2cmd.extend(["-d", target_path])

    if fn:
        aria2cmd.extend(["-o", fn])

    aria2cmd.append(url)

    p = subprocess.Popen(
        aria2cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
        text=True
    )

    aria2_output = ""
    break_line = False
    error = False

    while True:
        output = p.stdout.readline()
        if not output:
            break

        aria2_output += output

        if "errorCode=24" in output:
            uri_pattern = re.search(r'URI=(https?://\S+)', output)
            if uri_pattern:
                uri = uri_pattern.group(1)
                url_list = {
                    "huggingface.co": f"## Authorization Failed, Enter your Huggingface Token\n-> {url}\n",
                    "civitai.com": f"## Authorization Failed, Enter your Civitai API Key\n-> {url}\n"
                }

                for domain, msg in url_list.items():
                    if domain in uri:
                        yield msg, False
                        error = True
                        break
            continue

        if "errorCode" in output:
            arrow = aria2_output.find("->")
            if arrow != -1:
                lines = aria2_output.find("\n", arrow)
                if lines != -1:
                    errorcode = aria2_output[arrow:lines]
                    uri_pattern = re.search(r'URI=(https?://\S+)', aria2_output)
                    if uri_pattern:
                        uri = uri_pattern.group(1)
                        errorcode += '\n' + uri + '\n'

                    yield errorcode, False
                    error = True
            continue

        for lines in output.splitlines():
            dl_line = re.match(r'\[#\w{6}\s(.*?)\((\d+\%)\).*?DL:(.*?)\s', lines)
            if dl_line:
                sizes = dl_line.group(1)
                percent = dl_line.group(2)
                speed = dl_line.group(3)
                outputs = f"{percent} | {sizes} | {speed}/s"
                yield outputs, False

                break_line = True
                error = False
                break

    if break_line:
        pass

    if not error:
        separator = aria2_output.find("======+====+===========")
        if separator != -1:
            for lines in aria2_output[separator:].splitlines():
                if "|" in lines:
                    pipe = lines.split('|')
                    if len(pipe) > 3:
                        output_dir = pipe[3].strip()
                        yield f"Saved To: {output_dir}", True
    p.wait()

def get_fn(url):
    fn_fn = urlparse(url)

    if "civitai.com" in fn_fn.netloc or "drive.google.com" in fn_fn.netloc:
        return None
    else:
        fn = Path(fn_fn.path).name
        return fn

def url_check(url):
    try:
        url_parsed = urlparse(url)

        if not (url_parsed.scheme and url_parsed.netloc):
            return False, "Invalid URL."

        supported = [
            "civitai.com",
            "huggingface.co",
            "github.com",
            "drive.google.com"
        ]

        if url_parsed.netloc not in supported:
            supported_str = "\n".join(supported)
            return False, f"Supported Domain :\n{supported_str}"

        return True, ""
    except Exception as e:
        return False, str(e)

def input_process(url_line, current_path, tags_mappings):
    if any(url_line.startswith(char) for char in ('/', '\\', '#')):
        return None, None, None, "Invalid usage, Tag should start with $"

    if url_line.startswith('$'):
        parts = url_line[1:].strip().split('/', 1)
        tags_key = f"${parts[0].lower()}"
        subfolder = parts[1] if len(parts) > 1 else None
        base_path = tags_mappings.get(tags_key)
        if base_path is not None:
            full_path = Path(base_path, subfolder) if subfolder else Path(base_path)
            current_path = full_path
        else:
            return None, None, None, f"{tags_key}\nInvalid Tag."
        return current_path, None, None, None

    parts = url_line.split(' ')
    url = parts[0].strip()

    is_valid, error_message = url_check(url)
    if not is_valid:
        return None, None, None, error_message

    optional_path = None
    optional_fn = None

    if len(parts) > 1:
        if '-' in parts:
            dash_index = parts.index('-')
            optional_path_raw = ' '.join(parts[1:dash_index]).strip()
            optional_fn = ' '.join(parts[dash_index + 1:]).strip()
        else:
            optional_path_raw = ' '.join(parts[1:]).strip()

        optional_path_raw = optional_path_raw.strip('"').strip("'")
        optional_path = Path(optional_path_raw) if optional_path_raw else None

    if optional_path and optional_path.suffix:
        return None, None, None, f"{optional_path}\nOutput path is not a path."

    if optional_fn:
        optional_fn_path = Path(optional_fn)
        if not optional_fn_path.suffix:
            return None, None, None, f"{optional_fn}\nOutput filename is missing its extension."

    target_path = optional_path if optional_path else current_path
    if target_path is None or not target_path.exists():
        return None, None, None, f"{target_path}\nDoes not exist."

    fn = get_fn(url) if not optional_fn else optional_fn

    return target_path, url, fn, None

def surface(command, token2=None, token3=None):
    if not command.strip():
        yield "Nothing To See Here.", True
        return

    tags_mappings = SDHubPath()
    current_path = None
    urls = [url_line for url_line in command.strip().split('\n') if url_line.strip()]

    if len(urls) == 1 and urls[0].startswith('$'):
        yield "Missing URL.", True
        return

    for url_line in urls:
        target_path, url, fn, error = input_process(url_line, current_path, tags_mappings)

        if error:
            yield error, True
            return

        if not url:
            current_path = target_path
            continue

        if "drive.google" in url:
            for message, isError in gdrown(url, target_path, fn):
                yield message, isError
            continue

        for output in ariari(
            url,
            target_path,
            fn,
            token2,
            token3
        ):
            yield output

def downloader(command, token2, token3, box_state=gr.State()):
    output_box = box_state if box_state else []

    ngword = [
        "## Authorization Failed",
        "The model is in early access",
        "Unable to find",
        "errorCode",
        "Failed to retrieve",
        "File already exists"
    ]

    yield "Now Downloading...", ""

    for _text, _flag in surface(command, token2, token3):
        if not _flag:
            if any(k in _text for k in ngword):
                yield "Error", "\n".join([_text] + output_box)
                return gr.update(), gr.State(output_box)

            if "files outside of Models" in _text: 
                yield "Blocked", "\n".join([_text] + output_box)
                assert not cmd_opts.disable_extension_access, BLOCK
                return gr.update(), gr.State(output_box)

            yield _text, "\n".join(output_box)
        else:
            output_box.append(_text)

    catcher = [
        "exist", "Invalid", "Tag", "Output", "Nothing", "URL",
        "filename", "Supported Domain:", "500 Server Error"
    ]

    if any(k in w for k in catcher for w in output_box):
        yield "Error", "\n".join(output_box)
    else:
        yield "Done", "\n".join(output_box)

    return gr.update(), gr.State(output_box)

def read_txt(file, box):
    text_box = []

    if file is not None:
        inputs = file.name
        txt = ""

        with open(inputs, 'r') as content:
            txt = content.read()

        if box.strip() == "":
            result = txt
        else:
            result = box + '\n' + txt

        text_box.append(result)
        output = '\n'.join(text_box)

        return output

    return '\n'.join(text_box)
