# SD-Hub
An extension for <code>Stable Diffusion WebUI</code>, designed to streamline your collection.<br>
It lets you download files from sites like <code>Civitai</code>, <code>Hugging Face</code>, <code>GitHub</code>, and <code>Google Drive</code>, whether individually or in batch.<br>
You can also upload files or entire folders to the <code>Hugging Face</code> model repository (with a WRITE token, of course), making sharing and access easier.<br>
The extension also has functionality to archive and extract files in formats like <code>tar.lz4</code>, <code>tar.gz</code>, and <code>zip</code>.<br>
<br>
Downloading files to outside of the WebUI folder is blocked.<br>
Add <code>--enable-insecure-extension-access</code> command line argument to proceed at your own risk.<br>
<br>
Support both Windows and Unix.

# Changelog
### 2024-12-23  v5.0.0
- Added a click event listener to the Gradio DataFrame in Tag List to automatically copy the table text, making it easier to copy especially for mobile users.<br>
- Added a function to automatically save the last used username, repository, and branch when uploading to Huggingface, which will be automatically used when WebUI is loaded.<br>
- Fixed path handling.<br>

<details><summary>2024-09-30  v4.8.4</summary><br>

- Gradio 4 Compatibility Update for Forge Webui.<br>
</details>

<details><summary>2024-07-21  v4.5.6</summary><br>

- Added support for downloading from Civitai using webpage URLs directly.<br>
![image](https://github.com/user-attachments/assets/2cde28e1-e88b-45cf-aae4-88bf0bfcf17b)
</details>

<details><summary>2024-07-12  v4.4.4</summary><br>

- Added support for Windows.
</details>

<details><summary>2024-07-03  v3.3.3</summary><br>
  
- Added venv support.
</details>

<details><summary>2024-05-14  v3.2.1</summary><br>

- Added an optional argument <code>-</code> for the Scrape button to filter specific extension instead of using the default extension list.
```python
https://huggingface.co/ckpt/controlnet-sdxl-1.0/tree/main - pth md txt safetensors
```
- Added an optional argument <code>--</code> for the Uploader input box to exclude specific file extension instead of uploading all files.
```python
$ext/sd-hub -- json txt py
```
- Moved <code>Token.json</code> to the Stable Diffusion root directory and renamed to <code>sd-hub-token.json</code>.
- Added a <code>Split by</code> radio button for the Archiver to split compressed files based on the total number of files if input is pointing to a folder.
</details>

<details><summary>2024-04-22  v2.0.2</summary><br>

- Added Scrape Button to return a list of Resolve URL from Huggingface repository, and Pastebin.
- Improved Compress and Decompress logic for Archiver.
</details>

# Usage
<h3>Downloader</h3>

<p align="center">
  <img src="https://github.com/user-attachments/assets/59e3ffc6-a63a-4a4b-a29d-e6787aa946ac", width=1000px>
</p>


### ● Input box
Similar to [batchlink](https://github.com/etherealxx/batchlinks-webui), you use tag then URL:

```python
$tag
URL
```
Tag should begin with <code>$</code><br>
Tag is mandatory and there is no default path.<br>
For available tags, refer to the [Tag List] at the bottom of the extension.<br>

Click on the table row, tag or path to automatically copy its text.<br>
<p align="center">
  <img src="https://github.com/user-attachments/assets/37ed0ab7-a52d-42ac-9252-44eaa88181a8", width=1000px>
</p>

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

To download with custom filename, add <code>-</code> after the URL or optional path (if provided):
```python
# Without optional path
$ckpt
https://civitai.com/api/download/models/403131 - imagine-anime-XL.safetensors

# With optional path
$ckpt
https://civitai.com/api/download/models/403131 /kaggle/working/stable-diffusion-webui/zzzzz - imagine-anime-XL.safetensors
```

### ● Token box
![token](https://github.com/gutris1/sd-hub/assets/132797949/b95fe024-0cde-4462-8ca1-3e6df2b10cc3)<br>

Enter your Huggingface token with the role READ to download from your private repo, get one [Here](https://huggingface.co/settings/tokens).<br>
Enter your Civitai API key if you encounter an Authorization failed error. Get your key [Here](https://civitai.com/user/account).<br>
Save = To automatically load token upon Reload UI or Webui launch.<br>
Load = Load token.

### ● Scrape Button
![UntitledProject-ezgif com-video-to-gif-converter (2)](https://github.com/gutris1/sd-hub/assets/132797949/67f09cca-d433-4f16-982b-cb39b3f2dbed)


For Huggingface repository:<br>
By default it will return a list of resolve URLs that match these extensions <code>.safetensors .bin .pth .pt .ckpt .yaml</code><br>
add <code>-</code> to return only a specific file extension.<br>

Paste the repository URL in the following format:<br>
```python
# To scrape everything in the branch tree list (folders and subfolders won't be included)
htttps://huggingface.co/user_name/repo_name/tree/branch_name

# To filter specific extension
htttps://huggingface.co/user_name/repo_name/tree/branch_name - pth safetensors

# To Scrape a folder
htttps://huggingface.co/user_name/repo_name/tree/branch_name/folder

# or
htttps://huggingface.co/user_name/repo_name/tree/branch_name/folder/sub_folder
```
Enter your Hugginface READ token into Token box if you want to Scrape your private repo.<br>

And Pastebin:<br>
Simply paste the pastebin URL<br>
```python
https://pastebin.com/696969
```
And it will return a list of whatever is available at the pastebin URL.<br>
If it has a hashtag from batchlink, it will automatically be replaced with SD-Hub Tags.<br>

### ● Insert TXT Button
To upload a TXT file from your device, simply select it and upload it into the input box.<br>

<code>Supported Domains for Downloader: Civitai Huggingface Github Drive.Google</code>

<h3>Uploader</h3>
<p align="center">
  <img src="https://github.com/user-attachments/assets/a2f0b341-8743-43da-b857-2e925f3eb7fb", width=1000px>
</p>

### ● Input
Username = Your username at huggingface.co.<br>
Repository = Your model repository at huggingface.co, it will automatically create a new repository if reponame does not exist.<br>
Branch = Defaults to main. You can change the branch name to create a new branch.<br>
Visibility = Defaults to Private and will only take effect if you are creating a new repository; otherwise, it will be ignored.<br>
Token = Obtain your huggingface token with the role WRITE from [Here](https://huggingface.co/settings/tokens).<br>

For the input box, you can either provide a path pointing to a folder or a single file.<br>
You can also use <code>$tag</code> to skip the long path name.<br>
You can rename the upload (file or folder) by adding <code>-</code> after the input path.<br>
You can exclude specific file extension from being uploaded by adding <code>--</code>.<br>
```python
# Folder as input, so all the files inside the folder with its folder uploaded to your repository
/kaggle/working/stable-diffusion-webui/models/Stable-diffusion

# With tag
$ckpt

# To rename the folder
$ckpt - my-merge

# To rename and exclude specific file extension
$ext/sd-hub - mymodel -- json txt py

# File as input, so only the file gets uploaded to your repository
/kaggle/working/stable-diffusion-webui/models/Stable-diffusion/animagineXLV31_v31.safetensors

# with tag
$ckpt/animagineXLV31_v31.safetensors

# to rename the uploaded file
$ckpt/animagineXLV31_v31.safetensors - XL-imagine-animeV31.txt
```
<h3>Archiver</h3>
<p align="center">
  <img src="https://github.com/user-attachments/assets/81bdcde3-8043-4339-af30-d1305379f7f4", width=1000px>
</p>



<code>Supported Format: tar.lz4 tar.gz zip</code>

Archive:<br>
<code>Name</code> Name for the compressed file (excluding the file extension).<br>
<code>Input Path</code> Path pointing a single file or folder containing multiple files.<br>
<code>Output Path</code> Path where the compressed file will be saved.<br>
<code>Create Directory</code> Automatically creates a new folder at the Output Path if not already existing.<br>
<code>Split by</code> Divide the compression into multiple files based on number of files in **Input Path**.<br>

Extract:<br>
<code>Input Path</code> Path pointing to a compressed file.<br>
<code>Output Path</code> Path where the compressed file will be saved.<br>
<code>Create Directory</code> Automatically creates a new folder at the Output Path if not already existing.<br>

You can use <code>$tag</code> for the path in Input and Output Path.<br>
```python
# if input as a file, to compress a single file
/kaggle/working/stable-diffusion-webui/models/Stable-diffusion/animagineXLV31_v31.safetensors

# else input as a folder, to compress the whole files inside the input folder
/kaggle/working/stable-diffusion-webui/models/Stable-diffusion

# with Tag if input as a file
$ckpt/animagineXLV31_v31.safetensors

# with Tag if input as a folder
$ckpt
```

# Credits
[camenduru](https://github.com/camenduru) Thanks for the [extension](https://github.com/camenduru/stable-diffusion-webui-huggingface)<br>
[etherealxx](https://github.com/etherealxx) Thanks for the [inspiration](https://github.com/etherealxx/batchlinks-webui)<br>
Thanks to my Discord friends [DEX-1101](https://github.com/DEX-1101), [VeonN4](https://github.com/VeonN4), [kokomif](https://github.com/kokomif), for always being there in the middle of the night.<br>
Especially to [cupang-afk](https://github.com/cupang-afk), who helped me a lot with Python, thank you.
