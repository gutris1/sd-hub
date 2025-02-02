import modules.generation_parameters_copypaste as tempe 
from modules.ui_components import FormRow, FormColumn
from modules.paths_internal import data_path
from modules.shared import opts
from pathlib import Path
import gradio as gr
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from urllib.parse import unquote, quote
import sys
from fastapi.responses import FileResponse

image_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
outputs_dir = opts.outdir_samples or Path(data_path) / 'outputs'
root_dir = str(Path(outputs_dir).anchor) if sys.platform == 'win32' else "/"
BASE = "/sd-hub-gallery"

def getimg():
    if not outputs_dir.exists():
        return []

    return [
        path.resolve()
        for path in Path(outputs_dir).rglob("*")
        if path.suffix.lower() in image_extensions
    ]

def GalleryAPI(app: FastAPI):
    app.mount(BASE, StaticFiles(directory=root_dir, html=True), name="sd-hub-gallery")
    endpoint = '/' + req.scope.get('path', 'err').strip('/')

    @app.middleware("http")
    async def logimg(req: Request, call_next):
        if endpoint.startswith('/file='):
            fp = Path(unquote(endpoint[6:]))
            if fp.suffix.lower() in image_extensions:
                print(f"img : {fp}")

        return await call_next(req)

    @app.middleware("http")
    async def loglog(req: Request, call_next):
        method = req.method
        print(f"Request Method: {method}, Path: {endpoint}")

        fp = Path(endpoint)
        if fp.suffix.lower() in image_extensions:
            print(f"Image request: {fp}")

        return await call_next(req)

    @app.get("/sd-hub-gallery-initial")
    async def initialLoad():
        image_paths = getimg()
        return {"image_paths": [
            f"{BASE}{quote(str(path).lstrip('/'))}" if sys.platform == 'win32' else f"{BASE}{quote(str(path))}"
            for path in image_paths
        ]}

def GalleryGallery(_: gr.Blocks, app: FastAPI):
    GalleryAPI(app)

def SDHubGallery():
    with gr.TabItem("Gallery", elem_id="sdhub-gallery-tab"):
        gr.Textbox(elem_id="sdhub-gallery-imginitial", visible=False)
        imgpath = gr.Textbox(elem_id="sdhub-gallery-imgpath", visible=False)

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
                geninfo = gr.Textbox(
                    elem_id="SDHubimgInfoGenInfo",
                    visible=False
                )

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
