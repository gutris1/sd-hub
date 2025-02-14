from modules.ui_components import FormRow, FormColumn
from pathlib import Path
import gradio as gr

from sd_hub.paths import SDHubPaths

tag_tag = SDHubPaths.SDHubTagsAndPaths()

LastEdit = Path(__file__).parent / 'lastEdit.txt'

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

def LoadTextFile(fp):
    for tag, path in tag_tag.items():
        fp = fp.replace(tag, path)

    f = Path(fp)
    ext = f.suffix

    if not fp or not Path(fp).exists() or Path(fp).suffix not in langs:
        info = 'File Not Found' if not fp or not Path(fp).exists() else 'File Unsupported'
        yield gr.Code.update(value='', label='', language=None), gr.Textbox.update(value=info)
        return

    script = f.read_text()
    syntax = langs[ext]

    yield gr.Code.update(value=script, label=syntax, language=syntax), gr.Textbox.update(value='Loaded')

def SaveTextFile(fp, script):
    f = Path(fp)
    f.write_text(script)
    LastEdit.write_text(str(f))
    yield gr.Textbox.update(value='Saved')

def LoadInitial():
    if LastEdit.exists():
        f = Path(LastEdit.read_text())
        ext = f.suffix
        script = f.read_text()
        syntax = langs[ext]
        return str(f), script, syntax, syntax
    else:
        return '', '', '', None

def TextEditorTab():
    TextPath, TextContent, TextLabel, TextLang = LoadInitial()

    with gr.TabItem("Text Editor", elem_id="sdhub-texteditor-tab"):
        with FormRow(elem_id="sdhub-texteditor-row"):
            loading = gr.Button(
                "Load",
                variant="primary",
                elem_id="sdhub-texteditor-load-button"
            )

            inputs = gr.Textbox(
                value=TextPath,
                show_label=False,
                interactive=True,
                max_lines=1,
                placeholder='file path',
                scale=9,
                elem_id="sdhub-texteditor-inputs"
            )

            info = gr.Textbox(
                show_label=False,
                interactive=False,
                max_lines=1,
                scale=1,
                elem_id="sdhub-texteditor-info"
            )

            saving = gr.Button(
                "Save",
                variant="primary",
                elem_id="sdhub-texteditor-save-button"
            )

        editor = gr.Code(
            value=TextContent,
            label=TextLabel,
            language=TextLang,
            interactive=True,
            elem_id="sdhub-texteditor-editor"
        )

        loading.click(fn=LoadTextFile, inputs=inputs, outputs=[editor, info])
        saving.click(fn=SaveTextFile, inputs=[inputs, editor], outputs=info)
        info.change(fn=None, _js="() => {SDHubTextEditorInfo();}")
