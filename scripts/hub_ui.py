from modules import script_callbacks
from scripts import hub_version
from scripts.hub_tokenizer import load_token, save_token
from scripts.hub_downloader import downloader, read_txt
from scripts.hub_archiver import archive, extract
from scripts.hub_folder import paths_paths
from scripts.hub_uploader import uploader
from scripts.hub_scraper import scraper
import gradio as gr

token1, token2, token3, _, _ = load_token()

def on_ui_tabs():    
    with gr.Blocks() as hub, gr.Tabs():
        
        with gr.TabItem("  Downloader  ", elem_id="hub-dl"):
            gr.Markdown(f"""<div style='text-align: center;'><h3 style='font-size: 18px;'>🔽 Download Command Center</h3></div>""")
            with gr.Row():
                with gr.Column(scale=7):
                    gr.Markdown(f"""<p>
                    
                    Enter your **Huggingface Token** with the role **READ** to download from your private repo. Get one <code>[Here](https://huggingface.co/settings/tokens)</code>
                    Enter your **Civitai API Key** if you encounter an Authorization failed error. Get your key <code>[Here](https://civitai.com/user/account)</code>
                    Save = To automatically load token upon Reload UI or relaunch of Stable Diffusion Webui.
                    Load = Load token.

                    Supported Domains: <code>Civitai</code> • <code>Huggingface</code> • <code>Github</code> • <code>Drive.Google</code>
                    See usage <code>[Here](https://github.com/gutris1/sd-hub/blob/master/README.md#downloader)</code>
                    </p>""")
                with gr.Column(scale=3):
                    dl_token1 = gr.Textbox(value=token2, label="Huggingface Token (READ)", max_lines=1,
                                           placeholder="Your Huggingface Token here (role = READ)", interactive=True)
                    dl_token2 = gr.Textbox(value=token3, label="Civitai API Key", max_lines=1,
                                           placeholder="Your Civitai API Key here", interactive=True)
                    
                    with gr.Row(scale=1, elem_id="btn"):
                        dl_save = gr.Button(value="SAVE", variant="primary", elem_classes="btn")
                        dl_load = gr.Button(value="LOAD", variant="primary", elem_classes="btn")

            with gr.Row():
                dl_input = gr.Textbox(label="Input", lines=5, placeholder="$tag\nURL", elem_classes="dl-input")

            with gr.Row(elem_classes="dl-row"):
                with gr.Column(scale=1):
                    dl_dl = gr.Button("DOWNLOAD", variant="primary")
                    
                with gr.Column(scale=1):
                    scrape_btn = gr.Button("Scrape", variant="secondary")
                    dl_txt = gr.UploadButton(label="Insert TXT", variant="secondary", file_count="single", file_types=[".txt"], elem_classes="dl-row")
                        
                with gr.Column(scale=2):
                    dl_out1 = gr.Textbox(show_label=False, interactive=False, visible=True, max_lines=1)
                    dl_out2 = gr.TextArea(show_label=False, interactive=False, visible=True, lines=5)
                    
            dl_load.click(fn=load_token, inputs=[], outputs=[dl_out2, dl_token1, dl_token2, dl_out2])
            dl_save.click(fn=lambda token2, token3: save_token(None, token2, token3), inputs=[dl_token1, dl_token2], outputs=dl_out2)
            dl_dl.click(fn=downloader, inputs=[dl_input, dl_token1, dl_token2, gr.State()], outputs=[dl_out1, dl_out2])
            dl_txt.upload(fn=read_txt, inputs=dl_txt, outputs=dl_input)
            scrape_btn.click(fn=scraper, inputs=[dl_input, dl_token1, gr.State()], outputs=[dl_input, dl_out2])
                
        with gr.TabItem("  Uploader  ", elem_id="hub-up"):
            gr.Markdown(f"""<div style='text-align: center;'><h3 style='font-size: 18px;'>🤗 Upload To Huggingface</h3></div>""")
            with gr.Row():
                with gr.Column(scale=7):
                    gr.Markdown(f"""<p>
                    
                    **Colab**: /content/stable-diffusion-webui/model.safetensors
                    **Kaggle**: /kaggle/working/stable-diffusion-webui/model.safetensors
                    **Sagemaker Studio Lab**: /home/studio-lab-user/stable-diffusion-webui/model.safetensors

                    Get your **Huggingface Token** with the role **WRITE** from <code>[Here](https://huggingface.co/settings/tokens)</code>
                    See usage <code>[Here](https://github.com/gutris1/sd-hub/blob/master/README.md#uploader)</code>
                    </p>""")
                with gr.Column(scale=3):
                    gr.Textbox(visible=False, max_lines=1)
                    up_token = gr.Textbox(value=token1, label="Huggingface Token (WRITE)", max_lines=1,
                                          placeholder="Your Huggingface Token here (role = WRITE)", interactive=True)

                    with gr.Row(scale=1, elem_id="btn"):
                        up_save = gr.Button(value="SAVE", variant="primary", scale=1, elem_classes="btn")
                        up_load = gr.Button(value="LOAD", variant="primary", scale=1, elem_classes="btn")                               

            with gr.Row(scale=1, elem_classes="up-row"):
                user_box = gr.Textbox(max_lines=1, placeholder="Username", label="Username", scale=1)
                repo_box = gr.Textbox(max_lines=1, placeholder="Repository", label="Repository", scale=1)
                branch_box = gr.Textbox(value="main", max_lines=1, placeholder="Branch", label="Branch", elem_classes="up-btn", scale=1)
                repo_radio = gr.Radio(["Public", "Private"], value="Private", label="Visibility", interactive=True, scale=1)
                gr.Textbox(max_lines=1, show_label=False, scale=2, elem_classes="hide-this")


            with gr.Row():
                with gr.Column():
                    up_inputs = gr.Textbox(show_label=False, lines=5, placeholder="Input File Path", elem_classes="up-input")

            with gr.Row(elem_classes="up-row"):
                with gr.Column(scale=1):
                    with gr.Row():
                        up_btn = gr.Button("UPLOAD", variant="primary")
                        hantu = gr.Button("hantu", variant="primary", elem_classes="hide-this")

                with gr.Column(scale=1):
                    up_output1 = gr.Textbox(show_label=False, interactive=False, max_lines=1)
                    up_output2 = gr.Textbox(show_label=False, interactive=False, lines=5)
                
            up_load.click(fn=load_token, inputs=[], outputs=[up_token, up_output2, up_output2, up_output2])
            up_save.click(fn=lambda token1: save_token(token1, None, None), inputs=[up_token], outputs=up_output2)
            up_btn.click(fn=uploader, inputs=[up_inputs, user_box, repo_box, branch_box, up_token, repo_radio, gr.State()],
                         outputs=[up_output1, up_output2])
        
        with gr.TabItem("  Archiver  ", elem_id="hub-arc", elem_classes="tabs"):
            gr.Markdown(f"""<p>
            Supported Format: <code>tar.lz4</code> • <code>tar.gz</code> • <code>zip</code>
            
            for Archive:
            Name = name for the compressed file (excluding the file extension)
            Input Path = path pointing a single file or folder containing multiple files
            Output Path = path where the compressed file will be saved
            Create Directory Checkbox = to create a new folder corresponding to the Output Path if it does not exist
            
            for Extract:
            Input Path = path pointing to a compressed file
            Output Path = path where the uncompressed file will be extract
            Create Directory Checkbox = to create a new folder corresponding to the Output Path if it does not exist</p>
            """)
            with gr.Row():
                gr.Markdown(f"""<div><h3 style='font-size: 17px;'>Archive</h3></div>""", scale=1)
                arc_radio = gr.Radio(["tar.lz4", "tar.gz", "zip"], value="tar.lz4", show_label=False, interactive=True, scale=1)
                hantu = gr.Textbox("hantu", max_lines=1, show_label=False, elem_classes="hide-this", scale=3)
                    
            with gr.Row(elem_classes="arc-input"):
                arc_name = gr.Textbox(max_lines=1, placeholder="Name", show_label=False)
                hantu = gr.Textbox("hantu", max_lines=1, show_label=False, elem_classes="hide-this")

            with gr.Column(elem_classes="arc-row"):
                arc_in = gr.Textbox(max_lines=1, placeholder="Input Path", show_label=False)
                arc_out = gr.Textbox(max_lines=1, placeholder="Output Path", show_label=False)

            with gr.Row(elem_classes="arc-row"):
                with gr.Column():
                    with gr.Row():
                        arc_run = gr.Button("Compress", variant="primary", elem_classes="arc-btn")
                        gr.Checkbox(label="", default=False, show_label=True, scale=1, elem_classes="hide-this")
                        mkdir_cb1 = gr.Checkbox(label="Create Directory", default=False, show_label=True, scale=1)

                with gr.Column():
                    arc_output1 = gr.Textbox(show_label=False, interactive=False, max_lines=1)
                    arc_output2 = gr.Textbox(show_label=False, interactive=False, lines=5)

            gr.Markdown(f"""<div><h3 style='font-size: 17px;'>Extract</h3></div>""")
            with gr.Column(elem_classes="arc-input"):
                extr_in = gr.Textbox(max_lines=1, placeholder="Input Path", show_label=False)
                extr_out = gr.Textbox(max_lines=1, placeholder="Output Path", show_label=False)

            with gr.Row(elem_classes="arc-row"):
                with gr.Column():
                    with gr.Row():
                        extr_btn = gr.Button("Decompress", variant="primary", elem_classes="arc-btn")
                        gr.Checkbox(label="", default=False, show_label=True, scale=1, elem_classes="hide-this")
                        mkdir_cb2 = gr.Checkbox(label="Create Directory", default=False, show_label=True, scale=1)
                    
                with gr.Column():
                    gr.Textbox(show_label=False, interactive=False, max_lines=1, elem_classes="hide-this")
                    
            arc_run.click(fn=archive, inputs=[arc_in, arc_name, arc_out, arc_radio, mkdir_cb1, gr.State()], outputs=[arc_output1, arc_output2])
            extr_btn.click(fn=extract, inputs=[extr_in, extr_out, mkdir_cb2, gr.State()], outputs=[arc_output1, arc_output2])
            
        with gr.Accordion("Tag List", open=False, visible=True):
            gr.DataFrame(paths_paths(), headers=["Tag", "Path"], datatype=["str", "str"], interactive=False)
            
        gr.HTML(f"""<div style="text-align: center; font-size: 12px;">
        <h4><a href="https://github.com/gutris1/sd-hub" style="color: gray;">SD-Hub • v{hub_version.version}</a></h4>""")
        
        hub.load(fn=load_token, inputs=[], outputs=[up_token, dl_token1, dl_token2, dl_out2, up_output2])
        
    return (hub, "Hub", "hub"),

script_callbacks.on_ui_tabs(on_ui_tabs)
print(f"▶ SD-Hub: v{hub_version.version}")