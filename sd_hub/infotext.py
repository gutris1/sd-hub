blt = "<strong>•</strong>"

dl_title = """
<h3 id="sdhub-tab-title">
  🔽 Download Command Center
</h3>
"""

dl_info = f"""
<p id="sdhub-tab-info">
  Enter your <strong>Huggingface Token</strong> with the role <strong>READ</strong> to download from your private repo. 
  Get one <a href="https://huggingface.co/settings/tokens" class="sdhub-link">Here</a><br>
  Enter your <strong>Civitai API Key</strong> if you encounter an Authorization failed error. Get your key 
  <a href="https://civitai.com/user/account" class="sdhub-link">Here</a><br>
  Save = To automatically load token upon Reload UI or Webui launch<br>
  Load = Load token<br>
  Supported Domains: {blt} <a class="sdhub-nonlink">Civitai</a> {blt} <a class="sdhub-nonlink">Huggingface</a> {blt} 
  <a class="sdhub-nonlink">Github</a> {blt} <a class="sdhub-nonlink">Drive.Google</a> {blt}<br>
  See usage <a href="https://github.com/gutris1/sd-hub/blob/master/README.md#downloader" class="sdhub-link">Here</a>
</p>
"""

upl_title = """
<h3 id="sdhub-tab-title">
  🤗 Upload To Huggingface
</h3>
"""

upl_info = """
<p id="sdhub-tab-info">
  <strong>Colab</strong>: /content/stable-diffusion-webui/model.safetensors<br>
  <strong>Kaggle</strong>: /kaggle/working/stable-diffusion-webui/model.safetensors<br>
  <strong>Sagemaker Studio Lab</strong>: /home/studio-lab-user/stable-diffusion-webui/model.safetensors<br>
  <br>
  Get your <strong>Huggingface Token</strong> with the role <strong>WRITE</strong> from
  <a href="https://huggingface.co/settings/tokens" class="sdhub-link">Here</a><br>
  See usage <a href="https://github.com/gutris1/sd-hub/blob/master/README.md#uploader" class="sdhub-link">Here</a>
  <br>
</p>
"""

arc_info = """
<p id="sdhub-tab-info">
  <strong>Archive</strong> :<br>
  <a class="sdhub-nonlink">Name</a> Name for the compressed file (excluding the file extension)<br>
  <a class="sdhub-nonlink">Input Path</a> Path pointing a single file or folder containing multiple files<br>
  <a class="sdhub-nonlink">Output Path</a> Path where the compressed file will be saved<br>
  <a class="sdhub-nonlink">Create Directory</a> To automatically creates a new folder at the Output Path if not already existing<br>
  <a class="sdhub-nonlink">Split by</a> Divide the compression into multiple files based on number of files in <strong>Input Path</strong><br>
  <br><br>
  <strong>Extract</strong> :<br>
  <a class="sdhub-nonlink">Input Path</a> Path pointing to a compressed file<br>
  <a class="sdhub-nonlink">Output Path</a> Path where the compressed file will be extracted<br>
  <a class="sdhub-nonlink">Create Directory</a> To automatically creates a new folder at the Output Path if not already existing<br>
  <br>
</p>
"""

from sd_hub.version import version

sdhub_repo = f"""
<h4 id="sdhub-repo">
  <a href="https://github.com/gutris1/sd-hub">
    SD-Hub • v{version}
  </a>
</h4>
"""

print(f"\033[38;5;208m▶\033[0m SD-Hub: \033[38;5;39mv{version}\033[0m")
