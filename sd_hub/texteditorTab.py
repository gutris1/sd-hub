from modules.ui_components import FormRow
from pathlib import Path
import gradio as gr
import json

from sd_hub.infotext import config, LoadConfig
from sd_hub.paths import SDHubPaths

tag_tag = SDHubPaths.SDHubTagsAndPaths()
Code = gr.Code.update
Textbox = gr.Textbox.update

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

    if not fp or not f.exists() or ext not in langs:
        info = 'File Not Found' if not f.exists() else 'File Unsupported'
        yield Code(value='', label='', language=None), Textbox(value=info)
        return

    script = f.read_text()
    syntax = langs[ext]

    yield Code(value=script, label=syntax, language=syntax), Textbox(value='Loaded')

def SaveTextFile(script, fp):
    if not fp.strip():
        yield Textbox(value=''), Textbox(value='Save Nothing')
        return

    f = Path(fp)
    f.write_text(script)

    v = LoadConfig()
    v.setdefault('Text-Editor', {})
    v['Text-Editor']['last-edit'] = str(f)

    config.write_text(json.dumps(v, indent=4), encoding='utf-8')
    yield Textbox(value=fp), Textbox(value='Saved')

def LoadInitial():
    v = LoadConfig()
    last = v.get('Text-Editor', {}).get('last-edit', '')
    f = Path(last)

    if last and f.exists():
        ext = f.suffix
        if ext in langs:
            script = f.read_text()
            syntax = langs[ext]
            return Code(value=script, label=syntax, language=syntax), Textbox(value=str(f))

    return Code(value='', label='', language=None), Textbox(value='')

def TextEditorTab():
    with gr.TabItem('Text Editor', elem_id='SDHub-Texteditor-Tab'):
        with FormRow(elem_id='SDHub-Texteditor-Row'):
            saving = gr.Button(
                'Save',
                variant='primary',
                elem_id='SDHub-Texteditor-Save-Button',
                elem_classes='sdhub-buttons'
            )

            inputs = gr.Textbox(
                show_label=False,
                interactive=True,
                max_lines=1,
                placeholder='file path',
                scale=9,
                elem_id='SDHub-Texteditor-Input',
                elem_classes='sdhub-input'
            )

            info = gr.Textbox(
                show_label=False,
                interactive=False,
                max_lines=1,
                scale=1,
                elem_id='SDHub-Texteditor-Info'
            )

            loading = gr.Button(
                'Load',
                variant='primary',
                elem_id='SDHub-Texteditor-Load-Button',
                elem_classes='sdhub-buttons'
            )

        editor = gr.Code(
            value='',
            label='',
            language=None,
            interactive=True,
            elem_id='SDHub-Texteditor-Editor'
        )

        js = """
            () => {
                let info = document.querySelector('#SDHub-Texteditor-Info input')?.value;
                if (info) SDHubTextEditorInfo(info);
            }
        """

        loading.click(fn=LoadTextFile, inputs=inputs, outputs=[editor, info]).then(fn=None, _js=js)
        saving.click(fn=SaveTextFile, inputs=[editor, inputs], outputs=[inputs, info]).then(fn=None, _js=js)

        initial = gr.Button(visible=False, elem_id='SDHub-Texteditor-Initial-Load')
        initial.click(fn=LoadInitial, inputs=[], outputs=[editor, inputs])
