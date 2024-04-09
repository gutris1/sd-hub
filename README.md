# Overview
SD-Hub Extension for Stable Diffusion WebUI.<br>
Based on [stable-diffusion-webui-huggingface](https://github.com/camenduru/stable-diffusion-webui-huggingface) by camenduru.<br>
You can Download, Upload, Archive files and that's it.<br>
It won't work on local install, as it was intended to be used only on cloud GPU.

# Usage
<h3>Downloader</h3>

![downloader](https://github.com/gutris1/sd-hub/assets/132797949/5641052c-54db-4389-8102-4f1cf369b972)

### ● Input
Similar to [batchlink](https://github.com/etherealxx/batchlinks-webui), you use tag then URL:

```python
$tag
URL
```
but tag should begin with " $ "<br>
tag is mandatory and there is no default path.<br>
For available tags, refer to the Tag List at the bottom of the extension.<br>
![taglist](https://github.com/gutris1/sd-hub/assets/132797949/4e08189c-9617-4681-8985-38cbfd5acb2e)

You can also add subdirectories to the tag if you have any:
```python
$ckpt/tmp_ckpt
https://civitai.com/api/download/models/403131
```

To add an optional path:
```python
$ckpt
https://civitai.com/api/download/models/403131 /kaggle/working/stable-diffusion-webui/zzzzz
```

To download with custom filename, add " - " after the URL or optional path (if provided):
```python
# Without optional path
$ckpt
https://civitai.com/api/download/models/403131 - imagine-anime-XL.safetensors

# With optional path
$ckpt
https://civitai.com/api/download/models/403131 /kaggle/working/stable-diffusion-webui/zzzzz - imagine-anime-XL.safetensors
```

### ● Token
![token](https://github.com/gutris1/sd-hub/assets/132797949/b95fe024-0cde-4462-8ca1-3e6df2b10cc3)<br>

Enter your Huggingface token with the role READ to download from your private repo, get one [Here](https://huggingface.co/settings/tokens).<br>
Enter your Civitai API key if you encounter an Authorization failed error. Get your API key [Here](https://civitai.com/user/account).<br>
Save = To automatically load token upon Reload UI or relaunch of Stable Diffusion Webui.<br>
Load = Load token.

Supported Domains: Civitai Huggingface Github Drive.Google


<h3>Uploader</h3>
  
![uploader](https://github.com/gutris1/sd-hub/assets/132797949/8e1f7a18-2d58-47f9-bb5a-6d8b0be32d80)

### ● Input
Username = Your username at hf.co.<br>
Repository = Your model repository at hf.co. You can also create a new repository.<br>
Branch = Defaults to main. You can change the branch name to create a new branch.<br>
Visibility = Defaults to Private and will only take effect if you are creating a new repository; otherwise, it will be ignored.<br>
Token = Obtain your hf token with the role WRITE from [Here](https://huggingface.co/settings/tokens).<br>

For input box, there are only two options:
- Path targeting to a folder.
- Path targeting to a file.

You can also use $tag to skip the long path name.<br>
You can rename the target upload (file or folder) by adding " - " after the input path.

```python
# Folder as input, so all the files inside the folder with its folder uploaded to your repository
/kaggle/working/stable-diffusion-webui/models/Stable-diffusion

# With tag
$ckpt

# To rename the uploaded folder
$ckpt - my-merge

# File as input, so only the file gets uploaded to your repository
/kaggle/working/stable-diffusion-webui/models/Stable-diffusion/animagineXLV31_v31.safetensors

# with tag
$ckpt/animagineXLV31_v31.safetensors

# to rename the uploaded file
$ckpt/animagineXLV31_v31.safetensors - XL-imagine-animeV31.txt
```


<h3>Archiver</h3>

![archive](https://github.com/gutris1/sd-hub/assets/132797949/70b4f3b3-894c-48bc-86c0-eff4570f5f0b)

available:
- tar.gz
- tar.lz4
- zip

Output Name = for the archive name
```python
my-archive
```
Input path = based on your input
```python
# if input as file, to only compress a single file
/kaggle/working/stable-diffusion-webui/models/Stable-diffusion/animagineXLV31_v31.safetensors

# else input as folder, to compress the whole files inside the input
/kaggle/working/stable-diffusion-webui/models/Stable-diffusion
```


# Credit
[camenduru](https://github.com/camenduru) Thanks for the [extension](https://github.com/camenduru/stable-diffusion-webui-huggingface)<br>
[etherealxx](https://github.com/etherealxx) Thanks for the [inspiration](https://github.com/etherealxx/batchlinks-webui)<br>
Thanks to my Discord friends [DEX-1101](https://github.com/DEX-1101), [VeonN4](https://github.com/VeonN4), [kokomif](https://github.com/kokomif), for always being there in the middle of the night.<br>
Especially to [cupang-afk](https://github.com/cupang-afk), who helped me a lot with Python, thank you.
