import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from fastapi import FastAPI, HTTPException, responses
from modules.scripts import basedir
from modules.shared import opts
from urllib.parse import quote
from datetime import datetime
from pathlib import Path
from PIL import Image
import gradio as gr
import tempfile
import hashlib

BASE = '/sd-hub-gallery'
CSS = Path(basedir()) / 'styleGallery.css'
imgEXT = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
thumb_dir = Path(tempfile.gettempdir()) / 'sd-hub-gallery-thumb'
thumb_dir.mkdir(exist_ok=True, parents=True)

outpath = [
    opts.outdir_samples or opts.outdir_txt2img_samples,
    opts.outdir_samples or opts.outdir_img2img_samples,
    opts.outdir_extras_samples,
    opts.outdir_grids or opts.outdir_txt2img_grids,
    opts.outdir_grids or opts.outdir_img2img_grids,
]

class GalleryState:
    def __init__(self):
        self.path_list = []
        self.initial_list = []

Gallery = GalleryState()

def getTimeStamp():
    return datetime.utcnow().strftime('%Y-%m-%d_%H-%M-%S')

def getThumb(src: Path):
    ctime = src.stat().st_ctime
    hash = f'{src.name}{ctime}'.encode('utf-8')
    sha = hashlib.sha256(hash).hexdigest()
    folder = thumb_dir / sha
    folder.mkdir(parents=True, exist_ok=True)
    thumb_name = f'thumb-{src.stem}.webp'
    thumb_path = folder / thumb_name
    if not thumb_path.exists():
        with Image.open(src) as img:
            img.thumbnail((512, 512))
            img.convert('RGB').save(thumb_path, 'WEBP', quality=80)
    return thumb_path

def getImage():
    dirs = [Path(d) for d in outpath if d]
    img = [p for d in dirs if d for p in Path(d).rglob('*') if p.suffix.lower() in imgEXT]
    img.sort(key=lambda p: p.stat().st_mtime)

    results = []
    for path in img:
        thumb_path = getThumb(path)
        results.append({
            'path': f'{BASE}/image{quote(str(path.resolve()))}',
            'thumb': f'{BASE}/thumb/{quote(thumb_path.name)}'
        })

    return results

def GalleryGallery(app: FastAPI):
    headers = {'Cache-Control': 'public, max-age=31536000'}

    @app.get('/sd-hub-gallery-initial')
    async def initialLoad():
        imgs = getImage()
        Gallery.initial_list = [img['path'] for img in imgs]
        return {'images': imgs}

    @app.get('/sd-hub-gallery-list')
    async def newImage():
        imgs = getImage()
        new_imgs = [img for img in imgs if img['path'] not in Gallery.initial_list]
        if new_imgs:
            Gallery.initial_list.extend([img['path'] for img in new_imgs])
            Gallery.path_list = [img['path'] for img in new_imgs] + Gallery.path_list
            return {'images': new_imgs}
        return {'images': []}

    @app.get('/sd-hub-gallery/image{img_path:path}')
    async def sendImage(img_path: str):
        fp = Path(img_path)
        if fp.exists():
            return responses.FileResponse(fp, headers=headers)
        raise HTTPException(status_code=404, detail='Image not found')

    @app.get('/sd-hub-gallery/thumb/{thumb_name}')
    async def sendThumb(thumb_name: str):
        for f in thumb_dir.iterdir():
            if f.is_dir():
                t = f / thumb_name
                if t.exists():
                    return responses.FileResponse(t, headers=headers)
        raise HTTPException(status_code=404, detail='Thumbnail not found')

    @app.get('/styleGallery.css')
    async def sendCSS():
        if CSS.exists():
            url = f'file={CSS}'
            return responses.RedirectResponse(url=url)
        raise HTTPException(status_code=404, detail='CSS file not found')

def GalleryAPI(_: gr.Blocks, app: FastAPI):
    GalleryGallery(app)

def GalleryTab():
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
