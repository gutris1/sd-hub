# SD-Hub
An extension for <code>Stable Diffusion WebUI</code>, designed to streamline your collection.<br>
It lets you download files from sites like <code>Civitai</code>, <code>Hugging Face</code>, <code>GitHub</code>, and <code>Google Drive</code>, whether individually or in batch.<br>
You can also upload files or entire folders to the <code>Hugging Face</code> model repository (with a WRITE token, of course), making sharing and access easier.<br>
Archive and extract files in formats like <code>tar.lz4</code>, <code>tar.gz</code>, and <code>zip</code>.<br>
And a simple Gallery for displaying your outputs with built-in image info and an image viewer.
<br>

- Downloading/Uploading/Archiving/Extracting files from/to outside Models or Embeddings folders is blocked.<br>
Add <code>--enable-insecure-extension-access</code> command line argument to proceed at your own risk.<br>

Supported languages:
  - English
  - Japanese (日本語)
  - Simplified Chinese (简体中文)
  - Traditional Chinese (繁體中文)
  - Spanish (Español)
  - Korean (한국어)
  - Russian (Русский)

Language is automatically selected based on the browser’s language setting.

Support both <code>Windows</code> and <code>Unix</code>.

# Usage
<details><summary> <h2>Downloader</h2> </summary><br>

<p align="center">
  <img src="https://github.com/user-attachments/assets/7668ed6b-77c1-44a9-a47a-d19561f01399", width=1000px>
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
  <img src="https://github.com/user-attachments/assets/06b11389-08d3-4765-95e4-cb870dd71c21", width=1000px>
</p>

- For <code>Civitai</code> you can use the webpage URL directly.<br>
<p align="center">
  <img src="https://github.com/user-attachments/assets/f0600bc8-d18d-45ad-bf3a-aeb252d8f17c", width=1000px>
</p>

Will automatically create model info tags when the source is Civitai.<br>
Enable the <code>Civitai Preview</code> checkbox to also download the model preview if the source is Civitai.<br>
If the source is Huggingface, the SHA256 will be used to match and fetch the info tags and preview from Civitai when possible. Needs a Huggingface read token if the model is private.<br>


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
![token](https://github.com/user-attachments/assets/e4e93a3b-425a-4cc6-b5c1-f3101ba78723)<br>

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
  <img src="https://github.com/user-attachments/assets/918bffac-92ec-4c9d-9d40-3e5a5530d801", width=1000px>
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
/input-path/someFile.safetensors = thatFile.safetensors
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
  <img src="https://github.com/user-attachments/assets/38b7bbd0-efb6-4229-817f-553606741fc5", width=1000px>
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

<p><img src="https://github.com/user-attachments/assets/86112ae4-7698-4ad1-a6ef-01869fcedf09", max-width=1000px></p>

inspired by [IIB](https://github.com/zanllp/sd-webui-infinite-image-browsing)<br>
a simple gallery to display your outputs.<br>
it's not as advanced as IIB, you can't add folders and browse images here.<br>

Each Tab has its own pagination, with a default limit of 100 images per page (you can change this in Settings).<br>
Use the arrow buttons at the bottom to navigate between pages (if available), or use the left/right arrow keys on your keyboard.<br>

- Click the gear icon on the right to open Settings and change the layout of certain elements.
  - Press [X] in the top-right or ESC to close Settings.
<p><img src="https://github.com/user-attachments/assets/11f9c838-891e-494c-97d5-5275f04fb93b", max-width=1000px></p>

- Left-click on an image to open the image info.<br>
  - left-click the image inside the image info to open the image viewer.
  - Press [X] in the top-right or ESC to close image info.
<p><img src="https://github.com/user-attachments/assets/62a9f988-a190-4970-b0dc-446eaa051380", max-width=1000px></p>

- Right-click on an image to open a context menu.<br>
<p><img src="https://github.com/user-attachments/assets/57152ccd-293f-418c-840b-1a1ecdc6ae55", max-width=1000px></p>

- Hovering over an image will reveal the image viewer button in the bottom-left and a context menu button in the top-right (which also opens on hover).<br>
<p><img src="https://github.com/user-attachments/assets/e2b6d93a-cbd4-44d3-a59b-f4350c96cf1a", max-width=1000px></p>

- Left-click on the bottom left button to open an image viewer.
  - Use left/right arrow keys to navigate between images.
  - Press [X] in the top-right or ESC to close image viewer.
<p><img src="https://github.com/user-attachments/assets/2cd39ac5-2cbd-438c-9222-6362cff97445", max-width=1000px></p>

</details>

# NB
- The Text Editor and Shell tabs will only be imported and run if WebUI is launched with <code>--enable-insecure-extension-access</code> and the environment is <code>Google Colab</code>, <code>Kaggle</code>, or <code>SageMaker Studio Lab</code>. Otherwise, they will have no effect.<br>
- The same applies to the auto-uploading function in the Gallery tab, which uploads images to imgchest.com after each image generation.<br>

# Changelog
### 2025-06-30 — v11
- Added function for Downloader Tab to automatically create model info tags when the source is Civitai.
- And a checkbox to optionally download the model preview.
- If the source is Huggingface, the SHA256 will be used to match and fetch the info tags and preview from Civitai when possible. Needs a Huggingface read token if the model is private.

<p align="left">
  <img src="https://github.com/user-attachments/assets/338198eb-7180-44a2-988a-d25df64961eb", width=100%>
</p>

<details><summary>2025-06-14 — v10</summary><br>

- Tokens and any other auto-saved/loaded data are now stored in <code>.sd-hub-config.json</code>
- Fixed Gallery, faster loading, re-style etc.
- Added paging to the Gallery, limiting to 100 images per page by default.
- Use the arrow buttons at the bottom to navigate between pages, or use the left/right arrow keys on your keyboard.
- Added settings to change some layouts in the Gallery. The settings are saved and loaded automatically.
- Press the [X] button in the top-right corner or ESC on your keyboard to exit the settings.

<p align="left">
  <img src="https://github.com/user-attachments/assets/57031a18-0d50-4447-b601-88b4b96c55f7", width=auto>
  <img src="https://github.com/user-attachments/assets/ae2f39da-98bc-4e95-9ebe-2871f06c0b2f", width=auto>
</p>
</details>

<details><summary>2025-04-01 — v9.0.0</summary><br>

- Fixed crashes on Firefox and other Gecko-based browsers.
- Fixed the "Send to..." buttons in Gallery context menu or image info when running WebUI on mobile.
- Optimized Gallery to display the scaled-down image (around 30kb/image), only fetching the full-size file when needed.
- Added a "Copy" button to the Gallery context menu to copy image. (This copies the image itself, not the file, all image tags will be lost when pasted, just like the browser's "Copy Image" context menu.)
- Added CTRL + scroll wheel (or Cmd + scroll wheel on macOS) to move images horizontally in the image viewer when the top/bottom edge exceeds the Lightbox.
- Added SHIFT + scroll wheel to move images horizontally in the image viewer when the left/right edge exceeds the Lightbox.
</details>

<details><summary>2025-03-22 — v8.8.8</summary><br>

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
</details>

<details><summary>2025-03-08 — v8.0.0</summary><br>
  
- UI translation based on browser language. Excel file for the translation [here](https://huggingface.co/gutris1/sd-hub/blob/main/sd-hub-translations.xlsx)
</details>

<details><summary>2025-02-17 — v7.0.0</summary><br>

- Added a simple gallery under the Gallery tab to display outputs with image info and a viewer.
- Added Text Editor and Shell tab, available only when running WebUI on online services like Google Colab, Kaggle, etc.
</details>

<details><summary>2024-12-30 — v5.6.1</summary><br>

- Added a function to zip the entire outputs folder, under Zip Outputs accordion of the Archiver tab.<br>
- Only available when running WebUI with <code>--enable-insecure-extension-access</code> command line argument.<br>
<p align="center">
  <img src="https://github.com/user-attachments/assets/74802d39-fcee-4d12-ba9f-302b67eb6375", width=1000px>
</p>
</details>

<details><summary>2024-12-25 — v5.5.5</summary><br>

- Added security measures to restrict downloading, uploading, and compressing to the Models and Embeddings folders only when WebUI is run without <code>--enable-insecure-extension-access</code>.<br>
- Added a click event listener to the Gradio DataFrame in Tag List to automatically copy the table text, making it easier to copy especially for mobile users.<br>
- Added a function to automatically save the last used username, repository, and branch when uploading to Huggingface, which will be automatically used when WebUI is loaded.<br>
- Fixed path handling.<br>
- Relocated the token file to the extension folder and renamed it to <code>.sd-hub-token.json</code>.<br>
</details>

<details><summary>2024-09-30 — v4.8.4</summary><br>

- Gradio 4 Compatibility Update for Forge Webui.<br>
</details>

<details><summary>2024-07-21 — v4.5.6</summary><br>

- Added support for downloading from Civitai using webpage URLs directly.<br>
![image](https://github.com/user-attachments/assets/2cde28e1-e88b-45cf-aae4-88bf0bfcf17b)
</details>

<details><summary>2024-07-12 — v4.4.4</summary><br>

- Added support for Windows.
</details>

<details><summary>2024-07-03 — v3.3.3</summary><br>
  
- Added venv support.
</details>

<details><summary>2024-05-14 — v3.2.1</summary><br>

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

<details><summary>2024-04-22 — v2.0.2</summary><br>

- Added Scrape Button to return a list of Resolve URL from Huggingface repository, and Pastebin.
- Improved Compress and Decompress logic for Archiver.
</details>

# Credits
[camenduru](https://github.com/camenduru) Thanks for the [extension](https://github.com/camenduru/stable-diffusion-webui-huggingface)<br>
[etherealxx](https://github.com/etherealxx) Thanks for the [inspiration](https://github.com/etherealxx/batchlinks-webui)<br>
Thanks to my Discord friends [DEX-1101](https://github.com/DEX-1101), [VeonN4](https://github.com/VeonN4), [kokomif](https://github.com/kokomif), for always being there in the middle of the night.<br>
Thanks to [w-e-w](https://github.com/w-e-w) for helping me and making the public release for Windows possible.<br>
Thanks to [zanllp](https://github.com/zanllp) for the inspiration behind the Infinite Image Browsing extension, which led to my simple Gallery Tab.<br>
Thanks to [viyiviyi](https://github.com/viyiviyi) for the zooming scripts in the image viewer which were taken from [here](https://github.com/gutris1/sd-image-scripts), a modified version of the scripts from [here](https://github.com/viyiviyi/stable-diffusion-webui-zoomimage)<br>
Especially to [cupang-afk](https://github.com/cupang-afk), who helped me a lot with Python, thank you.<br>
