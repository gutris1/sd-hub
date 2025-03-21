from modules.script_callbacks import on_ui_tabs, on_app_started
import gradio as gr

from sd_hub.galleryTab import GalleryTab, GalleryApp
from sd_hub.downloaderTab import DownloaderTab
from sd_hub.archiverTab import ArchiverTab
from sd_hub.uploaderTab import UploaderTab
from sd_hub.infotext import sdhub_repo
from sd_hub.paths import SDHubPaths

def onSDHUBTab():
    with gr.Blocks(analytics_enabled=False) as sdhub, gr.Tabs(elem_id='sdhub-tab'):
        DownloaderTab()
        UploaderTab()
        ArchiverTab()

        if SDHubPaths.getENV():
            from sd_hub.texteditorTab import TextEditorTab; TextEditorTab()
            from sd_hub.shellTab import ShellTab; ShellTab()

        GalleryTab()

        with gr.Accordion(
            'Tag List',
            open=False,
            visible=True,
            elem_id='sdhub-dataframe-accordion',
            elem_classes='sdhub-accordion'
        ):
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
