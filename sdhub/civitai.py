from urllib.parse import urlparse, parse_qs
from html import escape as esc
from bs4 import BeautifulSoup
from pathlib import Path
from PIL import Image
import requests
import httpx
import json
import io
import os

KAGGLE = 'KAGGLE_DATA_PROXY_TOKEN' in os.environ

class CIVITAI:
    DOMAINS = ('civitai.red', 'civitai.com')

    BaseList = {
        'SD 1': 'SD1',
        'SD 1.5': 'SD1',
        'SD 2': 'SD2',
        'SD 3': 'SD3',
        'SDXL': 'SDXL',
        'Pony': 'SDXL',
        'Illustrious': 'SDXL',
        'Anima': 'Anima',
        'ZImageBase': 'ZImageBase',
        'ZImageTurbo': 'ZImageTurbo',
    }

    def __init__(self, data, domain=None, version_id=None):
        self.data = data
        self.version_data = None

        self.domain_name = domain
        self.input_url = None

        self.version = self._v(version_id)
        self.selected_file = None

    @classmethod
    def domain(c, url):
        try:
            return next((d for d in c.DOMAINS if d in urlparse(url).netloc.lower()), None)
        except Exception:
            return None

    @staticmethod
    def headers():
        return {'User-Agent': 'CivitaiLink:Automatic1111'}

    @classmethod
    def get_json(c, api_url, timeout=15):
        try:
            r = requests.get(api_url, headers=c.headers(), timeout=timeout)
            if r.status_code != 200: return None
            return r.json()
        except Exception:
            return None

    @classmethod
    def get_model(c, civitai, model_id):
        return c.get_json(f'https://{civitai}/api/v1/models/{model_id}')

    @classmethod
    def get_version(c, civitai, version_id):
        return c.get_json(f'https://{civitai}/api/v1/model-versions/{version_id}')

    @classmethod
    def _m(c, model, version, civitai, version_id=None, input_url=None):
        v = c(model, domain=civitai, version_id=version_id)
        v.version_data = version
        v.input_url = input_url
        v.selected_file = v._f()

        try:
            with httpx.Client(http2=True, follow_redirects=True, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30) as client:
                v._page = str(client.get(v.page).url)
        except Exception:
            pass

        return v

    @classmethod
    def from_url(c, url):
        civitai = c.domain(url)
        if not civitai: return None

        url = url.split('?token=')[0].split('&token=')[0]
        input_url = url

        version_id = None

        if f'{civitai}/api/download/models/' in url:
            version_id = url.split('models/')[1].split('/')[0].split('?')[0]

            version = c.get_version(civitai, version_id)
            if not version: return None

            model = c.get_model(civitai, version.get('modelId'))
            if not model: return None

        elif f'{civitai}/models/' in url:
            model_id = url.split('models/')[1].split('/')[0].split('?')[0]

            query = parse_qs(urlparse(url).query)
            version_id = query.get('modelVersionId', [None])[0]

            model = c.get_json(f'https://{civitai}/api/v1/models/{model_id}')
            if not model: return None

            if not version_id:
                version_id = next((str(v.get('id')) for v in model.get('modelVersions', []) if v.get('id')), None)

            version = (c.get_json(f'https://{civitai}/api/v1/model-versions/{version_id}') if version_id else None)

        else: return None

        return c._m(model, version, civitai, version_id=version_id, input_url=input_url)

    @classmethod
    def from_sha(c, sha256):
        civitai = 'civitai.red'

        version = c.get_json(f'https://{civitai}/api/v1/model-versions/by-hash/{sha256}')
        if not version: return None

        model = c.get_model(civitai, version.get('modelId'))
        if not model: return None

        obj = c._m(model, version, civitai, version_id=version.get('id'))
        obj.selected_file = next((f for f in obj.version.get('files', []) if f.get('hashes', {}).get('SHA256', '').lower() == sha256.lower()), None)
        return obj

    def _v(self, version_id=None):
        if 'modelVersions' not in self.data: return self.data
        if version_id: return next((v for v in self.data['modelVersions'] if str(v.get('id')) == str(version_id)), self.data['modelVersions'][0])
        return self.data['modelVersions'][0]

    def _f(self):
        files = self.version.get('files', [])

        if self.input_url:

            if 'fileId=' in self.input_url:
                file_id = parse_qs(urlparse(self.input_url).query).get('fileId', [None])[0]

                file = next((f for f in files if str(f.get('id')) == str(file_id)), None)
                if file: return file

            elif '/api/download/models/' in self.input_url:
                file = next((f for f in files if f.get('downloadUrl') == self.input_url), None)
                if file:  return file

        return (next((f for f in files if f.get('primary')), None) or next((f for f in files if f.get('downloadUrl')), None))

    @property
    def exists(self):
        return self.file is not None

    @property
    def model_id(self):
        return self.data.get('id') if 'modelVersions' in self.data else self.data.get('modelId')

    @property
    def version_id(self):
        return self.version.get('id')

    @property
    def file(self):
        return self.selected_file

    @property
    def filename(self):
        if not self.file: return None
        return (self.file.get('overrideName') or self.file.get('name'))

    @property
    def sha256(self):
        return self.file.get('hashes', {}).get('SHA256') if self.file else None

    @property
    def download_url(self):
        if self.input_url and '/api/download/models/' in self.input_url: return self.input_url
        return self.file.get('downloadUrl') if self.file else None

    @property
    def preview_url(self):
        return next((img.get('url', '') for img in self.version.get('images', []) if not img.get('url', '').lower().endswith(('.mp4', '.gif'))), None)

    @property
    def activation_text(self):
        return ', '.join(self.version.get('trainedWords', []))

    @property
    def sd_version(self):
        base = self.version.get('baseModel', '')
        return next((s for k, s in self.BaseList.items() if k in base), '')

    @property
    def early_access(self):
        return self.version.get('availability') == 'EarlyAccess' or bool(self.version.get('earlyAccessEndsAt'))

    def early_access_info(self):
        if not self.early_access: return None
        return f'{self.page}\n-> The model is in early access and requires payment for downloading.'

    @property
    def page(self):
        return getattr(self, '_page', f'https://{self.domain_name}/models/{self.model_id}?modelVersionId={self.version_id}')

    def infotags(self, folder, filename=None):
        p = Path(folder) / f'{Path(filename or self.filename).stem}.json'
        if p.exists(): return

        data = {
            'activation text': self.activation_text,
            'sd version': self.sd_version,
            'modelId': self.model_id,
            'modelVersionId': self.version_id,
            'sha256': self.sha256,
            'modelPageURL': self.page,
        }

        p.write_text(json.dumps(data, indent=4))

    def preview(self, folder, filename=None):
        p = Path(folder) / f'{Path(filename or self.filename).stem}.preview.png'
        if p.exists(): return

        preview = self.preview_url
        if not preview: return

        r = requests.get(preview, headers=self.headers()).content
        resized = self.resizer(r)

        if KAGGLE:
            try:
                import sd_image_encryption  # type: ignore
            except ImportError as e:
                err = (
                    f"{str(e)}\nimage preview skipped\n"
                    "Install https://github.com/gutris1/sd-image-encryption extension "
                    "or you'll get banned by Kaggle."
                )
                print(err)
                return err

            img = Image.open(self.resizer(r))
            info = img.info or {}
            if not all(t in info for t in ('Encrypt', 'EncryptPwdSha')):
                sd_image_encryption.EncryptedImage.from_image(img).save(p)
        else:
            p.write_bytes(self.resizer(r).read())

        return p

    @staticmethod
    def resizer(b, size=512):
        i = Image.open(io.BytesIO(b))
        w, h = i.size
        s = (size, int(h * size / w)) if w > h else (int(w * size / h), size)
        o = io.BytesIO()
        i.resize(s, Image.LANCZOS).save(o, format='PNG')
        o.seek(0)
        return o

    @staticmethod
    def html_desc(l):
        b = BeautifulSoup(l or '', 'html.parser')
        for t in b(['script', 'iframe', 'noscript']): t.decompose()
        return str(b)

    def html(self, folder, filename=None):
        model_name = self.data.get('name')

        creator = self.data.get('creator') or {}
        username = creator.get('username')
        avatar = (
            f'<div class="avatar"><img src="{esc(creator.get("image"))}"></div>'
            if creator.get('image') else
            f'<div class="avatar avatar-name">{esc(username[:2])}</div>'
        )

        n = Path(filename or self.filename).stem
        p = Path(folder) / f'{n}.html'
        if p.exists(): return

        description = self.html_desc(self.data.get('description'))
        this_version = self.html_desc((self.version_data or {}).get('description'))

        info_section = f'''
        <div class="info-section">
            <div class="header-block">
                <div class="model-page-line">
                    <span class="page-label">Model Page:</span>
                    <a href="{esc(self.page)}">{esc(model_name)}</a>
                </div>
                <div class="uploader-divider"></div>
                <div class="model-uploader-line">
                    <span class="uploader-label">Uploaded by:</span>
                    <a href="{esc(f'https://{self.domain_name}/user/{username}')}">{esc(username)}</a>
                    {avatar}
                </div>
            </div>
            <div class="info-permissions-container">
                <div class="version-info-block">
                    <h3 class="block-header">Version Information</h3>
                    <dl></dl>
                </div>
                <div class="permissions-block">
                    <h3 class="block-header">Permissions</h3>
                    <p></p>
                </div>
            </div>
            <div class="description-block">
                <h2 class="block-header">Model Description</h2>
                <div class="description-wrapper">
                    <div class="description-content" id="preview-description-content">{description}</div>
                    <div class="description-overlay" id="preview-description-overlay"></div>
                    <button class="description-toggle-btn" id="preview-description-toggle-btn" onclick="toggleDescription('preview-')">Show More</button>
                </div>
            </div>
        </div>
        '''

        images = ''

        for image in (self.version_data or {}).get('images', []):
            url = image.get('url')
            if not url or url.lower().endswith(('.mp4', '.gif')): continue

            url = esc(url)

            images += f'''
            <div class="image-block">
                <div class="civitai-image-container">
                    <img class="preview-media"
                         data-sampleimg="true"
                         alt="Model preview"
                         src="{url}"
                         onclick="openImageViewer('{url}', 'image')">
                    <div class="civitai_txt2img">
                        <label class="civitai-txt2img-btn"
                               onclick="sendImgUrl('{url}')">
                            Send to txt2img
                        </label>
                    </div>
                </div>
                <div class="image_info">
                    <dl>
            '''

            meta = image.get('meta') or {}

            for k, v in meta.items():
                if v in (None, ''): continue

                if isinstance(v, (dict, list)): v = json.dumps(v, indent=2, ensure_ascii=False)

                images += f'''
                        <div class="civitai-meta-btn">
                            <dt>{esc(str(k))}</dt>
                            <dd>{esc(str(v))}</dd>
                        </div>
                '''

            images += '''
                    </dl>
                </div>
            </div>
            '''

        images_section = f'''
        <div class="images-section">
            <div class="sampleimgs">
                {images}
            </div>
        </div>
        '''

        html = f'''
        <html>
            <head>
                <style>
                    .avatar-name {{
                        width: 96px;
                        height: 96px;
                        border-radius: 50%;
                        background: #444;
                        color: #fff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: monospace;
                        font-weight: 700;
                        font-size: 44px;
                        user-select: none;
                    }}
                </style>
            </head>
            <body>
                <div class="main-container">
                    {info_section}
                    {images_section}
                </div>
            </body>
        </html>
        '''

        p.write_text(html, encoding='utf-8')
        return p

    def extras(self, folder, filename=None, preview=False, html=False):
        self.infotags(folder, filename)

        for i in (
            self.preview(folder, filename) if preview else None,
            self.html(folder, filename) if html else None,
        ):
            if i: yield str(i)
