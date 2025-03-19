let SDHubTabButtons = {
  'Downloader': 'sdhub-tab-button-downloader',
  'Uploader': 'sdhub-tab-button-uploader',
  'Archiver': 'sdhub-tab-button-archiver',
  'Text Editor': 'sdhub-tab-button-texteditor',
  'Shell': 'sdhub-tab-button-shell',
  'Gallery': 'sdhub-tab-button-gallery'
};

let SDHubLangIndex = {
  en: 1,
  ja: 2,
  'zh-CN': 3,
  'zh-TW': 4,
  es: 5,
  ko: 6,
  ru: 7
};

let SDHubTranslations = {};

onUiLoaded(async function () {
  SDHubTabLoaded();
  SDHubTokenBlur();
  SDHubEvents();
  SDHubUITranslation();
  SDHubOnTabChange();
});

async function SDHubTabLoaded() {
  [
    ['sdhub-downloader-load-button', 'Load Token'],
    ['sdhub-downloader-save-button', 'Save Token'],
    ['sdhub-uploader-load-button', 'Load Token'],
    ['sdhub-uploader-save-button', 'Save Token']
  ].forEach(([id, title]) => document.getElementById(id)?.setAttribute('title', title));

  document.getElementById('sdhub-texteditor-load-button')?.setAttribute('title', 'Load File');
  document.getElementById('sdhub-texteditor-save-button')?.setAttribute('title', 'Save changes');
  setTimeout(() => document.getElementById('sdhub-texteditor-initial-load')?.click(), 2000);

  try {
    const res = await fetch('/sd-hub/LoadUploaderInfo');
    const { username, repository, branch } = await res.json();

    [['username', username], ['repo', repository], ['branch', branch]].forEach(([id, v]) => {
      const input = document.querySelector(`#sdhub-uploader-${id}-box input`);
      input && (input.value = v, updateInput(input));
    });
  } catch (e) { console.error('Error loading info:', e); }
}

function SDHubEvents() {
  const Tab = {
    shell: document.querySelector('#sdhub-shell-tab'),
    textEditor: document.querySelector('#sdhub-texteditor-tab')
  };

  const Button = {
    shell: document.querySelector('#sdhub-shell-button'),
    textEditor: document.querySelector('#sdhub-texteditor-save-button')
  };

  document.addEventListener('keydown', (e) => {
    if (Tab.shell?.style.display === 'block' && e.shiftKey && e.key === 'Enter') {
      Button.shell?.click();
    }

    if (Tab.textEditor?.style.display === 'block' && e.ctrlKey && e.key === 's') {
      e.preventDefault();
      Button.textEditor?.click();
    }
  });

  document.addEventListener('click', (e) => {
    const td = e.target.closest('#sdhub-tag-dataframe td');
    const text = td?.querySelector('span')?.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      td.classList.add('pulse-td');
      setTimeout(() => td.classList.remove('pulse-td'), 2000);
    }
  });
}

async function SDHubTokenBlur() {
  ['#sdhub-downloader-token1 input', '#sdhub-downloader-token2 input', '#sdhub-uploader-token input']
    .forEach(id => {
      const el = document.querySelector(id);
      if (el) el.style.filter = el.value.trim() ? 'blur(3px)' : 'none';
    });
}

async function SDHubDownloader() {
  let inputs = window.SDHubDownloaderInputsValue;
  if (!inputs?.trim()) return;

  const TagMap = {
    '$ckpt': ['txt2img_checkpoints_extra_refresh', 'img2img_checkpoints_extra_refresh', 'refresh_sd_model_checkpoint'],
    '$vae': ['refresh_sd_vae'],
    '$lora': ['txt2img_lora_extra_refresh', 'img2img_lora_extra_refresh'],
    '$emb': ['txt2img_textual_inversion_extra_refresh', 'img2img_textual_inversion_extra_refresh'],
    '$hn': ['txt2img_hypernetworks_extra_refresh', 'img2img_hypernetworks_extra_refresh'],
    '$cn': ['txt2img_controlnet_ControlNet-0_controlnet_refresh_models', 'img2img_controlnet_ControlNet-0_controlnet_refresh_models']
  };

  Object.entries(TagMap).forEach(([tags, buttons]) => {
    const Tag = new RegExp(`\\${tags}(\\/|\\s|$)`);
    if (Tag.test(inputs)) buttons.forEach(id => document.getElementById(id)?.click());
  });
}

async function SDHubTextEditorInfo(flag) {
  const info = document.querySelector('#sdhub-texteditor-info input');
  if (info && flag.trim() !== '') {
    info.style.transition = 'opacity 0.5s ease';
    info.style.opacity = '1';
    setTimeout(() => Object.assign(info.style, { transition: 'opacity 2s ease', opacity: '0' }), 2000);
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

function SDHubOnTabChange() {
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
              let c = SDHubGetTranslation(t.toLowerCase());
              if (c) button.textContent = c;
            });

            let Tab = SelectedTab?.id;

            if (Tab === 'sdhub-tab-button-texteditor' || Tab === 'sdhub-tab-button-gallery') {
              Accordion.style.display = 'none';
              if (!document.getElementById(Id)) {
                const Scrollbar = document.createElement('style');
                Scrollbar.id = Id;
                Scrollbar.innerHTML = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
                document.head.appendChild(Scrollbar);
              }
              Object.assign(document.documentElement.style, { scrollbarWidth: 'none' });

            } else if (Tab !== 'sdhub-tab-button-texteditor' && Tab !== 'sdhub-tab-button-gallery') {
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

function SDHubGetTranslation(key, count = 1) {
  let lang = navigator.language || navigator.languages[0] || 'en';
  let translate = SDHubTranslations[lang] ?? SDHubTranslations['en'] ?? {};

  if (key === 'item' || key === 'items') {
    return (count > 1 ? translate['items'] : translate['item']) ?? (count > 1 ? 'items' : 'item');
  }

  return translate[key] ?? key;
}

function SDHubUITranslation() {
  let ForgeCheck = document.querySelector('.gradio-container-4-40-0') !== null;
  let TabList = gradioApp().querySelectorAll('#sdhub-tab > .tab-nav > button');

  for (let i = 0; i < TabList.length; i++) {
    let button = TabList[i];
    let t = button.textContent.trim();
    if (SDHubTabButtons[t]) button.id = SDHubTabButtons[t];
    let c = SDHubGetTranslation(t.toLowerCase());
    if (c) button.textContent = c;
  }

  let tabs = ['.sdhub-downloader-tab-title', '.sdhub-uploader-tab-title'];
  for (let i = 0; i < tabs.length; i++) {
    let tab = tabs[i];
    let title = document.querySelector(tab);
    if (title) {
      let key = tab === '.sdhub-downloader-tab-title' ? 'download_command_center' : 'upload_to_huggingface';
      if (title.lastChild?.nodeType === Node.TEXT_NODE) title.lastChild.textContent = SDHubGetTranslation(key);
    }
  }

  const isThatForge = ForgeCheck ? [
    { element: '#sdhub-dataframe-accordion > button > span:nth-child(1)', key: 'tag_list' },
    { element: '#sdhub-tag-dataframe > div > div > button > svelte-virtual-table-viewport > table > thead > tr > th:nth-child(1) > div > span', key: 'sdhub_tags' },
    { element: '#sdhub-tag-dataframe > div > div > button > svelte-virtual-table-viewport > table > thead > tr > th:nth-child(2) > div > span', key: 'webui_paths' }
  ] : [
    { element: '#sdhub-dataframe-accordion > div > span:nth-child(1)', key: 'tag_list' },
    { element: '#sdhub-tag-dataframe > div > div > div > table > thead > tr > th:nth-child(1) > div > span', key: 'sdhub_tags' },
    { element: '#sdhub-tag-dataframe > div > div > div > table > thead > tr > th:nth-child(2) > div > span', key: 'webui_paths' }
  ];

  const EL = [
    ...isThatForge,
    { element: '.sdhub-downloader-tab-info', key: 'downloader_tab_info', inner: true },
    { element: '.sdhub-uploader-tab-info', key: 'uploader_tab_info', inner: true },
    { element: '.sdhub-archiver-tab-info', key: 'archiver_tab_info', inner: true },
    { element: '#sdhub-downloader-token1 > label > span', key: 'huggingface_token_read' },
    { element: '#sdhub-downloader-token1 > label > input', key: 'huggingface_token_placeholder', spellcheck: false },
    { element: '#sdhub-downloader-token2 > label > span', key: 'civitai_api_key' },
    { element: '#sdhub-downloader-token2 > label > input', key: 'civitai_api_key_placeholder', spellcheck: false },
    { element: '#sdhub-downloader-inputs > label > textarea', spellcheck: false },
    { element: '#sdhub-downloader-download-button', key: 'download' },
    { element: '#sdhub-downloader-scrape-button', key: 'scrape' },
    { element: '#sdhub-downloader-txt-button', key: 'insert_txt' },
    { element: '#sdhub-downloader-load-button', key: 'load' },
    { element: '#sdhub-downloader-save-button', key: 'save' },
    { element: '#sdhub-uploader-token > label > span', key: 'huggingface_token_write' },
    { element: '#sdhub-uploader-token > label > input', key: 'huggingface_token_placeholder', spellcheck: false },
    { element: '#sdhub-uploader-inputs > label > textarea', key: 'input_path', spellcheck: false },
    { element: '#sdhub-uploader-upload-button', key: 'upload' },
    { element: '#sdhub-uploader-load-button', key: 'load' },
    { element: '#sdhub-uploader-save-button', key: 'save' },
    { element: '#sdhub-uploader-username-box > label > span', key: 'username' },
    { element: '#sdhub-uploader-username-box > label > input', key: 'username', spellcheck: false },
    { element: '#sdhub-uploader-repo-box > label > span', key: 'repository' },
    { element: '#sdhub-uploader-repo-box > label > input', key: 'repository', spellcheck: false },
    { element: '#sdhub-uploader-branch-box > label > span', key: 'branch' },
    { element: '#sdhub-uploader-branch-box > label > input', key: 'branch', spellcheck: false },
    { element: '#sdhub-uploader-radio-box > span', key: 'visibility' },
    { element: '#sdhub-uploader-radio-box > div > label:nth-child(1) > span', key: 'public2' },
    { element: '#sdhub-uploader-radio-box > div > label:nth-child(2) > span', key: 'private' },
    { element: '#sdhub-archiver-accordion-zipoutputs > div > span:nth-child(1)', key: 'zip_outputs' },
    { element: '#sdhub-archiver-zipoutputs-inputname > label > input', key: 'zipoutputs_input', spellcheck: false },
    { element: '#sdhub-archiver-zipoutputs-outputpath > label > input', key: 'zipoutputs_output', spellcheck: false },
    { element: '#sdhub-archiver-zipoutputs-checkbox > label > span', key: 'makedir' },
    { element: '#sdhub-archiver-arc-title', key: 'arc_title' },
    { element: '#sdhub-archiver-radio-format > span', key: 'radio_format' },
    { element: '#sdhub-archiver-radio-split > span', key: 'radio_split' },
    { element: '#sdhub-archiver-radio-split > div > label:nth-child(1) > span', key: 'none' },
    { element: '#sdhub-archiver-arc-inputname > label > input', key: 'name', spellcheck: false },
    { element: '#sdhub-archiver-arc-inputpath > label > input', key: 'input_path', spellcheck: false },
    { element: '#sdhub-archiver-arc-outputpath > label > input', key: 'output_path', spellcheck: false },
    { element: '#sdhub-archiver-arc-button', key: 'arc_button' },
    { element: '#sdhub-archiver-arc-checkbox > label > span', key: 'makedir' },
    { element: '#sdhub-archiver-extr-title', key: 'extr_title' },
    { element: '#sdhub-archiver-extr-inputpath > label > input', key: 'input_path', spellcheck: false },
    { element: '#sdhub-archiver-extr-outputpath > label > input', key: 'output_path', spellcheck: false },
    { element: '#sdhub-archiver-extr-button', key: 'extr_button' },
    { element: '#sdhub-archiver-extr-checkbox > label > span', key: 'makedir' },
    { element: '#sdhub-texteditor-load-button', key: 'load' },
    { element: '#sdhub-texteditor-save-button', key: 'save' },
    { element: '#sdhub-texteditor-inputs > label > input', key: 'file_path', spellcheck: false },
    { element: '#sdhub-shell-inputs > label > textarea', key: 'shell_cmd', spellcheck: false },
    { element: '#SDHubimgInfoSendButton > #txt2img_tab', key: 'send_txt2img' },
    { element: '#SDHubimgInfoSendButton > #img2img_tab', key: 'send_img2img' },
    { element: '#SDHubimgInfoSendButton > #inpaint_tab', key: 'send_inpaint' },
    { element: '#SDHubimgInfoSendButton > #extras_tab', key: 'send_extras' },
    { element: '#SDHub-Gallery-imgchest-API > label > input', spellcheck: false }
  ];

  for (const { element, key, inner, spellcheck } of EL) {
    const el = document.querySelector(element);
    if (!el) continue;

    if (key) {
      const translate = SDHubGetTranslation(key);
      inner ? (el.innerHTML = translate)
            : el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' 
              ? (el.placeholder = translate, spellcheck === false && (el.spellcheck = false)) 
              : (el.textContent = translate);
    }

    spellcheck === false && (el.spellcheck = false);
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  const script = document.createElement('script');
  script.id = 'SDHub-XLSX';
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  script.onload = async () => {
    try {
      window.getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)[0];
      window.SDHubFilePath = getRunningScript().match(/file=[^\/]+\/[^\/]+\//)?.[0];

      const file = `${window.SDHubFilePath}sd-hub-translations.xlsx`;
      const response = await fetch(file);
      const arrayBuffer = await response.arrayBuffer();
      const book = XLSX.read(arrayBuffer, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1 });

      const langKeys = Object.keys(SDHubLangIndex);
      SDHubTranslations = Object.fromEntries(langKeys.map(lang => [lang, {}]));

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0] || row[0].startsWith("//")) continue;

        const key = row[0].trim();
        if (!key) continue;

        langKeys.forEach(lang => SDHubTranslations[lang][key] = row[SDHubLangIndex[lang]]?.trim() || key);
      }

      SDHubTextEditorGalleryScrollBar();
      SDHubGalleryDOMLoaded();
    } catch (err) { console.error("XLSX Error:", err); }
  };

  document.head.appendChild(script);
});
