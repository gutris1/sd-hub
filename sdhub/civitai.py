from urllib.parse import urlparse, parse_qs
from pathlib import Path
from PIL import Image
import requests
import httpx
import json
import io
import os

KAGGLE = 'KAGGLE_DATA_PROXY_TOKEN' in os.environ

class CIVITAI:
    DOMAINS = ('civitai.com', 'civitai.red')

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

    @classmethod
    def domain(c, url):
        try:
            h = urlparse(url).netloc.lower()
            return next((d for d in c.DOMAINS if d in h), None)
        except Exception:
            return None

    @staticmethod
    def headers():
        return {'User-Agent': 'CivitaiLink:Automatic1111'}

    @classmethod
    def get_json(c, api_url, timeout=15):
        try:
            r = requests.get(api_url, headers=c.headers(), timeout=timeout)
            if r.status_code != 200:
                return None
            return r.json()
        except Exception:
            return None

    @classmethod
    def from_url(c, url):
        civitai = c.domain(url)
        if not civitai: return None

        input_url = url
        url = url.split('?token=')[0] if '?token=' in url else url

        version_id = None

        if f'{civitai}/api/download/models/' in url:
            version_id = url.split('models/')[1].split('/')[0].split('?')[0]
            api_url = f'https://{civitai}/api/v1/model-versions/{version_id}'

        elif f'{civitai}/models/' in url:
            model_id = url.split('models/')[1].split('/')[0].split('?')[0]
            query = parse_qs(urlparse(url).query)
            version_id = query.get('modelVersionId', [None])[0]

            api_url = (
                f'https://{civitai}/api/v1/model-versions/{version_id}'
                if version_id else
                f'https://{civitai}/api/v1/models/{model_id}'
            )

        else:
            return None

        j = c.get_json(api_url)
        if not j:
            return None

        obj = c(j, domain=civitai, version_id=version_id)
        obj.input_url = input_url
        obj.selected_file = obj._f()

        return obj

    @classmethod
    def from_sha(c, sha256):
        for civitai in c.DOMAINS:
            j = c.get_json(f'https://{civitai}/api/v1/model-versions/by-hash/{sha256}')
            if not j:
                continue

            found = next(
                (f for f in j.get('files', [])
                 if f.get('hashes', {}).get('SHA256', '').lower() == sha256.lower()),
                None
            )
            if found:
                obj = c(j, domain=civitai)
                obj.selected_file = found
                return obj

        return None

    def __init__(self, data, domain=None, version_id=None):
        self.data = data
        self.domain_name = domain
        self.input_url = None

        self.version = self._v(version_id)
        self.selected_file = None

    def _v(self, version_id=None):
        if 'modelVersions' not in self.data:
            return self.data

        if version_id:
            return next(
                (v for v in self.data['modelVersions']
                if str(v.get('id')) == str(version_id)),
                self.data['modelVersions'][0]
            )

        return self.data['modelVersions'][0]

    def _f(self):
        files = self.version.get('files', [])

        if self.input_url:
            if 'fileId=' in self.input_url:
                file_id = parse_qs(urlparse(self.input_url).query).get('fileId', [None])[0]

                file = next(
                    (f for f in files if str(f.get('id')) == str(file_id)),
                    None
                )

                if file:
                    return file

            elif 'type=' in self.input_url:
                file = next(
                    (f for f in files if f.get('downloadUrl') == self.input_url),
                    None
                )

                if file:
                    return file

        return (
            next((f for f in files if f.get('primary')), None)
            or next((f for f in files if f.get('downloadUrl')), None)
        )

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
        return self.file.get('name') if self.file else None

    @property
    def sha256(self):
        return self.file.get('hashes', {}).get('SHA256') if self.file else None

    @property
    def download_url(self):
        if self.input_url and '/api/download/models/' in self.input_url:
            return self.input_url

        return self.file.get('downloadUrl') if self.file else None

    @property
    def preview_url(self):
        return next(
            (img.get('url', '') for img in self.version.get('images', [])
             if not img.get('url', '').lower().endswith(('.mp4', '.gif'))),
            None
        )

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
        return f'https://{self.domain_name}/models/{self.model_id}?modelVersionId={self.version_id}'

    def infotags(self, folder, filename=None):
        n = filename or self.filename
        p = Path(folder) / f'{Path(n).stem}.json'
        if p.exists(): return

        data = {
            'activation text': self.activation_text,
            'sd version': self.sd_version,
            'modelId': self.model_id,
            'modelVersionId': self.version_id,
            'sha256': self.sha256,
        }

        p.write_text(json.dumps(data, indent=4))

    def preview(self, folder, filename=None):
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

        n = filename or self.filename
        p = Path(folder) / f'{Path(n).stem}.preview.png'
        if p.exists(): return

        preview = self.preview_url
        if not preview: return

        r = requests.get(preview, headers=self.headers()).content
        resized = self.resizer(r)

        if KAGGLE:
            img = Image.open(resized)
            info = img.info or {}
            if not all(t in info for t in ('Encrypt', 'EncryptPwdSha')):
                sd_image_encryption.EncryptedImage.from_image(img).save(p)
        else:
            p.write_bytes(resized.read())

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

    def html(self, folder, token, filename=None):
        n = filename or self.filename
        p = Path(folder) / f'{Path(n).stem}.html'
        if p.exists(): return

        try:
            with httpx.Client(
                http2=True,
                follow_redirects=True,
                headers={**self.headers(), 'Authorization': f'Bearer {token}'},
                timeout=30,
            ) as c: r = c.get(self.page)

            r.raise_for_status()
            p.write_text(r.text, encoding='utf-8')
            return p

        except Exception as e:
            print(e)

    def extras(self, folder, filename=None, preview=False, html=False, token=None):
        self.infotags(folder, filename)

        for i in (
            self.preview(folder, filename) if preview else None,
            self.html(folder, token, filename) if html else None,
        ):
            if i: yield str(i)
