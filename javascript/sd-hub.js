function SDHubCopyTextFromUselessDataFrame() {
  document.addEventListener("click", (e) => {
    const table = gradioApp().querySelector("#sdhub-tag-dataframe");

    if (table && table.contains(e.target)) {
      const td = e.target.closest("td");
      const span = td.querySelector("span");
      const text = span ? span.textContent : null;

      if (text) {
        navigator.clipboard.writeText(text);

        td.classList.add("pulse-td");
        setTimeout(() => {
          td.classList.remove("pulse-td");
        }, 2000);
      }
    }
  });
}

function SDHubShellShiftEnter() {
  const tab = document.querySelector('#sdhub-shell-tab');
  const button = document.querySelector('#sdhub-shell-button');

  document.addEventListener('keydown', function(e) {
    if (e.shiftKey && e.key === 'Enter' && tab && window.getComputedStyle(tab).display === 'block') {
      button.click();
    }
  });
}

function SDHubTextEditorCTRLS() {
  const tab = document.querySelector('#sdhub-texteditor-tab');
  const button = document.querySelector('#sdhub-texteditor-save-button');

  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's' && tab && window.getComputedStyle(tab).display === 'block') {
      e.preventDefault();
      button.click();
    }
  });
}

async function SDHubTextEditorInfo() {
  const info = document.querySelector('#sdhub-texteditor-info input');

  if (info.value.trim() !== '') {
    info.style.opacity = '1';
    setTimeout(() => {
      info.style.transition = 'opacity 2s ease';
      info.style.opacity = '0';
    }, 1000);

    setTimeout(() => {
      info.value = '';
      updateInput(info);
      info.style.transition = 'opacity 0.3s ease';
    }, 2000);
  }
}

function SDHubTextEditorGalleryScrollBar() {
  const isFirefox = /firefox/i.test(navigator.userAgent);

  const ScrollBAR = document.createElement('style');
  document.body.appendChild(ScrollBAR);

  const SBforFirefox = `
    #sdhub-texteditor-editor,
    .sdhub-gallery-tab-container {
      scrollbar-width: thin !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }
  `;

  const SBwebkit = `
    #sdhub-texteditor-editor::-webkit-scrollbar {
      width: 0.6rem !important;
      position: absolute !important;
      right: 4px !important;
    }

    .sdhub-gallery-tab-container::-webkit-scrollbar {
      width: 0.4rem !important;
      position: absolute !important;
      right: 4px !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-thumb,
    .sdhub-gallery-tab-container::-webkit-scrollbar-thumb {
      background: var(--primary-400) !important;
      border-radius: 30px !important;
      background-clip: padding-box !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-thumb:hover,
    .sdhub-gallery-tab-container::-webkit-scrollbar-thumb:hover {
      background: var(--primary-600) !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 2px 0 !important;
    }

    .sdhub-gallery-tab-container::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 0 !important;
    }
  `;

  ScrollBAR.innerHTML = isFirefox ? SBforFirefox : SBwebkit;
}

onUiLoaded(function () {
  window.getRunningScript = () => () => new Error().stack.match(/(?:[a-z]+:\/\/)?[^ \n]*\.js/)[0];
  var FilePath = getRunningScript()().match(/file=([^\/]+\/[^\/]+)\//);

  if (FilePath) {
    var Path = `file=${FilePath[1]}/`;
    var NameFile = 'uploader-info.json';

    fetch(Path + NameFile, { cache: "no-store" })
      .then(response => {
        if (!response.ok) return;
        return response.json();
      })
      .then(data => {
        if (data) {
          const { username, repository, branch } = data;

          const UsernameBox = gradioApp().querySelector('#sdhub-uploader-username-box input');
          const RepoBox = gradioApp().querySelector('#sdhub-uploader-repo-box input');
          const BranchBox = gradioApp().querySelector('#sdhub-uploader-branch-box input');

          const info = [
            { value: username, box: UsernameBox },
            { value: repository, box: RepoBox },
            { value: branch, box: BranchBox }
          ];

          info.forEach(i => {
            if (i.value) {
              i.box.value = i.value;
              updateInput(i.box);
            }
          });
        }
      })
      .catch(error => {
        console.log("Error:", error);
      });
  }

  SDHubCopyTextFromUselessDataFrame();
  SDHubTextEditorGalleryScrollBar();
  SDHubTextEditorCTRLS();
  SDHubShellShiftEnter();
  SDHubTabTranslation();
  onSDHubTabChanges();
});

function onSDHubTabChanges() {
  const TargetTabs = [document.getElementById('tabs'), document.getElementById('sdhub-tab')];
  const config = { childList: true, subtree: true };

  TargetTabs.forEach(Target => {
    if (Target) {
      const obs = new MutationObserver((mutationsList, observer) => {
        mutationsList.forEach(mutation => {
          if (mutation.type === 'childList') {
            let MainTab = gradioApp().querySelector('#tabs > .tab-nav > button.selected');
            let TabList = gradioApp().querySelectorAll('#sdhub-tab > .tab-nav > button');
            let SelectedTab = gradioApp().querySelector('#sdhub-tab > .tab-nav > button.selected');
            let Accordion = gradioApp().querySelector('#sdhub-dataframe-accordion');
            const Id = 'sdHUBHidingScrollBar';

            TabList.forEach(button => {
              let t = button.textContent.trim();
              if (SDHubTabButtons[t]) button.id = SDHubTabButtons[t];
              let c = getSDHubTranslation(t.toLowerCase());
              if (c) button.textContent = c;
            });

            let Tab = Array.from(TabList).indexOf(SelectedTab);

            if (Tab === 3 || Tab === 5) { 
              Accordion.style.display = 'none';
              if (!document.getElementById(Id)) {
                const Scrollbar = document.createElement('style');
                Scrollbar.id = Id;
                Scrollbar.innerHTML = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
                document.head.appendChild(Scrollbar);
              }
              Object.assign(document.documentElement.style, { scrollbarWidth: 'none' });

            } else if (Tab !== 3 && Tab !== 5) { 
              Accordion.style.display = 'block';
              const Scrollbar = document.getElementById(Id);
              if (Scrollbar) document.head.removeChild(Scrollbar);
              Object.assign(document.documentElement.style, { scrollbarWidth: '' });
              document.body.classList.remove('no-scroll');
            }

            if (MainTab && MainTab.textContent.trim() !== 'HUB') {
              const Scrollbar = document.getElementById(Id);
              if (Scrollbar) document.head.removeChild(Scrollbar);
              Object.assign(document.documentElement.style, { scrollbarWidth: '' });
              document.body.classList.remove('no-scroll');
            }
          }
        });
      });

      obs.observe(Target, config);
    }
  });
}

let SDHubTranslations = {};

const SDHubLangIndex = {
  en: 1,
  ja: 2,
  'zh-CN': 3,
  'zh-TW': 4,
  es: 5,
  ko: 6,
  ru: 7
};

let SDHubTabButtons = {
  'Downloader': 'sdhub-tab-button-downloader',
  'Uploader': 'sdhub-tab-button-uploader',
  'Archiver': 'sdhub-tab-button-archiver',
  'Text Editor': 'sdhub-tab-button-texteditor',
  'Shell': 'sdhub-tab-button-shell',
  'Gallery': 'sdhub-tab-button-gallery'
};

function getSDHubTranslation(key, count = 1) {
  let lang = navigator.language || navigator.languages[0] || 'en';

  if (key === 'item' || key === 'items') {
    if (SDHubTranslations[lang] && SDHubTranslations[lang][key]) return SDHubTranslations[lang][key];
    if (SDHubTranslations['en'] && SDHubTranslations['en'][key]) return SDHubTranslations['en'][key];
    return count === 1 ? 'item' : 'items';
  }

  if (SDHubTranslations[lang] && SDHubTranslations[lang][key]) return SDHubTranslations[lang][key];
  if (SDHubTranslations['en'] && SDHubTranslations['en'][key]) return SDHubTranslations['en'][key];
  return key;
}

function SDHubTabTranslation() {
  let TabList = gradioApp().querySelectorAll('#sdhub-tab > .tab-nav > button');

  TabList.forEach(button => {
    let t = button.textContent.trim();
    if (SDHubTabButtons[t]) button.id = SDHubTabButtons[t];
    let c = getSDHubTranslation(t.toLowerCase());
    if (c) button.textContent = c;
  });

  ['.sdhub-downloader-tab-title', '.sdhub-uploader-tab-title'].forEach(tab => {
    let title = document.querySelector(tab);
    if (title) {
      let key = tab === '.sdhub-downloader-tab-title' ? 'download_command_center' : 'upload_to_huggingface';
      if (title.lastChild?.nodeType === Node.TEXT_NODE) title.lastChild.textContent = getSDHubTranslation(key);
    }
  });

  const EL = [
    { element: '#sdhub-dataframe-accordion > div > span:nth-child(1)', key: 'tag_list' },
    { element: '#sdhub-tag-dataframe > div > div > div > table > thead > tr > th:nth-child(1) > div > span', key: 'sdhub_tags' },
    { element: '#sdhub-tag-dataframe > div > div > div > table > thead > tr > th:nth-child(2) > div > span', key: 'webui_paths' },
    { element: '#sdhub-downloader-token1 > label > span', key: 'huggingface_token_read' },
    { element: '#sdhub-downloader-token1 > label > input', key: 'huggingface_token_placeholder_read' },
    { element: '#sdhub-downloader-token2 > label > span', key: 'civitai_api_key' },
    { element: '#sdhub-downloader-token2 > label > input', key: 'civitai_api_key_placeholder' },
    { element: '#sdhub-downloader-download-button', key: 'download' },
    { element: '#sdhub-downloader-scrape-button', key: 'scrape' },
    { element: '#sdhub-downloader-txt-button', key: 'insert_txt' },
    { element: '#sdhub-downloader-load-button', key: 'load' },
    { element: '#sdhub-downloader-save-button', key: 'save' },
    { element: '#sdhub-uploader-token > label > span', key: 'huggingface_token_write' },
    { element: '#sdhub-uploader-token > label > input', key: 'huggingface_token_placeholder_write' },
    { element: '#sdhub-uploader-inputs > label > textarea', key: 'input_path' },
    { element: '#sdhub-uploader-upload-button', key: 'upload' },
    { element: '#sdhub-uploader-load-button', key: 'load' },
    { element: '#sdhub-uploader-save-button', key: 'save' },
    { element: '#sdhub-uploader-username-box > label > span', key: 'username' },
    { element: '#sdhub-uploader-username-box > label > input', key: 'username' },
    { element: '#sdhub-uploader-repo-box > label > span', key: 'repository' },
    { element: '#sdhub-uploader-repo-box > label > input', key: 'repository' },
    { element: '#sdhub-uploader-branch-box > label > span', key: 'branch' },
    { element: '#sdhub-uploader-branch-box > label > input', key: 'branch' },
    { element: '#sdhub-uploader-radio-box > span', key: 'visibility' },
    { element: '#sdhub-uploader-radio-box > div > label:nth-child(1) > span', key: 'public2' },
    { element: '#sdhub-uploader-radio-box > div > label:nth-child(2) > span', key: 'private' },
    { element: '#sdhub-archiver-accordion-zipoutputs > div > span:nth-child(1)', key: 'zip_outputs' },
    { element: '#sdhub-archiver-zipoutputs-inputname > label > input', key: 'zipoutputs_input' },
    { element: '#sdhub-archiver-zipoutputs-outputpath > label > input', key: 'zipoutputs_output' },
    { element: '#sdhub-archiver-zipoutputs-checkbox > label > span', key: 'makedir' },
    { element: '#sdhub-archiver-arc-title', key: 'arc_title' },
    { element: '#sdhub-archiver-radio-format > span', key: 'radio_format' },
    { element: '#sdhub-archiver-radio-split > span', key: 'radio_split' },
    { element: '#sdhub-archiver-radio-split > div > label:nth-child(1) > span', key: 'none' },
    { element: '#sdhub-archiver-arc-inputname > label > input', key: 'name' },
    { element: '#sdhub-archiver-arc-inputpath > label > input', key: 'input_path' },
    { element: '#sdhub-archiver-arc-outputpath > label > input', key: 'output_path' },
    { element: '#sdhub-archiver-arc-button', key: 'arc_button' },
    { element: '#sdhub-archiver-arc-checkbox > label > span', key: 'makedir' },
    { element: '#sdhub-archiver-extr-title', key: 'extr_title' },
    { element: '#sdhub-archiver-extr-inputpath > label > input', key: 'input_path' },
    { element: '#sdhub-archiver-extr-outputpath > label > input', key: 'output_path' },
    { element: '#sdhub-archiver-extr-button', key: 'extr_button' },
    { element: '#sdhub-archiver-extr-checkbox > label > span', key: 'makedir' },
    { element: '#sdhub-texteditor-load-button', key: 'load' },
    { element: '#sdhub-texteditor-save-button', key: 'save' },
    { element: '#sdhub-texteditor-inputs > label > input', key: 'file_path' },
    { element: '#sdhub-shell-inputs > label > textarea', key: 'shell_cmd' }
  ];

  EL.forEach(({ element, key }) => {
    let el = document.querySelector(element);
    if (el) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = getSDHubTranslation(key);
      else if (el.tagName === 'BUTTON') el.textContent = getSDHubTranslation(key.toLowerCase());
      else el.textContent = getSDHubTranslation(key);
    }
  });
}

function SDHubParseXLSX(data) {
  SDHubTranslations = Object.fromEntries(Object.keys(SDHubLangIndex).map(lang => [lang, {}]));

  data.slice(1).filter(row => row[0] && !row[0].startsWith("//")).forEach(row => {
    const key = row[0]?.trim();
    if (!key) return;

    Object.entries(SDHubLangIndex).forEach(([lang, index]) => {
      SDHubTranslations[lang][key] = row[index]?.trim() || key;
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const reader = document.createElement('script');
  reader.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  reader.onload = () => {
    window.getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)[0];
    const path = getRunningScript().match(/file=[^\/]+\/[^\/]+\//)?.[0];
    const file = `${path}sd-hub-translations.xlsx`;

    fetch(file)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const book = XLSX.read(arrayBuffer, { type: 'array' });
        const name = book.SheetNames[0];
        const sheet = book.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        SDHubParseXLSX(data);
        SDHubGalleryDOMLoaded(path);
      })
      .catch(err => console.error("XLSX Error :", err));
  };

  document.head.appendChild(reader);
});
