import modules.generation_parameters_copypaste as tempe # type: ignore
from modules.ui_components import FormRow, FormColumn
from fastapi import FastAPI, HTTPException, responses
from modules.paths_internal import data_path
from modules.shared import opts
from urllib.parse import quote
from datetime import datetime
from pathlib import Path
from PIL import Image
import gradio as gr
import tempfile
import hashlib
import json
import sys

imgEXT = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
out_dir = opts.outdir_samples or Path(data_path) / 'outputs'
root_dir = str(Path(out_dir).anchor) if sys.platform == 'win32' else "/"
thumb_dir = Path(tempfile.gettempdir()) / "sd-hub-gallery-thumb"
thumb_dir.mkdir(exist_ok=True, parents=True)
img_list = thumb_dir / "img_list.json" 
BASE = "/sd-hub-gallery"

def getTimeStamp():
    return datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")

def getThumb(src: Path):
    ctime = src.stat().st_ctime
    hash = f"{src.name}{ctime}".encode('utf-8')
    sha = hashlib.sha256(hash).hexdigest()
    folder = thumb_dir / sha
    folder.mkdir(parents=True, exist_ok=True)
    thumb_name = f"thumb-{src.stem}.jpg"
    thumb_path = folder / thumb_name
    if not thumb_path.exists():
        with Image.open(src) as img:
            img.thumbnail((512, 512))
            img.convert("RGB").save(thumb_path, "JPEG", quality=85)
    return thumb_path

def getImageList():
    if img_list.exists() and img_list.stat().st_size > 0:
        return json.loads(img_list.read_text(encoding="utf-8"))
    return None

def getImage():
    img = [p for p in Path(out_dir).rglob("*") if p.suffix.lower() in imgEXT]
    if not img:
        return []

    img.sort(key=lambda p: p.stat().st_mtime)

    results = []
    for path in img:
        thumb_path = getThumb(path)
        results.append({
            "path": f"{BASE}/image{quote(str(path))}",
            "thumb": f"{BASE}/thumb/{quote(thumb_path.name)}"
        })

    img_list.write_text(json.dumps(results, indent=4), encoding="utf-8")
    return results

class GalleryState:
    def __init__(self):
        self.path_list = []
        self.initial_list = []

Gallery = GalleryState()

def GalleryGallery(app: FastAPI):
    headers = {"Cache-Control": "public, max-age=31536000"}

    @app.get("/sd-hub-gallery-initial")
    async def initialLoad():
        imgs = getImageList()
        if imgs is None:
            imgs = getImage()

        Gallery.initial_list = [img["path"] for img in imgs]
        return {"images": imgs}

    @app.get("/sd-hub-gallery-list")
    async def newImage():
        imgs = getImage()
        new = [img for img in imgs if img["path"] not in Gallery.initial_list]

        if new:
            Gallery.initial_list.extend([img["path"] for img in new])
            Gallery.path_list = [img["path"] for img in new] + Gallery.path_list
            img_list.write_text(json.dumps(imgs, indent=4), encoding="utf-8")

            return {"images": new}
        return {"images": []}

    @app.get("/sd-hub-gallery/image{img_path:path}")
    async def sendImage(img_path: str):
        fp = Path(img_path)
        if fp.exists():
            return responses.FileResponse(fp, headers=headers)
        raise HTTPException(status_code=404, detail="Image not found")

    @app.get("/sd-hub-gallery/thumb/{thumb_name}")
    async def sendThumb(thumb_name: str):
        for f in thumb_dir.iterdir():
            if f.is_dir():
                t = f / thumb_name
                if t.exists():
                    return responses.FileResponse(t, headers=headers)
        raise HTTPException(status_code=404, detail="Thumbnail not found")

def GalleryAPI(_: gr.Blocks, app: FastAPI):
    GalleryGallery(app)

def GalleryTab():
    with gr.TabItem("Gallery", elem_id="sdhub-gallery-tab"):
        with FormRow(equal_height=False, elem_id="sdhub-gallery-image-info-row"):
            with FormColumn(variant="compact", scale=3):
                image = gr.Image(
                    elem_id="SDHubimgInfoImage",
                    type="pil",
                    source="upload",
                    show_label=False
                )

                with FormColumn(variant="compact", elem_id="SDHubimgInfoSendButton"):
                    buttons = tempe.create_buttons(
                        ["txt2img", "img2img", "inpaint", "extras"]
                    )

            with FormColumn(variant="compact", scale=7, elem_id="SDHubimgInfoOutputPanel"):
                geninfo = gr.Textbox(elem_id="SDHubimgInfoGenInfo", visible=False)
                gr.HTML(elem_id="SDHubimgInfoHTML")

            for tabname, button in buttons.items():
                tempe.register_paste_params_button(
                    tempe.ParamBinding(
                        paste_button=button, 
                        tabname=tabname, 
                        source_text_component=geninfo, 
                        source_image_component=image
                    )
                )

            image.change(fn=None, _js="() => {SDHubGalleryParser();}")
