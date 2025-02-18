from modules.ui_components import FormRow
import gradio as gr
import subprocess
import select
import pty
import os

from sd_hub.paths import SDHubPaths

tag_tag = SDHubPaths.SDHubTagsAndPaths()

def ShellRun(inputs):
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

    try:
        while True:
            try:
                temenan, _, _ = select.select([ayu], [], [], 0.1)
                if temenan:
                    ketemuan = os.read(ayu, 8192)
                    if ketemuan:
                        yield ketemuan.decode('utf-8').strip()
                    else:
                        break
                if p.poll() is not None:
                    break
            except OSError:
                break
    finally:
        os.close(ayu)
        os.close(rika)

        if p.stdout:
            p.stdout.close()
        if p.stderr:
            p.stderr.close()

        p.wait()

def ShellLobby(inputs, box_state=gr.State()):
    if not inputs.strip():
        return

    output_box = box_state if box_state else []

    for output in ShellRun(inputs):
        if output:
            output_box.append(output)
            yield "\n".join(output_box)

    return gr.update()

def ShellTab():
    with gr.TabItem("Shell", elem_id="sdhub-shell-tab"):
        with FormRow():
            button = gr.Button(
                "▶",
                variant="primary",
                elem_id="sdhub-shell-button"
            )

            inputs = gr.Textbox(
                lines=5,
                placeholder="press Shift + Enter to run command",
                show_label=False,
                elem_id="sdhub-shell-inputs",
                scale=9
            )

        with FormRow():
            gr.Button(
                "hantu",
                variant="primary",
                elem_id="sdhub-shell-ghost-button",
                elem_classes="hide-this"
            )

            output = gr.Textbox(
                show_label=False,
                interactive=False,
                max_lines=21,
                scale=9,
                elem_id="sdhub-shell-output"
            )

        button.click(
            fn=ShellLobby,
            inputs=[inputs, gr.State()],
            outputs=[output]
        )
