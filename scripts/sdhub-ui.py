import gradio as gr

from modules.script_callbacks import on_ui_tabs, on_app_started, on_image_saved

from sdhub.downloaderTab import DownloaderTab
from sdhub.uploaderTab import UploaderTab, LoadUploaderInfo
from sdhub.archiverTab import ArchiverTab
from sdhub.texteditorTab import TextEditorTab
from sdhub.shellTab import ShellTab
from sdhub.galleryTab import GalleryTab, GalleryApp, GalleryWS

from sdhub.infotext import repo
from sdhub.paths import SDHubPaths

Gallery = GalleryWS()

def Tab():
    with gr.Blocks(analytics_enabled=False) as sdhub:
        with gr.Tabs(elem_id='SDHub-Tab'):
            DownloaderTab()
            UploaderTab()
            ArchiverTab()
            TextEditorTab()
            ShellTab()
            GalleryTab()

            with gr.Accordion('Tag List', open=False, elem_id='SDHub-Tag-Accordion', elem_classes='sdhub-accordion'):
                gr.DataFrame(
                    [[tag, path] for tag, path in SDHubPaths.SDHubTagsAndPaths().items()],
                    headers=['SD-Hub Tag', 'WebUI Path'],
                    datatype=['str', 'str'],
                    interactive=False,
                    elem_id='SDHub-Tag-Dataframe'
                )

            gr.HTML(repo)

    return (sdhub, 'HUB', 'SDHub'),

on_app_started(LoadUploaderInfo)
on_app_started(GalleryApp)
on_image_saved(Gallery.img)
on_ui_tabs(Tab)