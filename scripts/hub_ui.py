import gradio as gr
from modules.ui_components import FormRow, FormColumn
from modules.script_callbacks import on_ui_tabs

from sd_hub.tokenizer import load_token, save_token
from sd_hub.downloader import downloader, read_txt
from sd_hub.archiver import archive, extract
from sd_hub.uploader import uploader
from sd_hub.paths import SDPaths
from sd_hub.scraper import scraper
from sd_hub.infotext import dl_title, dl_info, upl_title, upl_info, arc_info, sdhub_repo

def onSDHUBloaded():
    token1, token2, token3, _, _ = load_token()

    with gr.Blocks(analytics_enabled=False) as sdhub, gr.Tabs():
        with gr.TabItem("Downloader", elem_id="sdhub-downloader"):
            gr.HTML(dl_title)

            with FormRow():
                with FormColumn(scale=7):
                    gr.HTML(dl_info)

                with FormColumn(scale=3):
                    dl_token1 = gr.TextArea(
                        value=token2,
                        label="Huggingface Token (READ)",
                        lines=1,
                        max_lines=1,
                        placeholder="Your Huggingface Token here (role = READ)",
                        interactive=True,
                        elem_id="sdhub-downloader-token1"
                    )

                    dl_token2 = gr.TextArea(
                        value=token3,
                        label="Civitai API Key",
                        lines=1,
                        max_lines=1,
                        placeholder="Your Civitai API Key here",
                        interactive=True,
                        elem_id="sdhub-downloader-token1"
                    )

                    with FormRow():
                        dl_save = gr.Button(value="SAVE", variant="primary", min_width=0)
                        dl_load = gr.Button(value="LOAD", variant="primary", min_width=0)

            dl_input = gr.Textbox(
                show_label=False,
                lines=5,
                placeholder="$tag\nURL",
                elem_id="sdhub-downloader-inputs"
            )

            with FormRow(elem_id="sdhub-downloader-button-row"):
                with FormColumn(scale=1):
                    dl_dl = gr.Button("DOWNLOAD", variant="primary")

                with FormColumn(scale=1), FormRow(variant="compact"):
                    dl_scrape = gr.Button("Scrape", variant="secondary", min_width=0)
                    dl_txt = gr.UploadButton(
                        label="Insert TXT",
                        variant="secondary",
                        file_count="single",
                        file_types=[".txt"],
                        min_width=0
                    )

                with FormColumn(scale=2, variant="compact"):
                    dl_out1 = gr.Textbox(show_label=False, interactive=False, max_lines=1)
                    dl_out2 = gr.TextArea(show_label=False, interactive=False, lines=5)

            dl_load.click(
                fn=load_token,
                inputs=[],
                outputs=[dl_out2, dl_token1, dl_token2, dl_out2]
            )

            dl_save.click(
                fn=lambda token2, token3: save_token(None, token2, token3),
                inputs=[dl_token1, dl_token2],
                outputs=dl_out2
            )

            dl_dl.click(
                fn=downloader,
                inputs=[dl_input, dl_token1, dl_token2, gr.State()],
                outputs=[dl_out1, dl_out2]
            )

            dl_txt.upload(
                fn=read_txt,
                inputs=[dl_txt, dl_input],
                outputs=dl_input
            )

            dl_scrape.click(
                fn=scraper,
                inputs=[dl_input, dl_token1, gr.State()],
                outputs=[dl_input, dl_out2]
            )

        with gr.TabItem("Uploader", elem_id="sdhub-uploader"):
            gr.HTML(upl_title)

            with FormRow():
                with FormColumn(scale=7):
                    gr.HTML(upl_info)

                with FormColumn(scale=3):
                    gr.Textbox(visible=False, max_lines=1)
                    upl_token = gr.TextArea(
                        value=token1,
                        label="Huggingface Token (WRITE)",
                        lines=1,
                        max_lines=1,
                        placeholder="Your Huggingface Token here (role = WRITE)",
                        interactive=True,
                        elem_id="sdhub-uploader-token"
                    )

                    with FormRow():
                        upl_save = gr.Button(value="SAVE", variant="primary", min_width=0)
                        upl_load = gr.Button(value="LOAD", variant="primary", min_width=0)                               

            with FormRow():
                user_box = gr.Textbox(
                    max_lines=1,
                    placeholder="Username",
                    label="Username",
                    elem_id="sdhub-uploader-username-box"
                )

                repo_box = gr.Textbox(
                    max_lines=1,
                    placeholder="Repository",
                    label="Repository",
                    elem_id="sdhub-uploader-repo-box"
                )

                branch_box = gr.Textbox(
                    value="main",
                    max_lines=1,
                    placeholder="Branch",
                    label="Branch",
                    elem_id="sdhub-uploader-branch-box"
                )

                repo_radio = gr.Radio(
                    ["Public", "Private"],
                    value="Private",
                    label="Visibility",
                    interactive=True,
                    elem_id="sdhub-uploader-radio-box"
                )

                gr.Textbox(
                    max_lines=1,
                    show_label=False,
                    elem_id="sdhub-uploader-ghost-box",
                    elem_classes="hide-this"
                )

            upl_inputs = gr.Textbox(
                elem_id="sdhub-uploader-inputs",
                show_label=False,
                lines=5,
                placeholder="Input File Path"
            )

            with FormRow(elem_id="sdhub-uploader-button-row"):
                with FormColumn(scale=1):
                    upl_btn = gr.Button("UPLOAD", variant="primary")

                with FormColumn(scale=1):
                    gr.Button("hantu", variant="primary", elem_classes="hide-this")

                with FormColumn(scale=2, variant="compact"):
                    upl_output1 = gr.Textbox(show_label=False, interactive=False, max_lines=1)
                    upl_output2 = gr.Textbox(show_label=False, interactive=False, lines=5)

            upl_load.click(
                fn=load_token,
                inputs=[],
                outputs=[upl_token, upl_output2, upl_output2, upl_output2]
            )

            upl_save.click(
                fn=lambda token1: save_token(token1, None, None),
                inputs=[upl_token],
                outputs=upl_output2
            )

            upl_btn.click(
                fn=uploader,
                inputs=[upl_inputs, user_box, repo_box, branch_box, upl_token, repo_radio, gr.State()],
                outputs=[upl_output1, upl_output2]
            )

        with gr.TabItem("Archiver", elem_id="sdhub-archiver", elem_classes="tabs"):
            with gr.Accordion("ReadMe", open=False):
                gr.HTML(arc_info)

            gr.HTML("""<h3 style='font-size: 17px;'>Archive</h3>""")
            arc_format = gr.Radio(
                ["tar.lz4", "tar.gz", "zip"],
                value="tar.lz4",
                label="Format",
                interactive=True
            )

            arc_split = gr.Radio(
                ["None", "2", "3", "4", "5"],
                value="None",
                label="Split by",
                interactive=True
            )

            with FormRow():
                arc_name = gr.Textbox(
                    max_lines=1,
                    placeholder="Name",
                    show_label=False,
                    elem_id="sdhub-archiver-arc-inputname"
                )

                gr.Textbox("hantu", max_lines=1, show_label=False, elem_classes="hide-this")

            with gr.Column(elem_classes="arc-row"):
                arc_in = gr.Textbox(
                    max_lines=1,
                    placeholder="Input Path",
                    show_label=False,
                    elem_id="sdhub-archiver-arc-inputpath"
                )

                arc_out = gr.Textbox(
                    max_lines=1,
                    placeholder="Output Path",
                    show_label=False,
                    elem_id="sdhub-archiver-arc-outputpath"
                )

            with gr.Row(elem_classes="arc-row"):
                with gr.Column():
                    with gr.Row():
                        arc_run = gr.Button("Compress", variant="primary")
                        mkdir_cb1 = gr.Checkbox(label="Create Directory", elem_classes="cb")

                with gr.Column():
                    arc_output1 = gr.Textbox(show_label=False, interactive=False, max_lines=1)
                    arc_output2 = gr.Textbox(show_label=False, interactive=False, lines=5)

            gr.HTML("""<h3 style='font-size: 17px;'>Extract</h3>""")
            extr_in = gr.Textbox(
                max_lines=1,
                placeholder="Input Path",
                show_label=False,
                elem_id="sdhub-archiver-extr-inputpath"
            )

            extr_out = gr.Textbox(
                max_lines=1,
                placeholder="Output Path",
                show_label=False,
                elem_id="sdhub-archiver-extr-outputpath"
            )

            with gr.Row(elem_classes="arc-row"):
                with gr.Column():
                    with gr.Row():
                        extr_btn = gr.Button(
                            "Decompress",
                            variant="primary",
                            elem_classes="sdhub-archiver-extract-button"
                        )

                        mkdir_cb2 = gr.Checkbox(label="Create Directory", elem_classes="cb")
                    
                with gr.Column():
                    gr.Textbox(
                        show_label=False,
                        interactive=False,
                        max_lines=1,
                        elem_classes="hide-this"
                    )

            arc_run.click(
                fn=archive,
                inputs=[arc_in, arc_name, arc_out, arc_format, mkdir_cb1, arc_split, gr.State()],
                outputs=[arc_output1, arc_output2]
            )

            extr_btn.click(
                fn=extract,
                inputs=[extr_in, extr_out, mkdir_cb2, gr.State()],
                outputs=[arc_output1, arc_output2]
            )

        with gr.Accordion("Tag List", open=False, visible=True):
            gr.DataFrame(
                SDPaths.SDHubTagsAndPaths(),
                headers=["SD-Hub Tag", "WebUI Path"],
                datatype=["str", "str"],
                interactive=False,
                elem_id="sdhub-tag-dataframe"
            )

        gr.HTML(sdhub_repo)

    return (sdhub, "HUB", "sdhub"),

on_ui_tabs(onSDHUBloaded)
