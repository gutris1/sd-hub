let SDHubBnS = 'sdhub-body-no-scrolling',
sdhubS = 'sdhub-style',
sdhubScale = 'scale(var(--sdhub-scale))',

SDHubTabButtons = {
  'Downloader': 'SDHub-Tab-Button-Downloader',
  'Uploader': 'SDHub-Tab-Button-Uploader',
  'Archiver': 'SDHub-Tab-Button-Archiver',
  'Text Editor': 'SDHub-Tab-Button-Texteditor',
  'Shell': 'SDHub-Tab-Button-Shell',
  'Gallery': 'SDHub-Tab-Button-Gallery'
},

SDHubLangIndex = {
  en: 1,
  ja: 2,
  'zh-CN': 3,
  'zh-TW': 4,
  ko: 5
},

SDHubTranslations = {};

onUiLoaded(() => {
  SDHubTabLoaded();
  SDHubTokenBlur();
  SDHubEventListener();
  SDHubUITranslation();
  SDHubCreateGallery();
  onUiUpdate(SDHubTabChange);
});

function SDHubTabChange() {
  const imginfoRow = document.getElementById(`${SDHGiI}-Row`),
  tagList = document.getElementById('SDHub-Tag-Accordion'),
  nav = document.querySelector('#tabs > .tab-nav'),
  navbtn = nav?.querySelector('button.selected'),
  hubnav = document.querySelectorAll('#SDHub-Tab > .tab-nav > button') || [],
  selected = document.querySelector('#SDHub-Tab > .tab-nav > button.selected'),

  HUB = navbtn?.textContent.trim() === 'HUB',
  TextEditor = selected?.id === 'SDHub-Tab-Button-Texteditor',
  Gallery = selected?.id === 'SDHub-Tab-Button-Gallery',

  repo = document.getElementById('SDHub-Repo'),

  infoCon = document.getElementById('SDHub-Gallery-Info-Container'),

  ScrollBar = (f) => {
    const Id = 'SDHub-Hide-Scroll-Bar', sb = document.getElementById(Id);

    f === 'add' && !sb
      ? document.head.appendChild(Object.assign(document.createElement('style'), {
          id: Id,
          innerHTML: `
            html { scrollbar-width: none !important; }
            ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
          `
        }))
      : !f && sb?.remove();
  };

  if (hubnav.length > 0) {
    hubnav.forEach(btn => {
      const text = btn.textContent.trim();
      const id = SDHubTabButtons[text];
      if (id && btn.id !== id) btn.id = id;
      const translated = SDHubGetTranslation(text.toLowerCase());
      if (translated && btn.textContent !== translated) btn.textContent = translated;
    });
  }

  if (HUB) {
    if (TextEditor || Gallery) {
      tagList && (tagList.style.display = 'none');
      if (Gallery) {
        nav && (nav.style.borderColor = 'transparent');
        repo && (repo.style.display = 'none');
        window.SDHubGalleryPageArrowUpdate();
        infoCon.style.display === 'flex' && document.body.classList.add(SDHubBnS);
      }
      ScrollBar('add');

    } else {
      nav && (nav.style.borderColor = '');
      repo && (repo.style.display = '');
      tagList && (tagList.style.display = '');
      ScrollBar();
      document.body.classList.remove(SDHubBnS);
    }

  } else {
    ScrollBar();
    document.body.classList.remove(SDHubBnS);
    imginfoRow?.style.display === 'flex' && window.SDHubGalleryCloseImageInfo();
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
    const res = await fetch('/sd-hub/LoadUploaderInfo'),
    { username, repository, branch } = await res.json();

    [['Username', username], ['Repo', repository], ['Branch', branch]].forEach(([id, v]) => {
      const input = document.querySelector(`#SDHub-Uploader-${id}-Box input`);
      input && (input.value = v, updateInput(input));
    });
  } catch (e) { console.error('Error loading info:', e); }

  const table4 = document.querySelector('.gradio-container-4-40-0 #SDHub-Tag-Dataframe > div > div > table');
  table4 && (table4.style.opacity = '0', table4.style.pointerEvents = 'none');
}

function SDHubEventListener() {
  const Tab = {
    downloader: document.getElementById('SDHub-Downloader-Tab'),
    uploader: document.getElementById('SDHub-Uploader-Tab'),
    shell: document.getElementById('SDHub-Shell-Tab'),
    textEditor: document.getElementById('SDHub-Texteditor-Tab')
  };

  const Button = {
    downloader: document.getElementById('SDHub-Downloader-Download-Button'),
    uploader: document.getElementById('SDHub-Uploader-Upload-Button'),
    shell: document.getElementById('SDHub-Shell-Button'),
    textEditor: document.getElementById('SDHub-Texteditor-Save-Button')
  };

  document.addEventListener('keydown', e => {
    const C = el => el?.style.display === 'block',
    { key: k, shiftKey: s, ctrlKey: c } = e;

    if (!C(document.getElementById('tab_SDHub'))) return;

    if (s && k === 'Enter') (
      C(Tab.downloader) && Button.downloader?.click(),
      C(Tab.uploader) && Button.uploader?.click(),
      C(Tab.shell) && Button.shell?.click()
    );

    if (c && k === 's' && C(Tab.textEditor)) (e.preventDefault(), Button.textEditor?.click());
  });

  document.addEventListener('click', e => {
    const td = e.target.closest('#SDHub-Tag-Dataframe td'), text = td?.querySelector('span')?.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      td.style.transition = 'all .5s ease';
      void td.offsetWidth;
      td.classList.add('pulse-td');
      setTimeout(() => td.classList.remove('pulse-td'), 400);
      setTimeout(() => td.style.transition = '', 1000);
    }
  });

  const Inputs = {
    token1: '#SDHub-Downloader-HFR input',
    token2: '#SDHub-Downloader-CAK input',
    token3: '#SDHub-Uploader-HFW input'
  };

  Object.values(Inputs).forEach(el => {
    document.querySelectorAll(el).forEach(input => {
      input.addEventListener('blur', () => input.value.trim() !== '' && (input.style.filter = 'blur(3px)'));
      input.addEventListener('focus', () => (input.style.filter = 'none'));
    });
  });

  const archiveBtn = document.getElementById('SDHub-Archiver-Archive-Button');
  archiveBtn.onclick = async () => extractBtn.classList.add('sdhub-button-disabled');

  const extractBtn = document.getElementById('SDHub-Archiver-Extract-Button');
  extractBtn.onclick = async () => archiveBtn.classList.add('sdhub-button-disabled');

  document.querySelectorAll('#SDHub-Tab .sdhub-accordion > .label-wrap').forEach(label => {
    label.onclick = () => {
      const accordion = label.parentElement, content = accordion.lastElementChild,
      open = label.classList.contains('open'), c = 'sdhub-accordion-open', t = 'height .5s ease, opacity .4s ease, margin-top .3s ease';

      open
        ? (accordion.classList.add(c), Object.assign(content.style, { transition: '', height: content.scrollHeight + 'px', opacity: '1', marginTop: '.5em' }))
        : (accordion.classList.remove(c), Object.assign(content.style, { transition: t, height: '', opacity: '', marginTop: '' }));
    };
  });
}

async function SDHubTokenBlur() {
  ['#SDHub-Downloader-HFR input', '#SDHub-Downloader-CAK input', '#SDHub-Uploader-HFW input']
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

async function SDHubArchiver(v) {
  const archiveBtn = document.getElementById('SDHub-Archiver-Archive-Button'),
  extractBtn = document.getElementById('SDHub-Archiver-Extract-Button');

  if (v === 'finish') {
    archiveBtn.classList.remove('sdhub-button-disabled');
    extractBtn.classList.remove('sdhub-button-disabled');
  }
}

async function SDHubTextEditorInfo(v) {
  const info = document.querySelector('#SDHub-Texteditor-Info input');
  if (info && v.trim() !== '') {
    info.style.transition = 'opacity 0.5s ease';
    info.style.opacity = '1';
    setTimeout(() => Object.assign(info.style, { transition: 'opacity 2s ease', opacity: '0' }), 2000);
  }
}

function SDHubTextEditorGalleryScrollBar() {
  const FoxFire = /firefox/i.test(navigator.userAgent),
  ScrollBAR = document.createElement('style'),

  F = `
    #${SDHGS}-Box {
      scrollbar-width: thin !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }

    #SDHub-Texteditor-Editor,
    .${sdhgp}s.selected-page {
      scrollbar-width: none !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }

    #${SDHGiV},
    #SDHub-Gallery-Info-Container {
      backdrop-filter: none !important;
    }
  `,

  W = `
    .${sdhgp}s.selected-page {
      scrollbar-width: none !important;
    }

    #${SDHGS}-Box::-webkit-scrollbar,
    #SDHub-Texteditor-Editor::-webkit-scrollbar {
      width: 0.4rem !important;
      position: absolute !important;
      right: 4px !important;
    }

    #${SDHGS}-Box::-webkit-scrollbar-thumb,
    #SDHub-Texteditor-Editor::-webkit-scrollbar-thumb {
      background: var(--primary-400) !important;
      border-radius: 30px !important;
      background-clip: padding-box !important;
    }

    #${SDHGS}-Box::-webkit-scrollbar-thumb:hover,
    #SDHub-Texteditor-Editor::-webkit-scrollbar-thumb:hover {
      background: var(--primary-600) !important;
    }

    #SDHub-Texteditor-Editor::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 2px 0 !important;
    }

    #${SDHGS}-Box::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 8px 0 !important;
    }
  `;

  ScrollBAR.innerHTML = FoxFire ? F : W;
  document.body.appendChild(ScrollBAR);
}

function SDHubGetTranslation(k, n = 1) {
  const lang = navigator.language || navigator.languages[0] || 'en',
  t = SDHubTranslations[lang] ?? SDHubTranslations['en'] ?? {};

  if (k === 'item' || k === 'items') 
    return (n > 1 ? t['items'] : t['item']) ?? (n > 1 ? 'items' : 'item');

  let r = t[k] ?? k;
  if (r.includes('{{number}}')) {
    const num = `<span class='sdhub-gallery-info-number'>${n}</span>`;
    if (lang.startsWith('en') && n > 1) r = r.replace(/\bimage\b/, 'images');
    r = r.replace('{{number}}', num);
  }

  return r;
}

function SDHubUITranslation() {
  let ForgeCheck = document.querySelector('.gradio-container-4-40-0') !== null,
  TabList = gradioApp().querySelectorAll('#SDHub-Tab > .tab-nav > button');

  for (let i = 0; i < TabList.length; i++) {
    let btn = TabList[i], t = btn.textContent.trim(), id = SDHubTabButtons[t];
    if (id && btn.id !== id) btn.id = id;

    let c = SDHubGetTranslation(t.toLowerCase());
    if (c) btn.textContent = c;
  }

  let tabs = ['.sdhub-downloader-tab-title', '.sdhub-uploader-tab-title'];
  for (let i = 0; i < tabs.length; i++) {
    let tab = tabs[i], title = document.querySelector(tab);
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
  ],

  EL = [
    ...isThatForge,
    { element: '.sdhub-downloader-tab-info', key: 'downloader_tab_info', inner: true },
    { element: '.sdhub-uploader-tab-info', key: 'uploader_tab_info', inner: true },
    { element: '.sdhub-archiver-tab-info', key: 'archiver_tab_info', inner: true },
    { element: '#SDHub-Downloader-HFR > label > span', key: 'huggingface_token_read' },
    { element: '#SDHub-Downloader-HFR > label > input', key: 'huggingface_token_placeholder', spellcheck: false },
    { element: '#SDHub-Downloader-CAK > label > span', key: 'civitai_api_key' },
    { element: '#SDHub-Downloader-CAK > label > input', key: 'civitai_api_key_placeholder', spellcheck: false },
    { element: '#SDHub-Downloader-Input > label > textarea', spellcheck: false },
    { element: '#SDHub-Downloader-Download-Button', key: 'download' },
    { element: '#SDHub-Downloader-Scrape-Button', key: 'scrape' },
    { element: '#SDHub-Downloader-Txt-Button', key: 'insert_txt' },
    { element: '#SDHub-Downloader-Load-Button', key: 'load' },
    { element: '#SDHub-Downloader-Save-Button', key: 'save' },
    { element: '#SDHub-Uploader-HFW > label > span', key: 'huggingface_token_write' },
    { element: '#SDHub-Uploader-HFW > label > input', key: 'huggingface_token_placeholder', spellcheck: false },
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
    { element: `#${SDHGiI}-SendButton > #txt2img_tab`, key: 'send_txt2img' },
    { element: `#${SDHGiI}-SendButton > #img2img_tab`, key: 'send_img2img' },
    { element: `#${SDHGiI}-SendButton > #inpaint_tab`, key: 'send_inpaint' },
    { element: `#${SDHGiI}-SendButton > #extras_tab`, key: 'send_extras' },
    { element: '#SDHub-Gallery-ImgChest-API > label > input', spellcheck: false }
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
    { c: '--input-background-fill', to: '--sdhub-gallery-output-background', a: 0.6 },
    { c: '--input-background-fill-hover', to: '--sdhub-gallery-background-secondary', a: 0.9 },
    { c: '--input-background-fill-hover', to: '--sdhub-gallery-img-name-box-shadow-selected', a: 0.9, swap: true },
    { c: '--input-background-fill-hover', to: '--sdhub-gallery-img-name-background-selected', a: 0.7, swap: true },
    { c: '--input-background-fill-hover', to: '--sdhub-gallery-img-selected', a: 1, swap: true },
    { c: '--background-fill-primary', to: '--sdhub-gallery-tab-layer-background', ar: 0.25, ad: 0.4 },
  ];

  const css = await (await fetch('/theme.css')).text(),
  get = s => Object.fromEntries((css.match(new RegExp(`${s}\\s*{([^}]*)}`, 'm'))?.[1] || '')
  .split(';').map(l => l.trim().split(':').map(s => s.trim())).filter(([k, v]) => k && v)),

  names = {
    white: '255 255 255', black: '0 0 0', red: '255 0 0', green: '0 128 0', blue: '0 0 255',
    yellow: '255 255 0', cyan: '0 255 255', magenta: '255 0 255', silver: '192 192 192',
    gray: '128 128 128', maroon: '128 0 0', olive: '128 128 0', lime: '0 255 0',
    aqua: '0 255 255', teal: '0 128 128', navy: '0 0 128', fuchsia: '255 0 255',
    purple: '128 0 128', orange: '255 165 0', pink: '255 192 203'
  },

  alpha = (c, o) => {
    if (!c) return 'rgba(0,0,0,0)';
    if (names[c.toLowerCase()]) return `rgb(${names[c.toLowerCase()]} / ${Math.round(o * 100)}%)`;
    if (c.startsWith('#')) return `${c}${Math.round(o * 255).toString(16).padStart(2, '0')}`;
    if (c.startsWith('rgb(')) return `rgb(${c.slice(4, -1)} / ${Math.round(o * 100)}%)`;
    if (c.startsWith('rgba(')) return `rgba(${c.slice(5, -1).split(',').slice(0, 3).join(',')}, ${o})`;
    return c;
  },

  resolve = (v, ctx, f = new Set()) => {
    if (!v?.startsWith?.('var(')) return v;
    const m = v.match(/^var\(([^)]+)\)$/);
    if (!m || f.has(m[1])) return v;
    f.add(m[1]);
    return resolve(ctx[m[1]], ctx, f);
  },

  r = get(':root'), d = get('.dark'), S = document.createElement('style');

  vars.forEach(({ c, to, a, ar, ad, swap }) => {
    const [rc, dc] = [resolve(r[c], r), resolve(d[c], d)],
    rootAlpha = ar !== undefined ? ar : a,
    darkAlpha = ad !== undefined ? ad : a,
    [root, dark] = swap ? [alpha(dc, rootAlpha), alpha(rc, darkAlpha)] : [alpha(rc, rootAlpha), alpha(dc, darkAlpha)];
    S.textContent += `:root { ${to}: ${root}; }\n.dark { ${to}: ${dark}; }\n`;
  });

  const svg = (c) =>
    `url("data:image/svg+xml,${encodeURIComponent(`
      <svg viewBox='0 0 16 16' fill='${c}' stroke='${c}' xmlns='http://www.w3.org/2000/svg'>
        <rect x='4' y='4' width='8' height='8'/>
      </svg>
    `.trim()).replace(/'/g, '%27').replace(/"/g, '%22')}")`;

  S.textContent += `
    :root { --sdhub-gallery-checkbox-img: ${svg('#000')}; }
    .dark  { --sdhub-gallery-checkbox-img: ${svg('#fff')}; }
  `;

  document.head.append(S);
}

document.addEventListener('DOMContentLoaded', async function () {
  SDHubGalleryWS();
  await new Promise(resolve => (function check() { window.XLSX ? resolve() : setTimeout(check, 50); })());

  try {
    window.getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)?.[0];
    const path = getRunningScript()?.match(/file=[^\/]+\/[^\/]+\//)?.[0];
    if (path) window.SDHubFilePath = path;

    const res = await fetch(`${path}sd-hub-translations.xlsx?ts=${Date.now()}`);
    if (res.ok) {
      const book = XLSX.read(await res.arrayBuffer(), { type: 'array' }),
      data = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1 });

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

function SDHubEL(t, o = {}) {
  const l = document.createElement(t);
  for (const [k, v] of Object.entries(o)) {
    if (k === 'class') l.className = Array.isArray(v) ? v.join(' ') : v;
    else if (k === 'style' && typeof v === 'object') Object.assign(l.style, v);
    else if (k === 'html') l.innerHTML = v;
    else if (k === 'text') l.textContent = v;
    else if (k === 'children') (Array.isArray(v) ? v : [v]).forEach(child => l.appendChild(child));
    else if (k === 'dataset') Object.assign(l.dataset, v);
    else if (k in l) l[k] = v;
    else l.setAttribute(k, v);
  }
  return l;
}