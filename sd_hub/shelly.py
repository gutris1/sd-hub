from modules.ui_components import FormRow, FormColumn
from pathlib import Path
import gradio as gr
import subprocess

from sd_hub.paths import SDHubPaths

tag_tag = SDHubPaths.SDHubTagsAndPaths()

def is_that_tag(output_path):
    if output_path.startswith('$'):
        parts = output_path[1:].strip().split('/', 1)
        tags_key = f"${parts[0].lower()}"
        subfolder = parts[1] if len(parts) > 1 else None
        path = tag_tag.get(tags_key)

        if path is not None:
            fp = Path(path, subfolder) if subfolder else Path(path)
            return fp, None
        else:
            return None, f"Invalid tag: {tags_key}"
    else:
        return Path(output_path), None

def ShellRun(inputs):
    p = subprocess.Popen(
        inputs,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    while True:
        line = p.stdout.readline()
        if not line and p.poll() is not None:
            break
        if line:
            yield line.strip()

    p.wait()

def ShellLobby(inputs, box_state=gr.State()):
    output_box = box_state if box_state else []

    for outputs in ShellRun(inputs):
        if outputs:
            yield outputs, "\n".join(output_box)

    return gr.update(), gr.State(output_box)

def Shelly():
    with gr.TabItem("Shell", elem_id="sdhub-shell-tab"):
        with FormRow():
            inputs = gr.Textbox(
                lines=5,
                placeholder="whatever",
                show_label=False,
                elem_id="sdhub-archiver-arc-inputname"
            )

        with FormRow():
            button = gr.Button("Enter", variant="primary")
            gr.Button("hantu", variant="primary", elem_classes="hide-this", scale=4)

        with FormRow():
            output = gr.Textbox(show_label=False, interactive=False, lines=5)

        button.click(fn=ShellLobby, inputs=[inputs, gr.State()], outputs=[output])
