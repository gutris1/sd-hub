from modules.ui_components import FormRow
import gradio as gr
import subprocess
import select
import os

from sd_hub.infotext import shell_title
from sd_hub.paths import SDHubPaths

tag_tag = SDHubPaths.SDHubTagsAndPaths()

def ShellRun(inputs):
    import pty

    for tag, path in tag_tag.items():
        inputs = inputs.replace(tag, path)

    ayu, rika = pty.openpty()

    p = subprocess.Popen(
        inputs,
        shell=True,
        stdout=ayu,
        stderr=ayu,
        text=True
    )

    while True:
        try:
            temenan, _, _ = select.select([ayu], [], [])
            if temenan:
                ketemuan = os.read(ayu, 8192)
                if not ketemuan:
                    break

                yield ketemuan.decode('utf-8').strip()

            if p.poll() is not None:
                break

        except OSError:
            break

    if p.stdout:
        p.stdout.close()
    if p.stderr:
        p.stderr.close()

    _ = p.wait()

    yield ' '

def ShellLobby(inputs, box_state=gr.State()):
    output_box = box_state if box_state else []

    for output in ShellRun(inputs):
        if output:
            output_box.append(output)
            yield "\n".join(output_box)

    return gr.update()

def Shelly():
    with gr.TabItem("Shell", elem_id="sdhub-shell-tab"):
        gr.HTML(shell_title)

        with FormRow():
            inputs = gr.Textbox(
                lines=5,
                placeholder="press Shift + Enter to run command",
                show_label=False,
                elem_id="sdhub-archiver-arc-inputname"
            )

        with FormRow():
            button = gr.Button("Run", variant="primary", elem_id="sdhub-shell-button")
            gr.Button("hantu", variant="primary", elem_classes="hide-this", scale=5)

        with FormRow():
            output = gr.Textbox(show_label=False, interactive=False, lines=5)

        button.click(fn=ShellLobby, inputs=[inputs, gr.State()], outputs=[output])
