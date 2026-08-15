const SDHub = {
  noScroll: 'sdhub-body-no-scrolling',
  style: 'sdhub-style',
  scale: 'scale(var(--sdhub-scale))',

  GalleryBase: '/sdhub-gallery',

  imgSel: 'sdhub-gallery-img-selected',
  imgFav: 'sdhub-gallery-img-favorited',
  ImgInfo: 'SDHub-Gallery-Image-Info',
  imgInfo: 'sdhub-gallery-image-info',
  ImgViewer: 'SDHub-Gallery-Image-Viewer',
  page: 'sdhub-gallery-page',
  Setting: 'SDHub-Gallery-Setting',
  setting: 'sdhub-gallery-setting'
},

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
};

let SDHubTranslations = {};

onUiLoaded(() => {
  SDHubTabLoaded();
  SDHubEventListener();
  SDHubUITranslation();
  SDHubCreateGallery();
  SDHubTabChange();
});

function SDHubTabChange() {
  const tabId = 'tab_SDHub',

  styleId = 'SDHub-Hide-Scroll-Bar',
  imginfoRow = document.getElementById(`${SDHub.ImgInfo}-Row`),
  tagList = document.getElementById('SDHub-Tag-Accordion'),
  tabNav = document.querySelector('#tabs > .tab-nav'),

  repo = document.getElementById('SDHub-Repo'),
  infoCon = document.getElementById('SDHub-Gallery-Info-Container'),

  css = `
    html {
      scrollbar-width: none !important;
    }

    ::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
    }
  `,

  Nav = () => {
    const hubnav = document.querySelectorAll('#SDHub-Tab > .tab-nav > button') || [];
    hubnav.forEach(btn => {
      const text = btn.textContent.trim(), btnId = SDHubTabButtons[text];
      if (btnId && btn.id !== btnId) btn.id = btnId;
      const translated = SDHubGetTranslation(text.toLowerCase());
      if (translated && btn.textContent !== translated) btn.textContent = translated;
    });

    const navbtn = tabNav?.querySelector('button.selected'),
    selected = document.querySelector('#SDHub-Tab > .tab-nav > button.selected'),

    HUB = navbtn?.textContent.trim() === 'HUB',
    TextEditor = selected?.id === 'SDHub-Tab-Button-Texteditor',
    Gallery = selected?.id === 'SDHub-Tab-Button-Gallery';

    if (HUB) {
      if (TextEditor || Gallery) {
        tagList && (tagList.style.display = 'none');
        if (Gallery) {
          repo && (repo.style.display = 'none');
          window.SDHubGalleryPageArrowUpdate();
          infoCon?.style.display === 'flex' && document.body.classList.add(SDHub.noScroll);
        }

        if (!document.getElementById(styleId)) {
          document.head.appendChild(SDHubEL('style', { id: styleId, html: css }));
        }
      } else {
        repo && (repo.style.display = '');
        tagList && (tagList.style.display = '');
        document.getElementById(styleId)?.remove();
        document.body.classList.remove(SDHub.noScroll);
      }
    }
  },

  TabChange = (Id, ON, OFF) => {
    const tab = document.getElementById(Id),
    check = () => {
      const d = window.getComputedStyle(tab).display !== 'none';
      if (d !== tab.__l) { tab.__l = d; d ? ON?.(tab) : OFF?.(tab); }
    };

    check();

    const obs = new MutationObserver(check);
    obs.observe(tab, { attributes: true, attributeFilter: ['style'] });
  };

  TabChange(tabId,
    (tab) => {
      Nav();

      const nav = tab.querySelector('.tab-nav');
      if (nav && !nav.__patched) {
        nav.__patched = true;
        const obs = new MutationObserver(() => Nav());
        obs.observe(nav, { childList: true, subtree: true });
      }
    },
    () => {
      document.getElementById(styleId)?.remove();
      document.body.classList.remove(SDHub.noScroll);
      imginfoRow?.style.display === 'flex' && window.SDHubGalleryCloseImageInfo();
    }
  );
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

async function SDHubDownloader(downloading = false) {
  const TagMap = {
    '$ckpt': ['txt2img_checkpoints_extra_refresh', 'img2img_checkpoints_extra_refresh', 'refresh_sd_model_checkpoint'],
    '$vae': ['refresh_sd_vae'],
    '$lora': ['txt2img_lora_extra_refresh', 'img2img_lora_extra_refresh'],
    '$emb': ['txt2img_textual_inversion_extra_refresh', 'img2img_textual_inversion_extra_refresh'],
    '$hn': ['txt2img_hypernetworks_extra_refresh', 'img2img_hypernetworks_extra_refresh'],
    '$cn': ['txt2img_controlnet_ControlNet-0_controlnet_refresh_models', 'img2img_controlnet_ControlNet-0_controlnet_refresh_models']
  },

  id = '#SDHub-Downloader',
  c = 'sdhub-buttons-anim';

  if (downloading) {
    const v = [
      `${id}-Input textarea`,
      `${id}-HFR input`,
      `${id}-CAK input`,
      `${id}-Preview-Checkbox input`,
      `${id}-HTML-Checkbox input`
    ].map(s => {
      const e = document.querySelector(s);
      return e?.type === 'checkbox' ? e.checked : e?.value;
    });

    document.querySelectorAll(`${id}-Download-Button, ${id}-Cancel-Button, ${id}-Input`)
      .forEach(b => b.classList.add('downloading'));

    const b = document.querySelector(`${id}-Cancel-Button`);
    b.classList.add(c);
    setTimeout(() => b.classList.remove(c), 400);

    window.SDHubDownloaderInputsValue = v[0];
    return [...v, null];
  }

  document.querySelectorAll(`${id}-Download-Button, ${id}-Cancel-Button, ${id}-Input`)
    .forEach(btn => btn.classList.remove('downloading'));

  const inputs = window.SDHubDownloaderInputsValue,
  refresh = [],

  b = document.querySelector(`${id}-Download-Button`);
  b.classList.add(c);
  setTimeout(() => b.classList.remove(c), 400);

  if (!inputs?.trim()) return;

  Object.entries(TagMap).forEach(([tags, buttons]) => {
    const Tag = new RegExp(`\\${tags}(\\/|\\s|$)`);
    if (Tag.test(inputs)) refresh.push(...buttons);
  });

  for (const id of refresh) {
    document.getElementById(id)?.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function SDHubArchiver(v) {
  const archiveBtn = document.getElementById('SDHub-Archiver-Archive-Button'),
  extractBtn = document.getElementById('SDHub-Archiver-Extract-Button');

  if (v === 'finish') {
    [archiveBtn, extractBtn].forEach(btn => btn.classList.remove('sdhub-button-disabled'));
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

function SDHubStyles() {
  const f = `
    #${SDHub.Setting}-Box {
      scrollbar-width: thin !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }

    #SDHub-Texteditor-Editor,
    .${SDHub.page}s.selected-page {
      scrollbar-width: none !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }

    .sdhub-gallery-cm-ul {
      background: var(--sdhub-gallery-cm-ul-fox) !important;
      backdrop-filter: none !important;
    }

    .sdhub-gallery-img-box:not(.${SDHub.imgSel}) .sdhub-gallery-img-container:hover .sdhub-gallery-img-frame,
    .sdhub-gallery-img-box:not(.${SDHub.imgFav}) .sdhub-gallery-img-container:hover .sdhub-gallery-img-frame {
      box-shadow: none;
    }
  `;

  const w = `
    .${SDHub.page}s.selected-page {
      scrollbar-width: none !important;
    }

    #${SDHub.Setting}-Box::-webkit-scrollbar,
    #SDHub-Texteditor-Editor::-webkit-scrollbar {
      width: 0.4rem !important;
      position: absolute !important;
      right: 4px !important;
    }

    #${SDHub.Setting}-Box::-webkit-scrollbar-thumb,
    #SDHub-Texteditor-Editor::-webkit-scrollbar-thumb {
      background: var(--primary-400) !important;
      border-radius: 30px !important;
      background-clip: padding-box !important;
    }

    #${SDHub.Setting}-Box::-webkit-scrollbar-thumb:hover,
    #SDHub-Texteditor-Editor::-webkit-scrollbar-thumb:hover {
      background: var(--primary-600) !important;
    }

    #SDHub-Texteditor-Editor::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 2px 0 !important;
    }

    #${SDHub.Setting}-Box::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 8px 0 !important;
    }
  `;

  const fox = /firefox/i.test(navigator.userAgent);
  document.body.append(SDHubEL('style', { id: 'SDHub-Styles', html: fox ? f : w }));
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
  let gradio4 = document.querySelector('.gradio-container-4-40-0') !== null,
  TabList = gradioApp().querySelectorAll('#SDHub-Tab > .tab-nav > button');

  for (let i = 0; i < TabList.length; i++) {
    let btn = TabList[i], bb = btn.textContent.trim(), id = SDHubTabButtons[bb];
    if (id && btn.id !== id) btn.id = id;

    let c = SDHubGetTranslation(bb.toLowerCase());
    if (c) btn.textContent = c;
  }

  let tabs = ['.sdhub-downloader-tab-title', '.sdhub-uploader-tab-title'];
  for (let i = 0; i < tabs.length; i++) {
    let tab = tabs[i], title = document.querySelector(tab);
    if (title) {
      let k = tab === '.sdhub-downloader-tab-title' ? 'download_command_center' : 'upload_to_huggingface';
      if (title.lastChild?.nodeType === Node.TEXT_NODE) title.lastChild.textContent = SDHubGetTranslation(k);
    }
  }

  const v4 = gradio4 ? [
    { t: '#SDHub-Tag-Accordion > button > span:nth-child(1)', k: 'tag_list' },
    { t: '#SDHub-Tag-Dataframe > div > div > button > svelte-virtual-table-viewport > table > thead > tr > th:nth-child(1) > div > span', k: 'sdhub_tags' },
    { t: '#SDHub-Tag-Dataframe > div > div > button > svelte-virtual-table-viewport > table > thead > tr > th:nth-child(2) > div > span', k: 'webui_paths' }
  ] : [
    { t: '#SDHub-Tag-Accordion > div > span:nth-child(1)', k: 'tag_list' },
    { t: '#SDHub-Tag-Dataframe > div > div > div > table > thead > tr > th:nth-child(1) > div > span', k: 'sdhub_tags' },
    { t: '#SDHub-Tag-Dataframe > div > div > div > table > thead > tr > th:nth-child(2) > div > span', k: 'webui_paths' }
  ],

  EL = [
    ...v4,
    { t: '.sdhub-downloader-tab-info', k: 'downloader_tab_info', inner: true },
    { t: '.sdhub-uploader-tab-info', k: 'uploader_tab_info', inner: true },
    { t: '.sdhub-archiver-tab-info', k: 'archiver_tab_info', inner: true },

    { t: '#SDHub-Downloader-HFR > label > span', k: 'huggingface_token_read' },
    { t: '#SDHub-Downloader-HFR > label > input', k: 'huggingface_token_placeholder', spellcheck: false },
    { t: '#SDHub-Downloader-CAK > label > span', k: 'civitai_api_key' },
    { t: '#SDHub-Downloader-CAK > label > input', k: 'civitai_api_key_placeholder', spellcheck: false },
    { t: '#SDHub-Downloader-Input > label > textarea', spellcheck: false },
    { t: '#SDHub-Downloader-Download-Button', k: 'download' },
    { t: '#SDHub-Downloader-Scrape-Button', k: 'scrape' },
    { t: '#SDHub-Downloader-Txt-Button', k: 'insert_txt' },
    { t: '#SDHub-Downloader-Load-Button', k: 'load' },
    { t: '#SDHub-Downloader-Save-Button', k: 'save' },
    { t: '#SDHub-Downloader-Preview-Checkbox > label > span', k: 'civitai_preview' },

    { t: '#SDHub-Uploader-HFW > label > span', k: 'huggingface_token_write' },
    { t: '#SDHub-Uploader-HFW > label > input', k: 'huggingface_token_placeholder', spellcheck: false },
    { t: '#SDHub-Uploader-Input > label > textarea', k: 'input_path', spellcheck: false },
    { t: '#SDHub-Uploader-Upload-Button', k: 'upload' },
    { t: '#SDHub-Uploader-Load-Button', k: 'load' },
    { t: '#SDHub-Uploader-Save-Button', k: 'save' },
    { t: '#SDHub-Uploader-Username-Box > label > span', k: 'username' },
    { t: '#SDHub-Uploader-Username-Box > label > input', k: 'username', spellcheck: false },
    { t: '#SDHub-Uploader-Repo-Box > label > span', k: 'repository' },
    { t: '#SDHub-Uploader-Repo-Box > label > input', k: 'repository', spellcheck: false },
    { t: '#SDHub-Uploader-Branch-Box > label > span', k: 'branch' },
    { t: '#SDHub-Uploader-Branch-Box > label > input', k: 'branch', spellcheck: false },
    { t: '#SDHub-Uploader-Radio-Box > span', k: 'visibility' },
    { t: '#SDHub-Uploader-Radio-Box > div > label:nth-child(1) > span', k: 'public2' },
    { t: '#SDHub-Uploader-Radio-Box > div > label:nth-child(2) > span', k: 'private' },

    { t: '#SDHub-Archiver-ZipOutputs-Accordion > div > span:nth-child(1)', k: 'zip_outputs' },
    { t: '#SDHub-Archiver-ZipOutputs-Input-Name > label > input', k: 'zipoutputs_input', spellcheck: false },
    { t: '#SDHub-Archiver-ZipOutputs-Output-Path > label > input', k: 'zipoutputs_output', spellcheck: false },
    { t: '#SDHub-Archiver-ZipOutputs-Checkbox > label > span', k: 'makedir' },
    { t: '#SDHub-Archiver-Archive-Title', k: 'arc_title' },
    { t: '#SDHub-Archiver-Archive-Input-Name > label > input', k: 'name', spellcheck: false },
    { t: '#SDHub-Archiver-Archive-Input-Path > label > input', k: 'input_path', spellcheck: false },
    { t: '#SDHub-Archiver-Archive-Output-Path > label > input', k: 'output_path', spellcheck: false },
    { t: '#SDHub-Archiver-Archive-Button', k: 'arc_button' },
    { t: '#SDHub-Archiver-Archive-Checkbox > label > span', k: 'makedir' },
    { t: '#SDHub-Archiver-Radio-Format > span', k: 'radio_format' },
    { t: '#SDHub-Archiver-Radio-Split > span', k: 'radio_split' },
    { t: '#SDHub-Archiver-Radio-Split > div > label:nth-child(1) > span', k: 'none' },
    { t: '#SDHub-Archiver-Extract-Title', k: 'extr_title' },
    { t: '#SDHub-Archiver-Extract-Input-Path > label > input', k: 'input_path', spellcheck: false },
    { t: '#SDHub-Archiver-Extract-Output-Path > label > input', k: 'output_path', spellcheck: false },
    { t: '#SDHub-Archiver-Extract-Button', k: 'extr_button' },
    { t: '#SDHub-Archiver-Extract-Checkbox > label > span', k: 'makedir' },

    { t: '#SDHub-Texteditor-Load-Button', k: 'load' },
    { t: '#SDHub-Texteditor-Save-Button', k: 'save' },
    { t: '#SDHub-Texteditor-Input > label > input', k: 'file_path', spellcheck: false },

    { t: '#SDHub-Shell-Input > label > textarea', k: 'shell_cmd', spellcheck: false },

    { t: `#${SDHub.ImgInfo}-SendButton > #txt2img_tab`, k: 'send_txt2img' },
    { t: `#${SDHub.ImgInfo}-SendButton > #img2img_tab`, k: 'send_img2img' },
    { t: `#${SDHub.ImgInfo}-SendButton > #inpaint_tab`, k: 'send_inpaint' },
    { t: `#${SDHub.ImgInfo}-SendButton > #extras_tab`, k: 'send_extras' },
    { t: '#SDHub-Gallery-ImgChest-API > label > input', spellcheck: false }
  ];

  for (const { t, k, inner, spellcheck } of EL) {
    const el = document.querySelector(t);
    if (!el) continue;

    if (k) {
      const translate = SDHubGetTranslation(k);
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
    { c: '--input-background-fill-hover', to: '--sdhub-gallery-img-name-shadow-selected', a: 0.9, swap: true },
    { c: '--input-background-fill-hover', to: '--sdhub-gallery-img-name-background-selected', a: 0.7, swap: true },
    { c: '--input-background-fill-hover', to: '--sdhub-gallery-img-selected', a: 1, swap: true },
    { c: '--background-fill-primary', to: '--sdhub-gallery-tab-layer-background', ar: 0.6, ad: 0.7 },
    { c: '--background-fill-primary', to: '--sdhub-gallery-cm-ul-fox', a: 0.75 },
    { c: '--primary-400', to: '--sdhub-main-button', a: 0.5 },
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

  r = get(':root'), d = get('.dark'), S = SDHubEL('style', { id: 'SDHub-CSS' });

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
    :root {
      --sdhub-gallery-checkbox-img: ${svg('#000')};
    }
    .dark {
      --sdhub-gallery-checkbox-img: ${svg('#fff')};
    }
  `;

  document.head.append(S);
}

document.addEventListener('DOMContentLoaded', async function () {
  await new Promise(resolve => (function check() { window.XLSX ? resolve() : setTimeout(check, 50); })());

  try {
    const getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)?.[0],
    path = getRunningScript()?.match(/file=[^\/]+\/[^\/]+\//)?.[0];
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

      SDHubGalleryDOMLoaded();
      SDHubRGBA();
      SDHubStyles();
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
    else if (k === 'append') l.append(...(Array.isArray(v) ? v : [v]));
    else if (k === 'dataset') Object.assign(l.dataset, v);
    else if (k in l) l[k] = v;
    else l.setAttribute(k, v);
  }
  return l;
}
