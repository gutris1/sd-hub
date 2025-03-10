from fastapi import FastAPI, HTTPException, responses, Request
import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from modules.scripts import basedir
from modules.shared import opts
from urllib.parse import quote
from datetime import datetime
from pathlib import Path
import gradio as gr
import json
import sys
import os

from sd_hub.paths import SDHubPaths

insecureENV = SDHubPaths.getENV()

BASE = '/sd-hub-gallery'
CSS = Path(basedir()) / 'styleGallery.css'
imgEXT = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
today = datetime.today().strftime("%Y-%m-%d")
chest = Path(basedir()) / '.imgchest.json'

sample_dirs = [opts.outdir_txt2img_samples, opts.outdir_img2img_samples, opts.outdir_extras_samples]
grid_dirs = [opts.outdir_txt2img_grids, opts.outdir_img2img_grids]
etc_dirs = [opts.outdir_save, opts.outdir_init_images]

outdir_samples = [Path(opts.outdir_samples) / today] if opts.outdir_samples else []
outdir_grids = [Path(opts.outdir_grids) / today] if opts.outdir_grids else []
outdir_extras = [Path(opts.outdir_samples)] if opts.outdir_samples else []

outpath = (
    outdir_samples + outdir_grids + outdir_extras +
    [Path(d) for d in sample_dirs + grid_dirs + etc_dirs if d]
)

def Saveimgchest(privacy, nsfw, api):
    chest.write_text(json.dumps({'privacy': privacy, 'nsfw': nsfw, 'api': api}, indent=4))
    yield gr.Radio.update(value=privacy), gr.Radio.update(value=nsfw), gr.TextArea.update(value=api)

def Loadimgchest():
    default = ('Hidden', 'True', '')
    if chest.exists():
        d = json.loads(chest.read_text())
        return tuple(d.get(k, v) for k, v in zip(['privacy', 'nsfw', 'api'], default))
    return default

def getCTimes(path: Path):
    return (
        path.stat().st_ctime_ns if sys.platform == 'win32'
        else os.stat(path, follow_symlinks=True).st_ctime_ns
    )

def getImage():
    valid_dirs = [d for d in outpath if d.exists() and d.is_dir()]
    img = []

    for d in valid_dirs:
        if d in outdir_extras:
            img.extend([p for p in d.glob('*') if p.suffix.lower() in imgEXT])
        else:
            img.extend([p for p in d.rglob('*') if p.suffix.lower() in imgEXT])

    img.sort(key=getCTimes)

    results = []
    for path in img:
        src = str(path.parent)

        if src == opts.outdir_save: query = '?save'
        elif src == opts.outdir_init_images: query = '?init'
        elif path.parent in outdir_extras: query = '?extras'
        else: query = ''

        results.append({'path': f'{BASE}/image{quote(str(path.resolve()))}{query}'})

    return results

def Gallery(app: FastAPI):
    headers = {'Cache-Control': 'public, max-age=31536000'}

    @app.get(BASE + '/initial')
    async def initialLoad():
        imgs = getImage()
        return {'images': imgs}

    @app.get(BASE + '/image{img:path}')
    async def sendImage(img: str):
        fp = Path(img)
        if fp.exists():
            return responses.FileResponse(fp, headers=headers)
        raise HTTPException(status_code=404, detail='Image not found')

    @app.post(BASE + '/delete')
    async def deleteImage(req: Request):
        d = await req.json()
        fp = Path(d['path'])
        if fp.exists(): fp.unlink()
        return {'status': 'deleted'}

def GalleryApp(_: gr.Blocks, app: FastAPI):
    Gallery(app)

def GalleryTab():
    if insecureENV:
        privacy, nsfw, api = Loadimgchest()

        with gr.Column(elem_id='SDHub-Gallery-imgchest-Column'):
            gr.HTML(
                'Auto Upload to <a class="sdhub-gallery-imgchest-info" '
                'href="https://imgchest.com" target="_blank"> imgchest.com</a>',
                elem_id='SDHub-Gallery-imgchest-Info'
            )

            gr.Checkbox(
                label='Click To Enable',
                elem_id='SDHub-Gallery-imgchest-Checkbox'
            )

            with FormRow():
                privacyset = gr.Radio(
                    ['Hidden', 'Public'],
                    value=privacy,
                    label='Privacy',
                    interactive=True,
                    elem_id='SDHub-Gallery-imgchest-Privacy',
                    elem_classes='sdhub-radio'
                )

                nsfwset = gr.Radio(
                    ['True', 'False'],
                    value=nsfw,
                    label='NSFW',
                    interactive=True,
                    elem_id='SDHub-Gallery-imgchest-NSFW',
                    elem_classes='sdhub-radio'
                )

            apibox = gr.TextArea(
                value=api,
                show_label=False,
                interactive=True,
                placeholder='imgchest API key',
                lines=1,
                max_lines=1,
                elem_id='SDHub-Gallery-imgchest-API'
            )

            with FormRow():
                savebtn = gr.Button(
                    'Save',
                    variant='primary',
                    elem_id='SDHub-Gallery-imgchest-Save-Button'
                )

                loadbtn = gr.Button(
                    'Load',
                    variant='primary',
                    elem_id='SDHub-Gallery-imgchest-Load-Button'
                )

        savebtn.click(
            fn=Saveimgchest,
            inputs=[privacyset, nsfwset, apibox],
            outputs=[privacyset, nsfwset, apibox]
        )

        loadbtn.click(
            fn=Loadimgchest,
            inputs=[],
            outputs=[privacyset, nsfwset, apibox]
        )

    with gr.TabItem('Gallery', elem_id='sdhub-gallery-tab'):
        with FormRow(equal_height=False, elem_id='sdhub-gallery-image-info-row'):
            with FormColumn(variant='compact', scale=3):
                image = gr.Image(
                    elem_id='SDHubimgInfoImage',
                    type='pil',
                    source='upload',
                    show_label=False
                )

                with FormColumn(variant='compact', elem_id='SDHubimgInfoSendButton'):
                    buttons = tempe.create_buttons(
                        ['txt2img', 'img2img', 'inpaint', 'extras']
                    )

            with FormColumn(variant='compact', scale=7, elem_id='SDHubimgInfoOutputPanel'):
                geninfo = gr.Textbox(elem_id='SDHubimgInfoGenInfo', visible=False)
                gr.HTML(elem_id='SDHubimgInfoHTML')

            for tabname, button in buttons.items():
                tempe.register_paste_params_button(
                    tempe.ParamBinding(
                        paste_button=button, 
                        tabname=tabname, 
                        source_text_component=geninfo, 
                        source_image_component=image
                    )
                )

            image.change(fn=None, _js='() => {SDHubGalleryParser();}')
