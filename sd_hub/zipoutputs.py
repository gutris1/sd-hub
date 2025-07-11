from modules.ui_components import FormRow, FormColumn
from modules.paths_internal import data_path
from modules.shared import opts
from pathlib import Path
from tqdm import tqdm
import gradio as gr
import zipfile

from sd_hub.paths import SDHubPaths

tag_tag = SDHubPaths.SDHubTagsAndPaths()

def is_that_tag(output_path):
    if output_path.startswith('$'):
        parts = output_path[1:].strip().split('/', 1)
        tags_key = f'${parts[0].lower()}'
        subfolder = parts[1] if len(parts) > 1 else None
        path = tag_tag.get(tags_key)

        if path is not None:
            fp = Path(path, subfolder) if subfolder else Path(path)
            return fp, None
        else:
            return None, f'Invalid tag: {tags_key}'
    else:
        return Path(output_path), None

def zipping(file_name, output_path, mkdir_zip):
    resolved, err = is_that_tag(output_path)
    if err: yield err, True; return

    out = resolved if resolved else Path(data_path)
    fn = Path(file_name.strip()) if file_name else 'ZipOutputs'

    if not mkdir_zip:
        if not out.exists(): yield f'{out}\nOutput path does not exist.', True; return
    else:
        out.mkdir(parents=True, exist_ok=True)

    zip_in = opts.outdir_samples or Path(data_path) / 'outputs'
    if not zip_in.exists(): yield f'{zip_in} not found', True; return
    if not any(zip_in.iterdir()): yield f'{zip_in} is empty', True; return

    zip_out = out / f'{fn}.zip'
    counter = 1
    while zip_out.exists():
        zip_out = out / f'{fn}_{counter}.zip'
        counter += 1

    zip_bar = '{percentage:3.0f}% | {n_fmt}/{total_fmt} | {rate_fmt}{postfix}'
    total_size = sum(f.stat().st_size for f in zip_in.rglob('*') if f.is_file())

    yield f'zipping {zip_out.name}', False

    with tqdm(
        total=total_size,
        unit='B',
        unit_scale=True,
        bar_format=zip_bar,
        ascii='▷▶'
    ) as pbar:
        with zipfile.ZipFile(zip_out, 'w', zipfile.ZIP_DEFLATED) as zipf:
            chunk_size = 4096 * 1024
            for file_to_compress in zip_in.rglob('*'):
                if file_to_compress.is_file():
                    with open(file_to_compress, 'rb') as f:
                        while True:
                            chunk = f.read(chunk_size)
                            if not chunk: break

                            zipf.writestr(str(file_to_compress.relative_to(zip_in)), chunk)
                            pbar.update(len(chunk))

                            yield pbar, False

    yield f'Saved To: {zip_out.resolve()}', True

def zipzip(file_name, output_path, mkdir_zip, box_state=gr.State()):
    output_box = box_state if box_state else []

    for t, f in zipping(file_name, output_path, mkdir_zip):
        if not f:
            yield t, '\n'.join(output_box)
        else:
            output_box.append(t)

    cc = ['not', 'Missing', 'Invalid', 'is empty']

    if any(aa in bb for aa in cc for bb in output_box):
        yield 'Error', '\n'.join(output_box)
    else:
        yield 'Done', '\n'.join(output_box)

    return gr.update(), gr.State(output_box)

def ZipOutputs():
    with gr.Accordion('Zip Outputs', open=False, elem_id='SDHub-Archiver-ZipOutputs-Accordion', elem_classes='sdhub-accordion'):
        with FormRow():
            with FormColumn(scale=6):
                zip_name = gr.Textbox(
                    max_lines=1,
                    placeholder='ZIP Name (default to ZipOutputs if empty)',
                    show_label=False,
                    elem_id='SDHub-Archiver-ZipOutputs-Input-Name',
                    elem_classes='sdhub-input'
                )

                zip_out = gr.Textbox(
                    max_lines=1,
                    placeholder='ZIP Output Path (default to WebUI root if empty)',
                    show_label=False,
                    elem_id='SDHub-Archiver-ZipOutputs-Output-Path',
                    elem_classes='sdhub-input'
                )

                with FormRow(elem_classes='sdhub-row'):
                    with FormRow(elem_classes='sdhub-button-row-1'):
                        zip_run = gr.Button(
                            'Zip Zip',
                            variant='primary',
                            elem_id='SDHub-Archiver-ZipOutputs-Button',
                            elem_classes='sdhub-buttons'
                        )

                    with FormRow(elem_classes='sdhub-button-row-2'):
                        mkdir_zip = gr.Checkbox(
                            label='Create Directory',
                            elem_id='SDHub-Archiver-ZipOutputs-Checkbox',
                            elem_classes='sdhub-checkbox'
                        )

            with FormColumn(scale=4):
                zip_output1 = gr.Textbox(
                    show_label=False,
                    interactive=False,
                    max_lines=1,
                    elem_classes='sdhub-output'
                )

                zip_output2 = gr.Textbox(
                    show_label=False,
                    interactive=False,
                    lines=5,
                    elem_classes='sdhub-output'
                )

        zip_run.click(fn=zipzip, inputs=[zip_name, zip_out, mkdir_zip, gr.State()], outputs=[zip_output1, zip_output2])