# SD-Hub
An extension for <code>Stable Diffusion WebUI</code>, designed to streamline your collection.<br>
It lets you download files from sites like <code>Civitai</code>, <code>Hugging Face</code>, <code>GitHub</code>, and <code>Google Drive</code>, whether individually or in batch.<br>
You can also upload files or entire folders to the <code>Hugging Face</code> model repository (with a WRITE token, of course), making sharing and access easier.<br>
Archive and extract files in formats like <code>tar.lz4</code>, <code>tar.gz</code>, and <code>zip</code>.<br>
And a simple Gallery for displaying your outputs with built-in image info and an image viewer.
<br>

- Downloading/Uploading/compressing/extracting files from/to outside Models or Embeddings folders is blocked.<br>
Add <code>--enable-insecure-extension-access</code> command line argument to proceed at your own risk.<br>

- The UI uses JavaScript to read the [Excel](https://huggingface.co/gutris1/sd-hub/blob/main/sd-hub-translations.xlsx) translation file, to translate any readable text based on the user's browser language.<br>
Supported languages include:
  - English
  - Japanese (日本語)
  - Simplified Chinese (简体中文)
  - Traditional Chinese (繁體中文)
  - Spanish (Español)
  - Korean (한국어)
  - Russian (Русский)

- Support both <code>Windows</code> and <code>Unix</code>.

# Changelog
### 2025-03-20  v8.8.8
- Changed/Added function for Uploader Tab.
```python
# Add = to rename the uploaded file/folder
/input-path/someFolder = thisFolder
/input-path/someFile.safetensors = thatFile.safetensors

# Add - to exclude specific file extensions when uploading a folder
/input-path/someFolder - js json py

# Add > to upload into a specific folder within your Huggingface repository.
# The folder will be automatically created if it doesn’t exist.
/input-path/someFolder > folder1
/input-path/someFile.safetensors > folder2
# or
/input-path/someFile.safetensors > folder/subFolder/deepFolder/folderFolder

# Combining all options in single line
/input-path/someFolder = thisFolder - js json py > folder3
```

<details><summary>2025-03-08  v8.0.0</summary><br>
  
- UI translation based on browser language. Excel file for the translation [here](https://huggingface.co/gutris1/sd-hub/blob/main/sd-hub-translations.xlsx)
</details>

<details><summary>2025-02-17  v7.0.0</summary><br>

- Added a simple gallery under the Gallery tab to display outputs with image info and a viewer.
- Added Text Editor and Shell tab, available only when running WebUI on online services like Google Colab, Kaggle, etc.
</details>

<details><summary>2024-12-30  v5.6.1</summary><br>

- Added a function to zip the entire outputs folder, under Zip Outputs accordion of the Archiver tab.<br>
- Only available when running WebUI with <code>--enable-insecure-extension-access</code> command line argument.<br>
<p align="center">
  <img src="https://github.com/user-attachments/assets/74802d39-fcee-4d12-ba9f-302b67eb6375", width=1000px>
</p>
</details>

<details><summary>2024-12-25  v5.5.5</summary><br>

- Added security measures to restrict downloading, uploading, and compressing to the Models and Embeddings folders only when WebUI is run without <code>--enable-insecure-extension-access</code>.<br>
- Added a click event listener to the Gradio DataFrame in Tag List to automatically copy the table text, making it easier to copy especially for mobile users.<br>
- Added a function to automatically save the last used username, repository, and branch when uploading to Huggingface, which will be automatically used when WebUI is loaded.<br>
- Fixed path handling.<br>
- Relocated the token file to the extension folder and renamed it to <code>.sd-hub-token.json</code>.<br>
</details>

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
<details><summary> <h2>Downloader</h2> </summary><br>

<p align="center">
  <img src="https://github.com/user-attachments/assets/b38ce6c3-230d-4d45-bc7e-8b638b872ac0", width=1000px>
</p>


### ● Downloader Input
Similar to [batchlink](https://github.com/etherealxx/batchlinks-webui), you use tag then URL:

```python
$tag
URL
```
Tag should begin with <code>$</code><br>
Tag is mandatory and there is no default path.<br>
For available tags, refer to the <code>Tag List</code> at the bottom of the extension.<br>

- Click on the table row, tag or path to automatically copy its text.<br>
<p align="center">
  <img src="https://github.com/user-attachments/assets/0bf7bc74-35b5-4569-ac85-8f7ac44b1acb", width=1000px>
</p>

- For <code>Civitai</code> you can use the webpage URL directly.<br>
<p align="center">
  <img src="https://github.com/user-attachments/assets/f0600bc8-d18d-45ad-bf3a-aeb252d8f17c", width=1000px>
</p>

- Basic input.
```python
$ckpt
https://civitai.com/models/643227?modelVersionId=811710
```

- Add subdirectories to the tag if exist.
```python
$ckpt/tmp_ckpt
https://civitai.com/models/643227?modelVersionId=811710
```

- Add an optional path for certain URLs. in that case, the tag will be ignored.
```python
$ckpt
https://civitai.com/models/1188071/animagine-xl-40
https://civitai.com/models/643227?modelVersionId=811710 /content/A1111/models/Stable-diffusion/tmp_ckpt
```

- Add <code>=</code> after the URL or an optional path (if provided) to download with a custom filename.
```python
$ckpt
https://civitai.com/models/1188071/animagine-xl-40 = imagine-anime-XL.safetensors

# or with optional path
$ckpt
https://civitai.com/models/643227?modelVersionId=811710 /content/A1111/models/Stable-diffusion = MeichiDarkMix.safetensors
```

● Token box<br>
![token](https://github.com/gutris1/sd-hub/assets/132797949/b95fe024-0cde-4462-8ca1-3e6df2b10cc3)<br>

Enter your Huggingface token with the role READ to download from your private repo, get one [Here](https://huggingface.co/settings/tokens).<br>
Enter your Civitai API key if you encounter an Authorization failed error. Get your key [Here](https://civitai.com/user/account).<br>
Save = To automatically load token upon Reload UI or Webui launch.<br>
Load = Load token.

● Scrape Button<br>

![UntitledProject-ezgif com-video-to-gif-converter (2)](https://github.com/gutris1/sd-hub/assets/132797949/67f09cca-d433-4f16-982b-cb39b3f2dbed)


For Huggingface repository:<br>
By default it will return a list of resolve URLs that match these extensions <code>.safetensors</code> <code>.bin</code> <code>.pth</code> <code>.pt</code> <code>.ckpt</code> <code>.yaml</code><br>

- Paste the repository URL in the following format:<br>
```python
# This will scrape everything in the branch tree list (folders and subfolders won't be included)
htttps://huggingface.co/user_name/repo_name/tree/branch_name

# To Scrape a folder
htttps://huggingface.co/user_name/repo_name/tree/branch_name/folder

# or
htttps://huggingface.co/user_name/repo_name/tree/branch_name/folder/sub_folder
```

- Add <code>-</code> to return only a specific file extension.<br>
```python
htttps://huggingface.co/user_name/repo_name/tree/branch_name - pth safetensors
```

- Enter your Hugging Face READ token into the token box if you want to scrape your private repo.<br>

And Pastebin:<br>
Simply paste the pastebin URL<br>
```python
https://pastebin.com/696969
```
And it will return a list of whatever is available at the pastebin URL.<br>
If it has a hashtag from batchlink, it will automatically be replaced with SD-Hub Tags.<br>

● Insert TXT Button<br>
This allows you to upload a <code>.txt</code> file from your device and add its content to the downloader input.<br>

<code>Supported Domains for Downloader: Civitai Huggingface Github Drive.Google</code>

</details>

<details><summary> <h2>Uploader</h2> </summary><br>

<p align="center">
  <img src="https://github.com/user-attachments/assets/df368836-2a44-4f5a-a0de-212b22910310", width=1000px>
</p>

### ● Uploader Input
Username = Your username at huggingface.co.<br>
Repository = Your model repository at huggingface.co, it will automatically create a new repository if reponame does not exist.<br>
Branch = Defaults to main. You can change the branch name to create a new branch.<br>
Visibility = Defaults to Private and will only take effect if you are creating a new repository; otherwise, it will be ignored.<br>
Token = Obtain your huggingface token with the role WRITE from [Here](https://huggingface.co/settings/tokens).<br>

- For uploader input area, you can either provide a path pointing to a folder or a single file.<br>
- or use <code>$tag</code> to skip the long path name.<br>
```python
/input-path/someFolder
/input-path/someFile.safetensors
```

- Add <code>=</code> to rename the uploaded file/folder.<br>
```python
/input-path/someFolder = thisFolder
/input-path/someFile.safetensors = thatFile.txt
```

- Add <code>-</code> to exclude specific file extensions when uploading a folder.<br>
```python
/input-path/someFolder - js json py
```

- Add <code>></code> to upload into a specific folder within your Huggingface repository.<br>
- The folder will be automatically created if it doesn’t exist.<br>
```python
/input-path/someFolder > folder1
/input-path/someFile.safetensors > folder2

# or
/input-path/someFile.safetensors > folder/subFolder/deepFolder/here
```

- Combining all options in single line.
```python
/input-path/someFolder = thisFolder - js json py > folder3
```
</details>

<details><summary> <h2>Archiver</h2> </summary><br>

<p align="center">
  <img src="https://github.com/user-attachments/assets/07959d71-f7d5-4eec-b40d-907f21f48e63", width=1000px>
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
<code>Output Path</code> Path where the compressed file will be extracted.<br>
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
</details>

<details><summary> <h2>Gallery</h2> </summary><br>

![Screenshot_1](https://github.com/user-attachments/assets/e4442af7-45a9-41e6-9db7-fefc190691ef)<br>


inspired by [IIB](https://github.com/zanllp/sd-webui-infinite-image-browsing)<br>
a simple gallery to display your outputs.<br>
it's not as advanced as IIB, you can't add folders and browse images in here.<br>
oh no anyway,<br>
Left-click on an image to show an image info.<br>
![Screenshot_4](https://github.com/user-attachments/assets/55772568-4b0d-48d2-906b-b906610a59b2)<br>

Right-click on an image to open a context menu.<br>
![Screenshot_2](https://github.com/user-attachments/assets/57f957e4-3b5c-4f1f-a1aa-f2a363737f32)<br>

Hover over an image to reveal an image viewer button in the bottom left and a context menu button on the top right.<br>
![Screenshot_1](https://github.com/user-attachments/assets/aa69c5c9-3fb8-498f-905f-7a9ffc24e34e)<br>

Left-click on the bottom left button to open an image viewer.<br>
![Screenshot_3](https://github.com/user-attachments/assets/b3bd8e45-21f5-4c9a-9aa6-a98fd51abe3b)<br>

</details>

## NB
- The Text Editor and Shell tabs will only be imported and run if WebUI is launched with <code>--enable-insecure-extension-access</code> and the environment is <code>Google Colab</code>, <code>Kaggle</code>, or <code>SageMaker Studio Lab</code>. Otherwise, they will have no effect.<br>
- The same applies to the auto-uploading function in the Gallery tab, which uploads images to imgchest.com after each image generation.<br>

# Credits
[camenduru](https://github.com/camenduru) Thanks for the [extension](https://github.com/camenduru/stable-diffusion-webui-huggingface)<br>
[etherealxx](https://github.com/etherealxx) Thanks for the [inspiration](https://github.com/etherealxx/batchlinks-webui)<br>
Thanks to my Discord friends [DEX-1101](https://github.com/DEX-1101), [VeonN4](https://github.com/VeonN4), [kokomif](https://github.com/kokomif), for always being there in the middle of the night.<br>
Especially to [cupang-afk](https://github.com/cupang-afk), who helped me a lot with Python, thank you.<br>
Thanks to [zanllp](https://github.com/zanllp) for the inspiration.<br>
Thanks to [viyiviyi](https://github.com/viyiviyi) for the zooming scripts in the image viewer which were taken from [here](https://github.com/gutris1/sd-image-viewer), a modified version of the scripts from [here](https://github.com/viyiviyi/stable-diffusion-webui-zoomimage)
