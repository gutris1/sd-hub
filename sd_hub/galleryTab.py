import modules.generation_parameters_copypaste as tempe
from modules.ui_components import FormRow, FormColumn
from modules.paths_internal import data_path
from fastapi import FastAPI, staticfiles
from modules.shared import opts
from urllib.parse import quote
from datetime import datetime
from pathlib import Path
import gradio as gr
import tempfile
import sys
import os

imgEXT = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
out_dir = opts.outdir_samples or Path(data_path) / 'outputs'
root_dir = str(Path(out_dir).anchor) if sys.platform == 'win32' else "/"
imgLog = Path(tempfile.gettempdir()) / "sd-hub-gallery-initial-load.txt"
BASE = "/sd-hub-gallery"

def getTimeStamp():
    return datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")

def getInitial():
    if not out_dir.exists() or not any(out_dir.iterdir()):
        return []

    if imgLog.exists():
        with open(imgLog, "r", encoding="utf-8") as file:
            return [line.strip() for line in file.readlines()]

    img_paths = [
        path.resolve()
        for path in Path(out_dir).rglob("*")
        if path.suffix.lower() in imgEXT
    ]

    if not img_paths:
        return []

    sorted_img = sorted(img_paths, key=lambda p: os.path.getctime(p))
    formatted_img = [str(path) for path in sorted_img]

    with open(imgLog, "w", encoding="utf-8") as file:
        file.write("\n".join(formatted_img) + "\n")

    return formatted_img

class GalleryState:
    def __init__(self):
        self.path_list = []
        self.initial_list = []

Gallery = GalleryState()

def GalleryGallery(app: FastAPI):
    app.mount(BASE, staticfiles.StaticFiles(directory=root_dir, html=True), name="sd-hub-gallery")

    @app.get("/sd-hub-gallery-initial")
    async def initialLoad():
        Gallery.initial_list = getInitial()

        return {"images": [{"path": f"/sd-hub-gallery{quote(str(path))}"} for path in Gallery.initial_list]}

    @app.get("/sd-hub-gallery-list")
    async def getImage():
        img_paths = [
            path.resolve()
            for path in Path(out_dir).rglob("*")
            if path.suffix.lower() in imgEXT
        ]

        newest = []
        for path in img_paths:
            if str(path) not in Gallery.initial_list:
                when = os.path.getctime(path)
                newest.append((when, path))

        if newest:
            newest.sort(key=lambda x: x[0], reverse=True)
            sorted_paths = [str(path) for _, path in newest]

            Gallery.initial_list.extend(sorted_paths)
            Gallery.path_list = sorted_paths + Gallery.path_list

            return {"images": [{"path": f"/sd-hub-gallery{quote(path)}"} for path in sorted_paths]}

        return {"images": []}

    @app.post("/clear-gallery-list")
    async def clearList():
        Gallery.path_list = []
        return {}

def GalleryAPI(_: gr.Blocks, app: FastAPI):
    GalleryGallery(app)

def GalleryTab():
    with gr.TabItem("Gallery", elem_id="sdhub-gallery-tab"):
        with FormRow(equal_height=False, elem_id="sdhub-gallery-image-info-row"):
            with FormColumn(variant="compact"):
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
