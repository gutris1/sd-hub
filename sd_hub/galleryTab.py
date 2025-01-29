import modules.generation_parameters_copypaste as tempe 
from modules.ui_components import FormRow, FormColumn
from modules.paths_internal import data_path
from modules.script_callbacks import on_ui_tabs, on_app_started
from modules.shared import cmd_opts, opts
from pathlib import Path
import gradio as gr

image_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
outputs_dir = opts.outdir_samples or Path(data_path) / 'outputs'

def get_image_paths():
    if not outputs_dir.exists():
        return []

    return [str(img) for img in outputs_dir.rglob('*') if img.suffix.lower() in image_extensions]

def SDHubGallery():
    pathimg = get_image_paths()

    with gr.TabItem("Gallery", elem_id="sdhub-gallery-tab", elem_classes="tabs"):
        #gr.HTML(elem_id="sdhub-gallery")
        gr.Textbox(pathimg, elem_id="sdhub-gallery-imginitial", visible=False)
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
