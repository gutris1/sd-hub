import importlib
try:
    import sd_hub
    miso = [
        'tokenizer', 'downloaderTab', 'archiverTab', 'uploaderTab', 
        'paths', 'scraper', 'version', 'infotext', 
        'zipoutputs', 'shellTab', 'texteditorTab', 'galleryTab'
    ]
    for soop in miso:
        __import__(f'sd_hub.{soop}')
        importlib.reload(getattr(sd_hub, soop))
except (AttributeError, ImportError):
    pass

from modules.script_callbacks import on_ui_tabs, on_app_started
import gradio as gr

from sd_hub.galleryTab import GalleryTab, GalleryApp
from sd_hub.downloaderTab import DownloaderTab
from sd_hub.archiverTab import ArchiverTab
from sd_hub.uploaderTab import UploaderTab
from sd_hub.tokenizer import load_token
from sd_hub.infotext import sdhub_repo
from sd_hub.paths import SDHubPaths

insecureENV = SDHubPaths.getENV()

def onSDHUBTab():
    token1, token2, token3, _, _ = load_token()

    with gr.Blocks(analytics_enabled=False) as sdhub, gr.Tabs(elem_id='sdhub-tab'):
        DownloaderTab(token2, token3)
        UploaderTab(token1)
        ArchiverTab()

        if insecureENV:
            from sd_hub.texteditorTab import TextEditorTab
            from sd_hub.shellTab import ShellTab
            TextEditorTab()
            ShellTab()

        GalleryTab()

        with gr.Accordion('Tag List', open=False, visible=True, elem_id='sdhub-dataframe-accordion'):
            gr.DataFrame(
                [[tag, path] for tag, path in SDHubPaths.SDHubTagsAndPaths().items()],
                headers=['SD-Hub Tag', 'WebUI Path'],
                datatype=['str', 'str'],
                interactive=False,
                elem_id='sdhub-tag-dataframe'
            )

        gr.HTML(sdhub_repo)

    return (sdhub, 'HUB', 'sdhub'),

on_ui_tabs(onSDHUBTab)
on_app_started(GalleryApp)
