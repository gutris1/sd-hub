from fastapi import Request
import gradio as gr
import httpx
import json

from modules.ui_components import FormRow

from sdhub.config import config, LoadConfig
from sdhub.paths import SDHubPaths

def imgChest_save(privacy, nsfw, api):
    d = LoadConfig()
    d['imgChest'] = {'privacy': privacy, 'nsfw': nsfw, 'api-key': api}
    config.write_text(json.dumps(d, indent=4), encoding='utf-8')
    yield gr.Radio.update(value=privacy), gr.Radio.update(value=nsfw), gr.TextArea.update(value=api)

def imgChest_load():
    default = ('Hidden', 'True', '')
    d = LoadConfig()
    c = d.get('imgChest', {})
    return tuple(c.get(k, v) for k, v in zip(['privacy', 'nsfw', 'api-key'], default))

def imgChest():
    if not SDHubPaths.getENV(): return None, None, None

    def column():
        with gr.Column(elem_id='SDHub-Gallery-ImgChest-Column'):
            with gr.Column(elem_id='SDHub-Gallery-ImgChest-Wrapper'):
                gr.HTML(
                    'Auto Upload to <a class="sdhub-gallery-imgchest-info" '
                    'href="https://imgchest.com" target="_blank"> imgchest.com</a>',
                    elem_id='SDHub-Gallery-ImgChest-Info'
                )

                gr.Checkbox(
                    label='Click To Enable',
                    elem_id='SDHub-Gallery-ImgChest-Checkbox'
                )

                with FormRow():
                    privacyset = gr.Radio(
                        ['Hidden', 'Public'],
                        value='Hidden',
                        label='Privacy',
                        interactive=True,
                        elem_id='SDHub-Gallery-ImgChest-Privacy',
                        elem_classes='sdhub-radio'
                    )
                    nsfwset = gr.Radio(
                        ['True', 'False'],
                        value='True',
                        label='NSFW',
                        interactive=True,
                        elem_id='SDHub-Gallery-ImgChest-NSFW',
                        elem_classes='sdhub-radio'
                    )

                apibox = gr.Textbox(
                    show_label=False,
                    interactive=True,
                    placeholder='imgchest API key',
                    max_lines=1,
                    elem_id='SDHub-Gallery-ImgChest-API',
                    elem_classes='sdhub-input'
                )

                with FormRow(elem_classes='sdhub-row'):
                    savebtn = gr.Button(
                        'Save', variant='primary',
                        elem_id='SDHub-Gallery-ImgChest-Save-Button',
                        elem_classes='sdhub-buttons'
                    )
                    loadbtn = gr.Button(
                        'Load', variant='primary',
                        elem_id='SDHub-Gallery-ImgChest-Load-Button',
                        elem_classes='sdhub-buttons'
                    )

                savebtn.click(imgChest_save, [privacyset, nsfwset, apibox], [privacyset, nsfwset, apibox])
                loadbtn.click(imgChest_load, [], [privacyset, nsfwset, apibox])

    async def app():
        privacy, nsfw, api = imgChest_load()
        return {'privacy': privacy, 'nsfw': nsfw, 'api-key': api}

    async def uploader(req: Request):
        data = await req.json()
        api = data.get('api')
        images = data.get('images', [])
        title = data.get('title', '')
        privacy = data.get('privacy', 'hidden')
        nsfw = data.get('nsfw', 'true')

        files = []

        async with httpx.AsyncClient() as client:
            for img in images:
                try:
                    r = await client.get(img['path'])
                    r.raise_for_status()
                    files.append(('images[]', (img['name'], r.content, r.headers.get('content-type', 'image/jpeg'))))

                except Exception as e:
                    print(f'Error fetching {img["path"]}: {e}')

            form = {
                'title': title or (images[0]['name'] if images else ''),
                'privacy': privacy,
                'nsfw': nsfw,
            }

            try:
                r = await client.post(
                    'https://api.imgchest.com/v1/post',
                    headers={'Authorization': f'Bearer {api}'},
                    data=form,
                    files=files,
                )

                r.raise_for_status()
                return r.json()

            except Exception as e:
                return {'status': 'error', 'reason': str(e)}

    return column, app, uploader