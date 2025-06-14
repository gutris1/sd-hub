let SDHubBnS = 'sdhub-body-no-scrolling';

let SDHubTabButtons = {
  'Downloader': 'SDHub-Tab-Button-Downloader',
  'Uploader': 'SDHub-Tab-Button-Uploader',
  'Archiver': 'SDHub-Tab-Button-Archiver',
  'Text Editor': 'SDHub-Tab-Button-Texteditor',
  'Shell': 'SDHub-Tab-Button-Shell',
  'Gallery': 'SDHub-Tab-Button-Gallery'
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

onUiLoaded(() => {
  SDHubTabLoaded();
  SDHubTokenBlur();
  SDHubEventListener();
  SDHubUITranslation();
  onUiUpdate(SDHubTabChange);
});

function SDHubTabChange() {
  let infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
  let TagList = document.getElementById('SDHub-Tag-Accordion');
  let MainTab = document.querySelector('#tabs > .tab-nav > button.selected');
  let TabList = document.querySelectorAll('#SDHub-Tab > .tab-nav > button') || [];
  let SelectedTab = document.querySelector('#SDHub-Tab > .tab-nav > button.selected');
  let Id = 'SDHub-Hide-Scroll-Bar';

  if (TabList.length > 0) {
    TabList.forEach(btn => {
      let text = btn.textContent.trim();
      let id = SDHubTabButtons[text];
      if (id && btn.id !== id) btn.id = id;
      let translated = SDHubGetTranslation(text.toLowerCase());
      if (translated && btn.textContent !== translated) btn.textContent = translated;
    });
  }

  let TextEditorTab = SelectedTab?.id === 'SDHub-Tab-Button-Texteditor';
  let GalleryTab = SelectedTab?.id === 'SDHub-Tab-Button-Gallery';

  let footer = document.getElementById('footer');
  let repo = document.getElementById('SDHub-Repo');

  if (TextEditorTab || GalleryTab) {
    TagList && (TagList.style.display = 'none');

    const v = GalleryTab ? 'none' : '';
    repo?.style && (repo.style.display = v);
    footer?.style && (footer.style.display = v);

    if (GalleryTab) window.SDHubGalleryArrowScrolling();

    if (!document.getElementById(Id)) {
      const Scrollbar = document.createElement('style');
      Scrollbar.id = Id;
      Scrollbar.innerHTML = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
      document.head.appendChild(Scrollbar);
    }

    Object.assign(document.documentElement.style, { scrollbarWidth: 'none' });

  } else {
    TagList && (TagList.style.display = '');

    if (repo || footer) repo.style.display = footer.style.display = '';

    document.getElementById(Id)?.remove();
    Object.assign(document.documentElement.style, { scrollbarWidth: '' });
    document.body.classList.remove(SDHubBnS);
  }

  if (MainTab?.textContent.trim() !== 'HUB') {
    if (footer) footer.style.display = '';
    document.getElementById(Id)?.remove();
    Object.assign(document.documentElement.style, { scrollbarWidth: '' });
    document.body.classList.remove(SDHubBnS);
    if (infoColumn?.style.display === 'flex') window.SDHubGalleryInfoClearImage();
  }

  if (GalleryTab && infoColumn?.style.display === 'flex') {
    if (!document.body.classList.contains(SDHubBnS)) {
      document.body.classList.add(SDHubBnS);
    }
  }
}

async function SDHubTabLoaded() {
  const titles = {
    'SDHub-Downloader-Load-Button': 'load_token',
    'SDHub-Downloader-Save-Button': 'save_token',
    'SDHub-Uploader-Load-Button': 'load_token',
    'SDHub-Uploader-Save-Button': 'save_token'
  };

  for (const [id, key] of Object.entries(titles)) {
    const button = document.getElementById(id);
    if (button) button.setAttribute('title', SDHubGetTranslation(key));
  }  

  document.getElementById('SDHub-Texteditor-Load-Button')?.setAttribute('title', SDHubGetTranslation('load_file'));
  document.getElementById('SDHub-Texteditor-Save-Button')?.setAttribute('title', SDHubGetTranslation('save_changes'));
  setTimeout(() => document.getElementById('SDHub-Texteditor-Initial-Load')?.click(), 2000);

  try {
    const res = await fetch('/sd-hub/LoadUploaderInfo');
    const { username, repository, branch } = await res.json();

    [['Username', username], ['Repo', repository], ['Branch', branch]].forEach(([id, v]) => {
      const input = document.querySelector(`#SDHub-Uploader-${id}-Box input`);
      input && (input.value = v, updateInput(input));
    });
  } catch (e) { console.error('Error loading info:', e); }
}

function SDHubEventListener() {
  const Tab = {
    shell: document.getElementById('SDHub-Shell-Tab'),
    textEditor: document.getElementById('SDHub-Texteditor-Tab')
  };

  const Button = {
    shell: document.getElementById('SDHub-Shell-Button'),
    textEditor: document.getElementById('SDHub-Texteditor-Save-Button')
  };

  document.addEventListener('keydown', (e) => {
    if (Tab.shell?.style.display === 'block' && e.shiftKey && e.key === 'Enter') Button.shell?.click();
    if (Tab.textEditor?.style.display === 'block' && e.ctrlKey && e.key === 's') (e.preventDefault(), Button.textEditor?.click());
  });

  document.addEventListener('click', (e) => {
    const td = e.target.closest('#SDHub-Tag-Dataframe td');
    const text = td?.querySelector('span')?.textContent;
    if (text) (navigator.clipboard.writeText(text), td.classList.add('pulse-td'), setTimeout(() => td.classList.remove('pulse-td'), 2000));
  });

  const Inputs = {
    token1: '#SDHub-Downloader-Token-1 input',
    token2: '#SDHub-Downloader-Token-2 input',
    token3: '#SDHub-Uploader-Token input'
  };

  Object.values(Inputs).forEach(el => {
    document.querySelectorAll(el).forEach(input => {
      input.addEventListener('blur', () => input.value.trim() !== '' && (input.style.filter = 'blur(3px)'));
      input.addEventListener('focus', () => (input.style.filter = 'none'));
    });
  });
}

async function SDHubTokenBlur() {
  ['#SDHub-Downloader-Token-1 input', '#SDHub-Downloader-Token-2 input', '#SDHub-Uploader-Token input']
    .forEach(id => {
      const el = document.querySelector(id);
      if (el) el.style.filter = el.value.trim() ? 'blur(3px)' : 'none';
    }
  );
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
  const info = document.querySelector('#SDHub-Texteditor-Info input');
  if (info && flag.trim() !== '') {
    info.style.transition = 'opacity 0.5s ease';
    info.style.opacity = '1';
    setTimeout(() => Object.assign(info.style, { transition: 'opacity 2s ease', opacity: '0' }), 2000);
  }
}

function SDHubTextEditorGalleryScrollBar() {
  const FoxFire = /firefox/i.test(navigator.userAgent);
  const ScrollBAR = document.createElement('style');
  document.body.appendChild(ScrollBAR);

  const SBforFirefox = `
    #SDHub-Gallery-Setting-Box {
      scrollbar-width: thin !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }

    #SDHub-Texteditor-Editor,
    .sdhub-gallery-pages.selected-page {
      scrollbar-width: none !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }

    #SDHub-Gallery-Image-Viewer,
    #SDHub-Gallery-Delete-Container {
      backdrop-filter: none !important;
    }
  `;

  const SBwebkit = `
    .sdhub-gallery-pages.selected-page {
      scrollbar-width: none !important;
    }

    #SDHub-Gallery-Setting-Box::-webkit-scrollbar,
    #SDHub-Texteditor-Editor::-webkit-scrollbar {
      width: 0.4rem !important;
      position: absolute !important;
      right: 4px !important;
    }

    #SDHub-Gallery-Setting-Box::-webkit-scrollbar-thumb,
    #SDHub-Texteditor-Editor::-webkit-scrollbar-thumb {
      background: var(--primary-400) !important;
      border-radius: 30px !important;
      background-clip: padding-box !important;
    }

    #SDHub-Gallery-Setting-Box::-webkit-scrollbar-thumb:hover,
    #SDHub-Texteditor-Editor::-webkit-scrollbar-thumb:hover {
      background: var(--primary-600) !important;
    }

    #SDHub-Texteditor-Editor::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 2px 0 !important;
    }

    #SDHub-Gallery-Setting-Box::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 8px 0 !important;
    }
  `;

  ScrollBAR.innerHTML = FoxFire ? SBforFirefox : SBwebkit;
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
  let TabList = gradioApp().querySelectorAll('#SDHub-Tab > .tab-nav > button');

  for (let i = 0; i < TabList.length; i++) {
    let btn = TabList[i];
    let t = btn.textContent.trim();

    let id = SDHubTabButtons[t];
    if (id && btn.id !== id) btn.id = id;

    let c = SDHubGetTranslation(t.toLowerCase());
    if (c) btn.textContent = c;
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
    { element: '#SDHub-Tag-Accordion > button > span:nth-child(1)', key: 'tag_list' },
    { element: '#SDHub-Tag-Dataframe > div > div > button > svelte-virtual-table-viewport > table > thead > tr > th:nth-child(1) > div > span', key: 'sdhub_tags' },
    { element: '#SDHub-Tag-Dataframe > div > div > button > svelte-virtual-table-viewport > table > thead > tr > th:nth-child(2) > div > span', key: 'webui_paths' }
  ] : [
    { element: '#SDHub-Tag-Accordion > div > span:nth-child(1)', key: 'tag_list' },
    { element: '#SDHub-Tag-Dataframe > div > div > div > table > thead > tr > th:nth-child(1) > div > span', key: 'sdhub_tags' },
    { element: '#SDHub-Tag-Dataframe > div > div > div > table > thead > tr > th:nth-child(2) > div > span', key: 'webui_paths' }
  ];

  const EL = [
    ...isThatForge,
    { element: '.sdhub-downloader-tab-info', key: 'downloader_tab_info', inner: true },
    { element: '.sdhub-uploader-tab-info', key: 'uploader_tab_info', inner: true },
    { element: '.sdhub-archiver-tab-info', key: 'archiver_tab_info', inner: true },
    { element: '#SDHub-Downloader-Token-1 > label > span', key: 'huggingface_token_read' },
    { element: '#SDHub-Downloader-Token-1 > label > input', key: 'huggingface_token_placeholder', spellcheck: false },
    { element: '#SDHub-Downloader-Token-2 > label > span', key: 'civitai_api_key' },
    { element: '#SDHub-Downloader-Token-2 > label > input', key: 'civitai_api_key_placeholder', spellcheck: false },
    { element: '#SDHub-Downloader-Input > label > textarea', spellcheck: false },
    { element: '#SDHub-Downloader-Download-Button', key: 'download' },
    { element: '#SDHub-Downloader-Scrape-Button', key: 'scrape' },
    { element: '#SDHub-Downloader-Txt-Button', key: 'insert_txt' },
    { element: '#SDHub-Downloader-Load-Button', key: 'load' },
    { element: '#SDHub-Downloader-Save-Button', key: 'save' },
    { element: '#SDHub-Uploader-Token > label > span', key: 'huggingface_token_write' },
    { element: '#SDHub-Uploader-Token > label > input', key: 'huggingface_token_placeholder', spellcheck: false },
    { element: '#SDHub-Uploader-Input > label > textarea', key: 'input_path', spellcheck: false },
    { element: '#SDHub-Uploader-Upload-Button', key: 'upload' },
    { element: '#SDHub-Uploader-Load-Button', key: 'load' },
    { element: '#SDHub-Uploader-Save-Button', key: 'save' },
    { element: '#SDHub-Uploader-Username-Box > label > span', key: 'username' },
    { element: '#SDHub-Uploader-Username-Box > label > input', key: 'username', spellcheck: false },
    { element: '#SDHub-Uploader-Repo-Box > label > span', key: 'repository' },
    { element: '#SDHub-Uploader-Repo-Box > label > input', key: 'repository', spellcheck: false },
    { element: '#SDHub-Uploader-Branch-Box > label > span', key: 'branch' },
    { element: '#SDHub-Uploader-Branch-Box > label > input', key: 'branch', spellcheck: false },
    { element: '#SDHub-Uploader-Radio-Box > span', key: 'visibility' },
    { element: '#SDHub-Uploader-Radio-Box > div > label:nth-child(1) > span', key: 'public2' },
    { element: '#SDHub-Uploader-Radio-Box > div > label:nth-child(2) > span', key: 'private' },
    { element: '#SDHub-Archiver-ZipOutputs-Accordion > div > span:nth-child(1)', key: 'zip_outputs' },
    { element: '#SDHub-Archiver-ZipOutputs-Input-Name > label > input', key: 'zipoutputs_input', spellcheck: false },
    { element: '#SDHub-Archiver-ZipOutputs-Output-Path > label > input', key: 'zipoutputs_output', spellcheck: false },
    { element: '#SDHub-Archiver-ZipOutputs-Checkbox > label > span', key: 'makedir' },
    { element: '#SDHub-Archiver-Archive-Title', key: 'arc_title' },
    { element: '#SDHub-Archiver-Archive-Input-Name > label > input', key: 'name', spellcheck: false },
    { element: '#SDHub-Archiver-Archive-Input-Path > label > input', key: 'input_path', spellcheck: false },
    { element: '#SDHub-Archiver-Archive-Output-Path > label > input', key: 'output_path', spellcheck: false },
    { element: '#SDHub-Archiver-Archive-Button', key: 'arc_button' },
    { element: '#SDHub-Archiver-Archive-Checkbox > label > span', key: 'makedir' },
    { element: '#SDHub-Archiver-Radio-Format > span', key: 'radio_format' },
    { element: '#SDHub-Archiver-Radio-Split > span', key: 'radio_split' },
    { element: '#SDHub-Archiver-Radio-Split > div > label:nth-child(1) > span', key: 'none' },
    { element: '#SDHub-Archiver-Extract-Title', key: 'extr_title' },
    { element: '#SDHub-Archiver-Extract-Input-Path > label > input', key: 'input_path', spellcheck: false },
    { element: '#SDHub-Archiver-Extract-Output-Path > label > input', key: 'output_path', spellcheck: false },
    { element: '#SDHub-Archiver-Extract-Button', key: 'extr_button' },
    { element: '#SDHub-Archiver-Extract-Checkbox > label > span', key: 'makedir' },
    { element: '#SDHub-Texteditor-Load-Button', key: 'load' },
    { element: '#SDHub-Texteditor-Save-Button', key: 'save' },
    { element: '#SDHub-Texteditor-Input > label > input', key: 'file_path', spellcheck: false },
    { element: '#SDHub-Shell-Input > label > textarea', key: 'shell_cmd', spellcheck: false },
    { element: '#SDHub-Gallery-Info-SendButton > #txt2img_tab', key: 'send_txt2img' },
    { element: '#SDHub-Gallery-Info-SendButton > #img2img_tab', key: 'send_img2img' },
    { element: '#SDHub-Gallery-Info-SendButton > #inpaint_tab', key: 'send_inpaint' },
    { element: '#SDHub-Gallery-Info-SendButton > #extras_tab', key: 'send_extras' },
    { element: '#SDHub-Gallery-imgchest-API > label > input', spellcheck: false }
  ];

  for (const { element, key, inner, spellcheck } of EL) {
    const el = document.querySelector(element);
    if (!el) continue;

    if (key) {
      const translate = SDHubGetTranslation(key);
      inner ? (el.innerHTML = translate) : el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' 
              ? (el.placeholder = translate, spellcheck === false && (el.spellcheck = false)) : (el.textContent = translate);
    }

    spellcheck === false && (el.spellcheck = false);
  }
}

async function SDHubRGBA() {
  const vars = [
    { c: '--input-background-fill', to: '--sdhub-gallery-output-bg', a: 0.6 },
  ];

  const css = await (await fetch('/theme.css')).text();
  const get = s => Object.fromEntries((css.match(new RegExp(`${s}\\s*{([^}]*)}`, 'm'))?.[1] || '').split(';').map(l => l.trim().split(':').map(s => s.trim())).filter(([k, v]) => k && v));
  const toRGBA = (hex, a) => hex && /^#/.test(hex) ? `rgba(${hex.slice(1).match(/.{2}/g).map(v => parseInt(v, 16)).join(',')},${a})` : 'rgba(0,0,0,0)';
  const r = get(':root'), d = get('.dark'), S = document.createElement('style');
  vars.forEach(({ c, to, a }) => { S.textContent += `:root { ${to}: ${toRGBA(r[c], a)}; }\n.dark { ${to}: ${toRGBA(d[c], a)}; }\n`; });
  document.head.append(S);
}

document.addEventListener('DOMContentLoaded', async function () {
  await new Promise(resolve => (function check() { window.XLSX ? resolve() : setTimeout(check, 50); })());

  try {
    window.getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)?.[0];
    const path = getRunningScript()?.match(/file=[^\/]+\/[^\/]+\//)?.[0];
    if (path) window.SDHubFilePath = path;

    const res = await fetch(`${path}sd-hub-translations.xlsx?ts=${Date.now()}`);
    if (res.ok) {
      const book = XLSX.read(await res.arrayBuffer(), { type: 'array' });
      const data = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1 });

      SDHubTranslations = Object.fromEntries(Object.keys(SDHubLangIndex).map(lang => [lang, {}]));
      data.slice(1).forEach(row => {
        if (row[0] && !row[0].startsWith('//')) {
          const key = row[0].trim();
          Object.keys(SDHubLangIndex).forEach(lang => {
            SDHubTranslations[lang][key] = row[SDHubLangIndex[lang]]?.trim() || key;
          });
        }
      });

      SDHubTextEditorGalleryScrollBar();
      SDHubGalleryDOMLoaded();
      SDHubRGBA();
    }
  } catch (err) { console.error('XLSX Error:', err); }
});
