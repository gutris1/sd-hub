from fastapi import FastAPI, HTTPException, responses, Request
import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from modules.scripts import basedir
from modules.shared import opts
from urllib.parse import quote
from datetime import datetime
from pathlib import Path
import gradio as gr
import sys
import os

from sd_hub.paths import SDHubPaths

insecureENV = SDHubPaths.getENV()

BASE = '/sd-hub-gallery'
CSS = Path(basedir()) / 'styleGallery.css'
imgEXT = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
today = datetime.today().strftime("%Y-%m-%d")

sample_dirs = [opts.outdir_txt2img_samples, opts.outdir_img2img_samples, opts.outdir_extras_samples]
grid_dirs = [opts.outdir_txt2img_grids, opts.outdir_img2img_grids]
outdir_samples = [Path(opts.outdir_samples) / today] if opts.outdir_samples else []
outdir_grids = [Path(opts.outdir_grids) / today] if opts.outdir_grids else []
outdir_extras = [Path(opts.outdir_samples)] if opts.outdir_samples else []

outpath = outdir_samples + outdir_grids + outdir_extras + [Path(d) for d in sample_dirs + grid_dirs if d]

class GalleryState:
    def __init__(self):
        self.initial_list = []

Gallery = GalleryState()

def getCTimes(path: Path):
    return (
        path.stat().st_ctime_ns if sys.platform == "win32"
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
        query_suffix = "?extras" if path.parent in outdir_extras else ""
        results.append({"path": f"{BASE}/image{quote(str(path.resolve()))}{query_suffix}"})
    
    return results

def GalleryApi(app: FastAPI):
    headers = {'Cache-Control': 'public, max-age=31536000'}

    @app.get('/sd-hub-gallery-initial')
    async def initialLoad():
        imgs = getImage()
        Gallery.initial_list = [img['path'] for img in imgs]
        return {'images': imgs}

    @app.get('/sd-hub-gallery/image{img_path:path}')
    async def sendImage(img_path: str):
        fp = Path(img_path)
        if fp.exists():
            return responses.FileResponse(fp, headers=headers)
        raise HTTPException(status_code=404, detail='Image not found')

    @app.get('/sd-hub-gallery/styleGallery.css')
    async def sendCSS():
        if CSS.exists():
            return responses.FileResponse(CSS, media_type="text/css")
        raise HTTPException(status_code=404, detail="CSS file not found")

    @app.post('/sd-hub-gallery-delete')
    async def deleteImage(req: Request):
        d = await req.json()
        fp = Path(d['path'])
        if fp.exists():
            fp.unlink()
            if str(fp) in Gallery.initial_list:
                Gallery.initial_list.remove(str(fp))
        return {'status': 'deleted'}

def GalleryApp(_: gr.Blocks, app: FastAPI):
    GalleryApi(app)

def GalleryTab():
    if insecureENV:
        with gr.Column(elem_id='SDHub-Gallery-imgchest-Column'):
            gr.Checkbox(label='Auto Upload to imgchest.com', elem_id='SDHub-Gallery-imgchest-Checkbox')

            with FormRow():
                privacyset = gr.Radio(
                    ['Hidden', 'Public'],
                    value='Hidden',
                    label='Privacy',
                    interactive=True,
                    elem_id='SDHub-Gallery-imgchest-Privacy'
                )

                nsfwset = gr.Radio(
                    ['True', 'False'],
                    value='True',
                    label='NSFW',
                    interactive=True,
                    elem_id='SDHub-Gallery-imgchest-NSFW'
                )

            apibox = gr.Textbox(
                show_label=False,
                placeholder='imgchest API key',
                max_lines=1,
                elem_id='SDHub-Gallery-imgchest-API'
            )

            with FormRow():
                savebtn = gr.Button('Save', variant='primary', elem_id='SDHub-Gallery-imgchest-Save-Button')
                loadbtn = gr.Button('Load', variant='primary', elem_id='SDHub-Gallery-imgchest-Load-Button')

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
