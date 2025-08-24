from fastapi import FastAPI, responses, Request, WebSocket
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from urllib.parse import quote, unquote
from send2trash import send2trash
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

import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from modules.cache import cache as Cache
from modules.shared import opts

from sdhub.config import config, LoadConfig, GalleryDefault
from sdhub.imgChest import imgChest

imgChestColumn, imgChestApp = imgChest()

BASE = '/sdhub-gallery'
imgEXT = ['.png', '.jpg', '.jpeg', '.webp', '.avif']

ws = []
imgList = []
imgList_List = threading.Event()
Thumbnails = {}

fav = Cache('sd-hub')
fap = '__sdhub-gallery__'

def getRawPath(path):
    return path.absolute().as_posix() if sys.platform == 'win32' else str(path.absolute())

def getPath(path):
    return quote(getRawPath(path))

def getOutpath():
    dates = re.compile(r'\d{2}-\d{2}-\d{4}')

    sample = [opts.outdir_txt2img_samples, opts.outdir_img2img_samples, opts.outdir_extras_samples]
    grid = [opts.outdir_txt2img_grids, opts.outdir_img2img_grids]
    etc = [opts.outdir_save, opts.outdir_init_images]

    outdir_samples = ([p for p in Path(opts.outdir_samples).iterdir() if dates.fullmatch(p.name)] if opts.outdir_samples else [])
    outdir_grids = ([p for p in Path(opts.outdir_grids).iterdir() if dates.fullmatch(p.name)] if opts.outdir_grids else [])
    outdir_extras = [Path(opts.outdir_samples)] if opts.outdir_samples else []

    outpath = (outdir_samples + outdir_grids + outdir_extras + [Path(d) for d in sample + grid + etc if d])

    return outdir_samples, outdir_grids, outdir_extras, outpath

def getEntry(fp, query=''):
    return {
        'path': f'{BASE}-image={getPath(fp)}{query}',
        'thumb': f'{BASE}-thumb={getPath(fp.with_suffix(""))}.jpeg',
        'name': fp.name,
    }

def getImage():
    _, _, outdir_extras, outpath = getOutpath()

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

            if fav.get(getRawPath(fp)): query += '&favorite' if query else '?favorite'

            r.append(getEntry(fp, query))

        global imgList
        imgList_List.clear()
        imgList.clear()
        imgList.extend(r)
        imgList_List.set()

    threading.Thread(target=listing, daemon=True).start()

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

async def WS(p):
    if not ws: return

    try:
        fp = Path(p)
        await asyncio.to_thread(getThumbnail, fp)
        s = getEntry(fp)

        imgList.append(s)
        imgList_List.set()
        r = json.dumps(s)

    except Exception as e:
        print(f'Error in WS: {e}')
        return

    w = ws[0]
    try:
        await w.send_text(r)
    except Exception as e:
        print(f'Error in WS: {e}')
        ws.remove(w)

def GalleryImg(params):
    try: asyncio.run(WS(str(Path(params.filename).absolute())))
    except Exception as e: print(f'Error : {e}')

def GalleryApp(_: gr.Blocks, app: FastAPI):
    global imgList
    getImage()

    headers = {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': (datetime.now() + timedelta(days=365)).strftime('%a, %d %b %Y %H:%M:%S GMT')
    }

    @app.get(BASE + '-initial')
    async def _():
        try:
            r = await asyncio.to_thread(imgList_List.wait, 3)
            if not r: return {'status': 'waiting'}

            i = []
            f = []
            fl = fav.get(fap, [])

            for img in imgList:
                r = getRawPath(Path(unquote(img['path'].split('=', 1)[-1].split('?')[0])))
                c = img.copy()
                fp = Path(r)

                if not fp.exists(): continue

                if r in fl:
                    if '?favorite' not in c['path'] and '&favorite' not in c['path']:
                        c['path'] += '&favorite' if '?' in c['path'] else '?favorite'
                    f.append(c)

                else:
                    c['path'] = re.sub(r'(\?|&)favorite', '', c['path'])

                i.append(c)

            pf = {getRawPath(Path(unquote(img['path'].split('=', 1)[-1].split('?')[0]))): img for img in f}
            f = [pf[p] for p in fl if p in pf]

            return {'images': i, 'favorites': f}

        except Exception as e:
            return responses.JSONResponse(status_code=500, content={'error': 'Server error', 'detail': str(e)})

    @app.get(BASE + '-thumb={img:path}')
    async def _(img: Path):
        return responses.Response(content=Thumbnails.get(getPath(img)), headers=headers, media_type='image/jpeg')

    @app.get(BASE + '-image={img:path}')
    async def _(img: str):
        fp = Path(unquote(img))
        media_type, _ = mimetypes.guess_type(fp)
        return responses.FileResponse(fp, headers=headers, media_type=media_type)

    @app.post(BASE + '-favorite')
    async def _(req: Request):
        d = await req.json()
        p = d.get('p')
        op = d.get('op')

        fl = fav.get(fap, [])

        if op == 'remove':
            fav.delete(p)
            if p in fl:
                fl.remove(p)
                fav.set(fap, fl)

        elif op == 'add':
            fav.set(p, True)
            if p in fl: fl.remove(p)
            fl.append(p)
            fav.set(fap, fl)

    def deleting(path: Path, thumb: Path, perm: bool):
        try:
            if path.exists(): path.unlink() if perm else send2trash(path)
            Thumbnails.pop(thumb, None)
            imgList[:] = [img for img in imgList if unquote(img['path'].split('-image=')[-1].split('?')[0]) != path.as_posix()]
            if str(path) in fav: del fav[str(path)]
            return True
        except Exception as e:
            print(f'Error deleting {path}: {e}')
            return False

    @app.post(BASE + '-delete')
    async def _(req: Request):
        d = await req.json()
        path = Path(d.get('path'))
        thumb = Path(unquote(d.get('thumb', '')))
        perm = d.get('permanent', False)
        return {'status': 'deleted' if deleting(path, thumb, perm) else 'error'}

    @app.post(BASE + '-batch-delete')
    async def _(req: Request):
        d = await req.json()
        perm = d[0].get('permanent', False) if d else False
        for p in d:
            path = Path(p.get('path'))
            thumb = Path(unquote(p.get('thumb', '')))
            deleting(path, thumb, perm)
        return {'status': 'deleted'}

    if imgChestApp: app.get(BASE + '-imgChest')(imgChestApp)

    @app.get(BASE + '-load-setting')
    async def _():
        d = LoadConfig()
        return {**GalleryDefault, **d.get('Gallery', {})}

    @app.post(BASE + '-save-setting')
    async def _(req: Request):
        c = await req.json()
        d = LoadConfig()
        d['Gallery'] = c
        config.write_text(json.dumps(d, indent=4), encoding='utf-8')
        return {'status': 'saved'}

    @app.websocket(BASE + '/w')
    async def _(w: WebSocket):
        await w.accept()
        ws.append(w)

        try:
            while True:
                msg = await w.receive_text()
                if msg == 'ping': await w.send_text('pong')
        except Exception:
            pass
        finally:
            if w in ws: ws.remove(w)

def GalleryTab():
    if imgChestColumn: imgChestColumn()

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