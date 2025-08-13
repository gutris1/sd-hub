import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from modules.script_callbacks import on_image_saved
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, responses, Request
from datetime import datetime, timedelta
from urllib.parse import quote, unquote
from modules.scripts import basedir
from send2trash import send2trash
from modules.shared import opts
from pathlib import Path
from io import BytesIO
from PIL import Image
import gradio as gr
import mimetypes
import threading
import tempfile
import asyncio
import zipfile
import json
import sys
import re

from sd_hub.infotext import config, LoadConfig
from sd_hub.paths import SDHubPaths

insecureENV = SDHubPaths.getENV()

BASE = '/sd-hub-gallery-'
imgEXT = ['.png', '.jpg', '.jpeg', '.webp', '.avif']

imgList = []
imgList_List = threading.Event()
Thumbnails = {}
imgNew = []

def Saveimgchest(privacy, nsfw, api):
    d = LoadConfig()
    d['imgChest'] = {'privacy': privacy, 'nsfw': nsfw, 'api-key': api}
    config.write_text(json.dumps(d, indent=4), encoding='utf-8')
    yield gr.Radio.update(value=privacy), gr.Radio.update(value=nsfw), gr.TextArea.update(value=api)

def Loadimgchest():
    default = ('Hidden', 'True', '')
    d = LoadConfig()
    c = d.get('imgChest', {})
    return tuple(c.get(k, v) for k, v in zip(['privacy', 'nsfw', 'api-key'], default))

def getPath(path):
    p = path.absolute().as_posix() if sys.platform == 'win32' else str(path.absolute())
    return quote(p)

def getThumbnail(fp, size=512):
    def resize(path):
        try:
            if not path.exists(): return None

            k = f"{getPath(path.with_suffix(''))}.jpeg"
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
        with ThreadPoolExecutor(max_workers=8) as exe: list(exe.map(resize, fp))
        return None
    else:
        return resize(fp)

def getImage():
    dates = re.compile(r'\d{2}-\d{2}-\d{4}')
    sample_dirs = [opts.outdir_txt2img_samples, opts.outdir_img2img_samples, opts.outdir_extras_samples]
    grid_dirs = [opts.outdir_txt2img_grids, opts.outdir_img2img_grids]
    etc_dirs = [opts.outdir_save, opts.outdir_init_images]

    outdir_samples = [p for p in Path(opts.outdir_samples).iterdir() if dates.fullmatch(p.name)] if opts.outdir_samples else []
    outdir_grids = [p for p in Path(opts.outdir_grids).iterdir() if dates.fullmatch(p.name)] if opts.outdir_grids else []
    outdir_extras = [Path(opts.outdir_samples)] if opts.outdir_samples else []

    outpath = (outdir_samples + outdir_grids + outdir_extras + [Path(d) for d in sample_dirs + grid_dirs + etc_dirs if d])

    def listing():
        dirs = [d for d in outpath if d.exists() and d.is_dir()]
        f = []

        for d in dirs:
            if d in outdir_extras: f.extend([p for p in d.glob('*') if p.suffix.lower() in imgEXT])
            else: f.extend([p for p in d.rglob('*') if p.suffix.lower() in imgEXT])

        f.sort(key=lambda p: p.stat().st_mtime_ns)
        getThumbnail(f)

        r = []
        for fp in f:
            src = str(fp.parent)
            if src == opts.outdir_save: query = '?save'
            elif src == opts.outdir_init_images: query = '?init'
            elif fp.parent in outdir_extras: query = '?extras'
            else: query = ''

            r.append({
                'path': f'{BASE}image={getPath(fp)}{query}',
                'thumb': f'{BASE}thumb={getPath(fp.with_suffix(""))}.jpeg',
                'name': fp.name
            })

        global imgList
        imgList_List.clear()
        imgList.clear()
        imgList.extend(r)
        imgList_List.set()

    threading.Thread(target=listing, daemon=True).start()

def GalleryApp(_: gr.Blocks, app: FastAPI):
    global imgList
    getImage()

    headers = {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': (datetime.now() + timedelta(days=365)).strftime('%a, %d %b %Y %H:%M:%S GMT')
    }

    @app.get(BASE + 'initial')
    async def _():
        try:
            r = await asyncio.to_thread(imgList_List.wait, 3)
            if not r: return {'status': 'waiting'}
            return {'images': imgList}
        except Exception as e:
            return responses.JSONResponse(status_code=500, content={'error': 'Server error', 'detail': str(e)})

    @app.get(BASE + 'thumb={img:path}')
    async def _(img: Path):
        return responses.Response(content=Thumbnails.get(getPath(img)), headers=headers, media_type='image/jpeg')

    @app.get(BASE + 'image={img:path}')
    async def _(img: str):
        fp = Path(unquote(img))
        media_type, _ = mimetypes.guess_type(fp)
        return responses.FileResponse(fp, headers=headers, media_type=media_type)

    @app.get(BASE + 'new-image')
    async def _():
        r = []
        images = list(imgNew)

        for img in images:
            fp = Path(img)
            asyncio.create_task(asyncio.to_thread(getThumbnail, fp))

            r.append({
                'path': f'{BASE}image={getPath(fp)}',
                'thumb': f'{BASE}thumb={getPath(fp.with_suffix(""))}.jpeg',
                'name': fp.name
            })

            imgNew.remove(img)

        return {'images': r}

    def on_saved(params):
        path = str(Path(params.filename).absolute())
        imgNew.append(path)
        imgList.append({'path': path})
        imgList_List.set()

    on_image_saved(on_saved)

    def deleting(path: Path, thumb: Path, perm: bool):
        global imgList
        if path.exists():
            try:
                path.unlink() if perm else send2trash(path)
                Thumbnails.pop(thumb.name, None)
                imgList = [img for img in imgList if unquote(img['path'].split('-image=')[-1].split('?')[0]) != path.as_posix()]
                return True
            except Exception as e:
                print(f'Error deleting {path}: {e}')
                return False
        return False

    @app.post(BASE + 'delete')
    async def _(req: Request):
        d = await req.json()
        path = Path(d.get('path'))
        thumb = Path(unquote(d.get('thumb', '')))
        perm = d.get('permanent', False)
        return {'status': 'deleted' if deleting(path, thumb, perm) else 'error'}

    @app.post(BASE + 'batch-delete')
    async def _(req: Request):
        d = await req.json()
        perm = d[0].get('permanent', False) if d else False

        for i in d:
            path = Path(i.get('path'))
            thumb = Path(unquote(i.get('thumb', '')))
            deleting(path, thumb, perm)

        return {'status': 'deleted'}

    if insecureENV:
        @app.get(BASE + 'imgChest')
        async def _():
            privacy, nsfw, api = Loadimgchest()
            return {'privacy': privacy, 'nsfw': nsfw, 'api-key': api}

    @app.get(BASE + 'load-setting')
    async def _():
        d = LoadConfig()
        default = {
            'images-per-page': 100,
            'thumbnail-shape': 'aspect_ratio',
            'thumbnail-position': 'center',
            'thumbnail-layout': 'masonry',
            'thumbnail-size': 240,
            'show-filename': False,
            'show-buttons': False,
            'image-info-layout': 'full_width',
            'single-delete-permanent': False,
            'single-delete-suppress-warning': False,
            'batch-delete-permanent': False,
            'batch-delete-suppress-warning': False,
            'switch-tab-suppress-warning': False
        }

        return {**default, **d.get('Gallery', {})}

    @app.post(BASE + 'save-setting')
    async def _(req: Request):
        c = await req.json()
        d = LoadConfig()
        d['Gallery'] = c
        config.write_text(json.dumps(d, indent=4), encoding='utf-8')
        return {'status': 'saved'}

def GalleryTab():
    if insecureENV:
        with gr.Column(elem_id='SDHub-Gallery-ImgChest-Column'):
            with gr.Column(elem_id='SDHub-Gallery-ImgChest-Wrapper'):
                gr.HTML(
                    'Auto Upload to <a class="sdhub-gallery-imgchest-info" '
                    'href="https://imgchest.com" target="_blank"> imgchest.com</a>',
                    elem_id='SDHub-Gallery-ImgChest-Info'
                )

                gr.Checkbox(label='Click To Enable', elem_id='SDHub-Gallery-ImgChest-Checkbox')

                with FormRow():
                    privacyset = gr.Radio(
                        ['Hidden', 'Public'],
                        value='Hidden',
                        label='Privacy',
                        interactive=True,
                        elem_id='SDHub-Gallery-ImgChest-Privacy',
                        elem_classes='sdhub-radio'
                    )

                    nsfwset = gr.Radio(
                        ['True', 'False'],
                        value='True',
                        label='NSFW',
                        interactive=True,
                        elem_id='SDHub-Gallery-ImgChest-NSFW',
                        elem_classes='sdhub-radio'
                    )

                apibox = gr.Textbox(
                    show_label=False,
                    interactive=True,
                    placeholder='imgchest API key',
                    max_lines=1,
                    elem_id='SDHub-Gallery-ImgChest-API',
                    elem_classes='sdhub-input'
                )

                with FormRow(elem_classes='sdhub-row'):
                    savebtn = gr.Button(
                        'Save',
                        variant='primary',
                        elem_id='SDHub-Gallery-ImgChest-Save-Button',
                        elem_classes='sdhub-buttons'
                    )

                    loadbtn = gr.Button(
                        'Load',
                        variant='primary',
                        elem_id='SDHub-Gallery-ImgChest-Load-Button',
                        elem_classes='sdhub-buttons'
                    )

            savebtn.click(fn=Saveimgchest, inputs=[privacyset, nsfwset, apibox], outputs=[privacyset, nsfwset, apibox])
            loadbtn.click(fn=Loadimgchest, inputs=[], outputs=[privacyset, nsfwset, apibox])

    with gr.TabItem('Gallery', elem_id='SDHub-Gallery-Tab'):
        with FormRow(equal_height=False, elem_id='SDHub-Gallery-Imageinfo-Row'):
            with FormColumn(variant='compact', scale=3, elem_id='SDHub-Gallery-Imageinfo-Image-Column'):
                image = gr.Image(elem_id='SDHub-Gallery-Imageinfo-img', type='pil', show_label=False)
                image.change(fn=None, _js='() => SDHubGalleryParser()')

                with FormRow(variant='compact', elem_id='SDHub-Gallery-Imageinfo-SendButton'):
                    buttons = tempe.create_buttons(['txt2img', 'img2img', 'inpaint', 'extras'])

            with FormColumn(variant='compact', scale=7, elem_id='SDHub-Gallery-Imageinfo-Output-Panel'):
                geninfo = gr.Textbox(elem_id='SDHub-Gallery-Imageinfo-Geninfo', visible=False)
                gr.HTML(elem_id='SDHub-Gallery-Imageinfo-HTML')

        for tabname, button in buttons.items():
            tempe.register_paste_params_button(
                tempe.ParamBinding(
                    paste_button=button,
                    tabname=tabname,
                    source_text_component=geninfo,
                    source_image_component=image
                )
            )

        with FormColumn(elem_id='SDHub-Gallery-Batch-Column', visible=False):
            def zipping(j):
                try: p = json.loads(j)
                except Exception: return None, ''

                ts = datetime.now().strftime('-%S%f')[:-3]
                name = f"{p.get('name').strip()}{ts}"
                img = p.get('images', [])

                fp = [Path(i['path']) for i in img if Path(i['path']).exists()]
                if not fp: return None, ''

                temp = tempfile.mkdtemp()
                zp = Path(temp) / f'{name}.zip'

                with zipfile.ZipFile(zp, 'w') as z:
                    for f in fp: z.write(f, arcname=f.name)

                return str(zp), str(zp)

            def deleting(t):
                if not t: return
                temp = Path(t)
                if temp.exists(): temp.unlink()

            t = gr.Textbox()
            b = gr.Button(elem_id='SDHub-Gallery-Batch-Button')
            b.click(deleting, t)

            f = gr.File(file_count='single', interactive=False, elem_id='SDHub-Gallery-Batch-File')
            f.change(None, _js="() => SDHubGalleryBatchDownload('onchange')")

            p = gr.Textbox(elem_id='SDHub-Gallery-Batch-Path')
            p.change(zipping, p, [f, t])