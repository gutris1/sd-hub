import modules.generation_parameters_copypaste as tempe 
from modules.ui_components import FormRow, FormColumn
from modules.paths_internal import data_path
from modules.shared import opts
from pathlib import Path
import gradio as gr
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from urllib.parse import unquote, quote

image_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
outputs_dir = opts.outdir_samples or Path(data_path) / 'outputs'

def getimg():
    if not outputs_dir.exists():
        return []

    return [
        path.resolve()
        for path in Path(outputs_dir).rglob("*")
        if path.suffix.lower() in image_extensions
    ]

BASE = "/sd-hub-gallery"
def hook(app: FastAPI):
    app.mount(BASE, StaticFiles(directory=outputs_dir, html=True), name="sd-hub-gallery")

    @app.middleware("http")
    async def img_outputs(req: Request, call_next):
        endpoint = '/' + req.scope.get('path', 'err').strip('/')

        if endpoint.startswith('/file='):
            file_path = Path(unquote(endpoint[6:])).resolve()

            if outputs_dir not in file_path.parents and outputs_dir != file_path.parent:
                return await call_next(req)

            ext = file_path.suffix.lower().split('?')[0]

            if ext in image_extensions:
                img = f"{BASE}/{file_path.as_posix().replace(str(outputs_dir), '').lstrip('/')}"
                thumb = f"{BASE}/thumbnail/{file_path.as_posix().replace(str(outputs_dir), '').lstrip('/')}"

                return Response(content=f"{img}", media_type="text/plain")
        return await call_next(req)

    @app.get("/sd-hub-gallery-initial")
    async def initialLoad():
        image_paths = getimg()
        return {"image_paths": [
            f"{BASE}/{quote(str(path).replace(str(outputs_dir), '').lstrip('/'))}"
            for path in image_paths
        ]}

def SDHubGallery():
    with gr.TabItem("Gallery", elem_id="sdhub-gallery-tab", elem_classes="tabs"):
        #gr.HTML(elem_id="sdhub-gallery")
        gr.Textbox(elem_id="sdhub-gallery-imginitial", visible=False)
        geninfo = gr.Textbox(elem_id="sdhub-gallery-geninfo", visible=False)

        imgpath = gr.Textbox(elem_id="sdhub-gallery-imgpath", visible=False)
        #imgpath.change(fn=None, _js="() => {SDHubGalleryImgPath();}")

        with FormColumn(variant="compact", visible=False):
            image = gr.Image(
                elem_id="sdhub-gallery-img-input",
                type="pil",
                source="upload",
                show_label=False
            )
        with FormColumn(variant="compact", visible=False, elem_id="sdhub-gallery-sendbutton-column"):
            buttons = tempe.create_buttons(
                ["txt2img", "img2img", "inpaint", "extras"]
            )

        for tabname, button in buttons.items():
            tempe.register_paste_params_button(
                tempe.ParamBinding(
                    paste_button=button, 
                    tabname=tabname, 
                    source_text_component=geninfo, 
                    source_image_component=imgpath
                )
            )

        image.change(fn=None, _js="() => {SDImageInfoParser();}")
