from urllib.parse import urlparse
from pathlib import Path
import gradio as gr
import subprocess, re, sys, requests

from sd_hub.paths import hub_path
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

    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
        text=True
    )

    malam = ""
    download_error = False

    while True:
        line = proc.stdout.readline()
        if not line:
            break
        malam += line

        if "Failed to retrieve" in line:
            fail_ = malam.find("Failed to retrieve")
            outputs_ = malam[fail_:]
            yield outputs_, True
            download_error = True
            continue

        lines = line.split('\n')
        for line in lines:
            if re.search(r'\d{1,3}%', line):
                yield line.strip(), False
                download_error = False
                break

    if not download_error:
        for line in malam.split('\n'):
            if line.startswith("To:"):
                kemarin = re.search(r'[^/]*$', line)
                if kemarin:
                    yield f"Saved To: {target_path}/{kemarin.group()}", True

    proc.wait()


def ariari(url, target_path=None, fn=None, token2=None, token3=None):
    exe = Path(__file__).parent.parent / 'aria2c.exe'
    aria2cmd = [str(exe)] if sys.platform == 'win32' else xyz('aria2c')

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
            if '?modelVersionId=' in url:
                version_id = url.split('?modelVersionId=')[1]
                response = requests.get(f"https://civitai.com/api/v1/model-versions/{version_id}")
            else:
                model_id = url.split('/models/')[1].split('/')[0]
                response = requests.get(f"https://civitai.com/api/v1/models/{model_id}")

            data = response.json()
            download_url = data["downloadUrl"] if "downloadUrl" in data else data["modelVersions"][0]["downloadUrl"]
            url = f"{download_url}?token={token3}" if token3 else download_url

    aria2cmd.extend([
        "--console-log-level=error",
        "--allow-overwrite=true",
        "--stderr=true",
        "--summary-interval=1",
        "-c", "-x16", "-s16", "-k1M", "-j5"
        ]
    )

    if target_path:
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

    aria2_outputs = ""
    break_line = False
    download_error = False

    while True:
        lines = p.stdout.readline()
        if not lines:
            break

        aria2_outputs += lines

        if "errorCode=24" in lines:
            uri_pattern = re.search(r'URI=(https?://\S+)', lines)
            if uri_pattern:
                find_url = uri_pattern.group(1)
                url_list = {
                    "huggingface.co": f"## Authorization Failed, Enter your Huggingface Token\n-> {url}",
                    "civitai.com": f"## Authorization Failed, Enter your Civitai API Key\n-> {url}\n"
                }

                for domain, msg in url_list.items():
                    if domain in find_url:
                        yield msg, True
                        download_error = True
                        break
            continue

        if "errorCode" in lines:
            error_arrow = aria2_outputs.find("->")
            if error_arrow != -1:
                error_code = aria2_outputs.find("\n", error_arrow)
                if error_code != -1:
                    error_outputs = aria2_outputs[error_arrow:error_code]
                    uri_pattern = re.search(r'URI=(https?://\S+)', aria2_outputs)
                    if uri_pattern:
                        uri = uri_pattern.group(1)
                        error_outputs += '\n' + uri + '\n'

                    yield error_outputs, True
                    download_error = True
            continue

        for download_outputs in lines.splitlines():
            match = re.match(r'\[#\w{6}\s(.*?)\((\d+\%)\).*?DL:(.*?)\s', download_outputs)
            if match:
                sizes = match.group(1)
                percent = match.group(2)
                speed = match.group(3)
                output = f"{percent} | {sizes} | {speed}/s"
                yield output, False

                break_line = True
                download_error = False
                break

    if break_line:
        pass

    if not download_error:
        separator = aria2_outputs.find("======+====+===========")
        if separator != -1:
            for outputs_complete in aria2_outputs[separator:].splitlines():
                if "|" in outputs_complete:
                    pipe = outputs_complete.split('|')
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


def check_url(url):
    try:
        url_parsed = urlparse(url)

        if not (url_parsed.scheme and url_parsed.netloc):
            return False, "Invalid URL."

        supported = ["civitai.com",
                     "huggingface.co",
                     "github.com",
                     "drive.google.com"]

        if url_parsed.netloc not in supported:
            supported_str = "\n".join(supported)
            return False, f"{supported_str}"

        return True, ""
    except Exception as e:
        return False, str(e)


def dl_url(url_line, current_path, tags_mappings):
    if any(url_line.startswith(char) for char in ('/', '\\', '#')):
        return None, None, None, "Invalid usage, Tag should start with $"

    if url_line.startswith('$'):
        parts = url_line[1:].strip().split('/', 1)
        tags_key = parts[0].lower()
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

    is_valid, error_message = check_url(url)
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


def dl_dl(command, token2=None, token3=None):
    if not command.strip():
        yield "Nothing To See Here.", True
        return

    tags_mappings = hub_path()
    current_path = None
    urls = [url_line for url_line in command.strip().split('\n') if url_line.strip()]

    if len(urls) == 1 and urls[0].startswith('$'):
        yield "Missing URL.", True
        return

    for url_line in urls:
        target_path, url, fn, error = dl_url(url_line, current_path, tags_mappings)

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

    yield "Now Downloading...", ""

    for _text, _flag in dl_dl(command, token2, token3):
        if not _flag:
            if "Enter your" in _text:
                yield "Error", "\n".join([_text] + output_box)
                return gr.update(), gr.State(output_box)

            if "errorCode" in _text:
                yield "Error", "\n".join([_text] + output_box)
                return gr.update(), gr.State(output_box)

            if "Failed to retrieve" in _text:
                yield "Error", "\n".join([_text] + output_box)
                return gr.update(), gr.State(output_box)

            yield _text, "\n".join(output_box)

        else:
            output_box.append(_text)

    catcher = ["exist", "Invalid", "Tag", "Output", "Nothing", "URL", "filename", "Supported Domain:"]

    if any(asu in wc for asu in catcher for wc in output_box):
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
