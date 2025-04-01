import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from fastapi import FastAPI, responses, Request
from datetime import datetime, timedelta
from modules.scripts import basedir
from modules.shared import opts
from urllib.parse import quote
from pathlib import Path
from io import BytesIO
from PIL import Image
import gradio as gr
import mimetypes
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
Thumbnails = {}

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

def getThumbnail(path: Path, size=512, quality=80):
    try:
        img = Image.open(path)
        img.thumbnail((size, size))
        out = BytesIO()
        img.save(out, format='WEBP', quality=quality)
        thumb = out.getvalue()
        Thumbnails[f'{path.stem}.webp'] = thumb
        return thumb
    except Exception as e:
        print(f'Error processing {path}: {e}')
        return None

def getImage():
    dirs = [d for d in outpath if d.exists() and d.is_dir()]
    files = []
    results = []

    for d in dirs:
        if d in outdir_extras:
            files.extend([p for p in d.glob('*') if p.suffix.lower() in imgEXT])
        else:
            files.extend([p for p in d.rglob('*') if p.suffix.lower() in imgEXT])

    files.sort(key=getCTimes)

    for path in files:
        src = str(path.parent)
        if src == opts.outdir_save:
            query = '?save'
        elif src == opts.outdir_init_images:
            query = '?init'
        elif path.parent in outdir_extras:
            query = '?extras'
        else:
            query = ''

        getThumbnail(path)

        results.append({
            'path': f'{BASE}/image{quote(str(path.resolve()))}{query}',
            'thumbnail': f'{BASE}/thumb/{quote(path.stem)}.webp'
        })

    return results

def GalleryApp(_: gr.Blocks, app: FastAPI):
    @app.get(BASE + '/initial')
    async def initialLoad():
        imgs = getImage()
        return {'images': imgs}

    @app.get(BASE + '/image{img:path}')
    async def sendImage(img: str):
        fp = Path(img)
        media_type, _ = mimetypes.guess_type(fp)
        headers = {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Expires': (datetime.now() + timedelta(days=365)).strftime('%a, %d %b %Y %H:%M:%S GMT')
        }
        return responses.FileResponse(fp, headers=headers, media_type=media_type)

    @app.get(BASE + '/thumb/{img}')
    async def sendThumb(img: str):
        thumb = Thumbnails.get(img)
        return responses.Response(content=thumb, media_type='image/webp')

    @app.post(BASE + '/getthumb')
    async def getThumb(req: Request):
        fp = Path((await req.json()).get('path'))
        getThumbnail(fp)
        return {'status': f'{BASE}/thumb/{quote(fp.stem)}.webp'}

    @app.post(BASE + '/delete')
    async def deleteImage(req: Request):
        fp = Path((await req.json()).get('path'))
        if fp.exists():
            fp.unlink()
            return {'status': 'deleted'}

    if insecureENV:
        @app.get(BASE + '/imgChest')
        async def imgChest():
            privacy, nsfw, api = Loadimgchest()
            return {'privacy': privacy, 'nsfw': nsfw, 'api': api}

def GalleryTab():
    if insecureENV:
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
                    value='Hidden',
                    label='Privacy',
                    interactive=True,
                    elem_id='SDHub-Gallery-imgchest-Privacy',
                    elem_classes='sdhub-radio'
                )

                nsfwset = gr.Radio(
                    ['True', 'False'],
                    value='True',
                    label='NSFW',
                    interactive=True,
                    elem_id='SDHub-Gallery-imgchest-NSFW',
                    elem_classes='sdhub-radio'
                )

            apibox = gr.Textbox(
                show_label=False,
                interactive=True,
                placeholder='imgchest API key',
                max_lines=1,
                elem_id='SDHub-Gallery-imgchest-API',
                elem_classes='sdhub-input'
            )

            with FormRow():
                savebtn = gr.Button(
                    'Save',
                    variant='primary',
                    elem_id='SDHub-Gallery-imgchest-Save-Button',
                    elem_classes='sdhub-buttons'
                )

                loadbtn = gr.Button(
                    'Load',
                    variant='primary',
                    elem_id='SDHub-Gallery-imgchest-Load-Button',
                    elem_classes='sdhub-buttons'
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
