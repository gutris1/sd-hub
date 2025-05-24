import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, responses, Request
from datetime import datetime, timedelta
from urllib.parse import quote, unquote
from modules.scripts import basedir
from modules.shared import opts
from pathlib import Path
from io import BytesIO
from PIL import Image
import gradio as gr
import mimetypes
import threading
import asyncio
import json
import time
import sys

from sd_hub.paths import SDHubPaths

insecureENV = SDHubPaths.getENV()

BASE = '/sd-hub-gallery'
CSS = Path(basedir()) / 'styleGallery.css'
imgEXT = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
today = datetime.today().strftime('%Y-%m-%d')
chest = Path(basedir()) / '.imgchest.json'
imgList = []
imgList_List = threading.Event()
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

def getPath(path):
    p = path.resolve().as_posix() if sys.platform == 'win32' else str(path.resolve()).lstrip('/')
    return quote(p)

def getThumbnail(fp, size=512):
    def resize(path):
        try:
            if not path.exists():
                return None

            k = f'{path.stem}.jpeg'
            if k in Thumbnails: return Thumbnails[k]

            img = Image.open(path)
            if img.format == 'JPEG': img.draft('RGB', (size, size))
            if img.mode == 'RGBA': img = img.convert('RGB')

            img.thumbnail((size, size), Image.BILINEAR)
            out = BytesIO()
            img.save(out, format='JPEG', quality=70)
            thumb = out.getvalue()
            Thumbnails[k] = thumb
            return thumb

        except Exception as e:
            print(f'Thumb Error {path}: {e}')
            return None

    if isinstance(fp, list):
        start = time.time()
        with ThreadPoolExecutor(max_workers=8) as executor:
            list(executor.map(resize, fp))
        print(f'total {len(fp)} for {time.time() - start:.2f} seconds.')
        return None
    else:
        return resize(fp)

def getImage():
    def listing():
        dirs = [d for d in outpath if d.exists() and d.is_dir()]
        files = []

        for d in dirs:
            if d in outdir_extras:
                files.extend([p for p in d.glob('*') if p.suffix.lower() in imgEXT])
            else:
                files.extend([p for p in d.rglob('*') if p.suffix.lower() in imgEXT])

        files.sort(key=lambda p: p.stat().st_mtime_ns)
        getThumbnail(files)

        results = []
        for path in files:
            src = str(path.parent)
            if src == opts.outdir_save: query = '?save'
            elif src == opts.outdir_init_images: query = '?init'
            elif path.parent in outdir_extras: query = '?extras'
            else: query = ''

            results.append({'path': f'{BASE}/image/{getPath(path)}{query}'})

        global imgList
        imgList_List.clear()
        imgList.clear()
        imgList.extend(results)
        imgList_List.set()

    threading.Thread(target=listing, daemon=True).start()

def GalleryApp(_: gr.Blocks, app: FastAPI):
    global imgList
    getImage()

    headers = {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': (datetime.now() + timedelta(days=365)).strftime('%a, %d %b %Y %H:%M:%S GMT')
    }

    @app.get(BASE + '/initial')
    async def initialLoad():
        try:
            r = await asyncio.to_thread(imgList_List.wait, 0.1)
            if not r: return {'status': 'waiting'}
            return {'images': imgList}
        except Exception as e:
            return responses.JSONResponse(status_code=500, content={'error': 'Server error', 'detail': str(e)})

    @app.get(BASE + '/image/{img:path}')
    async def sendImage(img: str):
        fp = Path(unquote(img))
        media_type, _ = mimetypes.guess_type(fp)
        return responses.FileResponse(fp, headers=headers, media_type=media_type)

    @app.get(BASE + '/thumb/{img}')
    async def sendThumb(img: str):
        thumb = Thumbnails.get(img)
        return responses.Response(content=thumb, headers=headers, media_type='image/jpeg')

    @app.post(BASE + '/getthumb')
    async def getThumb(req: Request):
        fp = Path((await req.json()).get('path'))
        await asyncio.to_thread(getThumbnail, fp)
        return {'status': f'{BASE}/thumb/{quote(fp.stem)}.jpeg'}

    @app.post(BASE + '/delete')
    async def deleteImage(req: Request):
        data = await req.json()
        path = Path(data.get('path'))
        thumb = Path(unquote(data.get('thumb', ''))).name

        if path.exists():
            try:
                path.unlink()
                Thumbnails.pop(thumb, None)
                global imgList
                imgList = [img for img in imgList if unquote(img['path'].split('/image/')[-1].split('?')[0]) != path.as_posix()]
            except Exception as e:
                return {'status': f'error: {e}'}
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

        savebtn.click(fn=Saveimgchest, inputs=[privacyset, nsfwset, apibox], outputs=[privacyset, nsfwset, apibox])
        loadbtn.click(fn=Loadimgchest, inputs=[], outputs=[privacyset, nsfwset, apibox])

    with gr.TabItem('Gallery', elem_id='sdhub-gallery-tab'):
        with FormColumn(variant='compact', elem_id='SDHub-Gallery-Info-Column'):
            image = gr.Image(elem_id='SDHub-Gallery-Info-Image', type='pil', source='upload', show_label=False)
            image.change(fn=None, _js='() => { SDHubGalleryParser(); }')

            with FormColumn(variant='compact', elem_id='SDHub-Gallery-Info-Output-Panel'):
                with FormRow(variant='compact', elem_id='SDHub-Gallery-Info-SendButton'):
                    buttons = tempe.create_buttons(['txt2img', 'img2img', 'inpaint', 'extras'])

                geninfo = gr.Textbox(elem_id='SDHub-Gallery-Info-GenInfo', visible=False)
                gr.HTML(elem_id='SDHub-Gallery-Info-HTML')

        for tabname, button in buttons.items():
            tempe.register_paste_params_button(
                tempe.ParamBinding(
                    paste_button=button,
                    tabname=tabname,
                    source_text_component=geninfo,
                    source_image_component=image
                )
            )
