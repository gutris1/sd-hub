from modules.ui_components import FormRow, FormColumn
from pathlib import Path
import gradio as gr

from sd_hub.paths import SDHubPaths

tag_tag = SDHubPaths.SDHubTagsAndPaths()

def LoadScript(fp):
    for tag, path in tag_tag.items():
        fp = fp.replace(tag, path)

    langs = {
        '.py': 'python',
        '.js': 'javascript',
        '.css': 'css',
        '.txt': 'text',
        '.json': 'json',
        '.html': 'html',
        '.md': 'markdown',
        '.yml': 'yaml',
        '.yaml': 'yaml'
    }

    f = Path(fp)
    ext = f.suffix

    if not fp or not Path(fp).exists() or Path(fp).suffix not in langs:
        yield gr.Code.update(
            value=('File Not Found' if not fp or not Path(fp).exists() else 'File Unsupported'),
            label='',
            language=None
        )
        return

    script = f.read_text()
    syntax = langs[ext]

    yield gr.Code.update(value=script, label=syntax, language=syntax)

def SaveScript(fp, script):
    f = Path(fp)
    Path(f).write_text(script)
    return

def TextEditor():
    with gr.TabItem("Text Editor", elem_id="sdhub-texteditor-tab"):
        with FormRow():
            loading = gr.Button(
                "Load",
                variant="primary",
                elem_id="sdhub-texteditor-load-button"
            )

            inputs = gr.Textbox(
                show_label=False,
                max_lines=1,
                placeholder='file path',
                scale=9,
                elem_id="sdhub-texteditor-inputs"
            )

            saving = gr.Button(
                "Save",
                variant="primary",
                elem_id="sdhub-texteditor-save-button"
            )

        editor = gr.Code(
            value='',
            label='',
            language=None,
            interactive=True,
            elem_id="sdhub-texteditor-editor"
        )

        loading.click(fn=LoadScript, inputs=inputs, outputs=editor)
        saving.click(fn=SaveScript, inputs=[inputs, editor], outputs=[])
