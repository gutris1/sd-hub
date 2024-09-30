dl_md = """<p>

Enter your **Huggingface Token** with the role **READ** to download from your private repo. Get one <code>[Here](https://huggingface.co/settings/tokens)</code><br>
Enter your **Civitai API Key** if you encounter an Authorization failed error. Get your key <code>[Here](https://civitai.com/user/account)</code><br>
Save = To automatically load token upon Reload UI or Webui launch<br>
Load = Load token<br>

Supported Domains: <code>Civitai</code> • <code>Huggingface</code> • <code>Github</code> • <code>Drive.Google</code><br>
See usage <code>[Here](https://github.com/gutris1/sd-hub/blob/master/README.md#downloader)</code></p>"""

upl_md = """<p>

**Colab**: /content/stable-diffusion-webui/model.safetensors<br>
**Kaggle**: /kaggle/working/stable-diffusion-webui/model.safetensors<br>
**Sagemaker Studio Lab**: /home/studio-lab-user/stable-diffusion-webui/model.safetensors<br>

Get your **Huggingface Token** with the role **WRITE** from <code>[Here](https://huggingface.co/settings/tokens)</code><br>
See usage <code>[Here](https://github.com/gutris1/sd-hub/blob/master/README.md#uploader)</code></p>"""

arc_md1 = """<p>

**Archive :**<br>
<code>Name</code> Name for the compressed file (excluding the file extension)<br>
<code>Input Path</code> Path pointing a single file or folder containing multiple files<br>
<code>Output Path</code> Path where the compressed file will be saved<br>
<code>Create Directory</code> Automatically creates a new folder at the Output Path if not already existing<br>
<code>Split by</code> Divide the compression into multiple files based on number of files in **Input Path**</p>"""

arc_md2 = """<p>

**Extract :**<br>
<code>Input Path</code> Path pointing to a compressed file<br>
<code>Output Path</code> Path where the compressed file will be extracted<br>
<code>Create Directory</code> Automatically creates a new folder at the Output Path if not already existing</p>"""