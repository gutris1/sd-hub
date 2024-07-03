# SD-Hub
an Extension for Stable Diffusion WebUI and Forge.<br>
You can Download, Upload, Archive files and that's it.<br>
and this won't work on Windows.

# Changelog
<details><summary>2024-07-03  v3.3.3</summary><br>
  
- added venv support.
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

![dl](https://github.com/gutris1/sd-hub/assets/132797949/bbe49e03-9c08-4208-8174-438b47d15927)


### ● Input box
Similar to [batchlink](https://github.com/etherealxx/batchlinks-webui), you use tag then URL:

```python
$tag
URL
```
Tag should begin with <code>$</code><br>
Tag is mandatory and there is no default path.<br>
For available tags, refer to the [Tag List] at the bottom of the extension.<br>
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
  
![upl](https://github.com/gutris1/sd-hub/assets/132797949/c71a2e75-8a32-4572-b62c-6b3deb6e5993)

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

![arc](https://github.com/gutris1/sd-hub/assets/132797949/f66e58f6-37e6-4f9b-91f7-5e7ce27cce0f)


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
