function SDHubCreateEL(t, o = {}) {
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

function SDHubGalleryDOMLoaded() {
  const file = `${window.SDHubFilePath}styleGallery.css?${(Date.now() / 1000).toFixed(6)}`,
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('property', 'stylesheet');
    link.href = file;
    document.body.appendChild(link);

  const SDHubGallery = SDHubCreateEL('div', { id: 'SDHubGallery', style: { display: 'none' } }),

  Setting = SDHubCreateEL('div', { id: `${SDHGS}`, tabindex: 0 }),
  SettingButton = SDHubCreateEL('div', {
    id: `${SDHGS}-Button`, class: 'sdhub-gallery-ex-button', html: SDHubGallerySVG_Setting, title: SDHubGetTranslation('setting_title')
  }),

  TabRow = SDHubCreateEL('div', { id: 'SDHub-Gallery-Tab-Button-Row', children: SettingButton }),
  TabLayer = SDHubCreateEL('div', { id: 'SDHub-Gallery-Tab-Layer' }),
  TabWrap = SDHubCreateEL('div', { id: 'SDHub-Gallery-Tab-Wrapper' }),
  GalleryWrap = SDHubCreateEL('div', { id: 'SDHub-Gallery-Wrapper', children: TabWrap });

  SDHubGalleryTabList.forEach(whichTab => {
    let btnTitle = whichTab.includes('-grids') ? whichTab : whichTab.split('-')[0].toLowerCase();

    const TabBtn = SDHubCreateEL('button', {
      id: `SDHub-Gallery-${whichTab}-Tab-Button`, class: ['lg', 'primary', 'gradio-button', 'svelte-cmf5ev', 'sdhub-gallery-tab-button'],
      text: btnTitle, onclick: () => SDHubGallerySwitchTab(whichTab)
    }),

    pageWrapper = SDHubCreateEL('div', { class: `${sdhgp}-wrapper` }),
    TabCon = SDHubCreateEL('div', { id: `SDHub-Gallery-${whichTab}-Tab-Container`, class: 'sdhub-gallery-tab-container', children: pageWrapper }),

    navClick = (c) => {
      const btn = document.querySelector(c);
      requestAnimationFrame(() => {
        btn.style.transform = 'scale(1.25)'; btn.style.filter = 'var(--sdhub-gallery-flash-nav-button)';
        setTimeout(() => (btn.style.transform = btn.style.filter = ''), 300);
      });
    },

    rightNavButton = SDHubCreateEL('span', {
      class: [`${sdhgp}-right-button`, `${sdhgp}-nav-button`], html: SDHubGallerySVG_RightArrow,
      onclick: () => (navClick(`.${sdhgp}-right-button.btn-on`), SDHubGallerySwitchPage(whichTab, 'right'))
    }),

    leftNavButton = SDHubCreateEL('span', {
      class: [`${sdhgp}-left-button`, `${sdhgp}-nav-button`], html: SDHubGallerySVG_LeftArrow,
      onclick: () => (navClick(`.${sdhgp}-left-button.btn-on`), SDHubGallerySwitchPage(whichTab, 'left'))
    }),

    pageIndicator = SDHubCreateEL('span', { class: `${sdhgp}-indicator`, text: '1 / 1' }),
    imgCounter = SDHubCreateEL('div', { class: 'sdhub-gallery-tab-image-counter' }),
    pageNav = SDHubCreateEL('div', { class: `${sdhgp}-nav`, children: [leftNavButton, pageIndicator, rightNavButton, imgCounter] });

    TabCon.append(pageNav);
    TabRow.append(TabBtn);
    TabWrap.append(TabCon);
    SDHubGalleryTabEvents(TabCon);
  });

  const img = SDHubCreateEL('img', { class: 'sdhub-gallery-img', src: 'https://huggingface.co/gutris1/webui/resolve/main/misc/card-no-preview.png' }),
  checkbox = SDHubCreateEL('span', { class: ['sdhub-gallery-img-btn-checkbox', 'sdhub-gallery-img-btn'], html: SDHubGallerySVG_SelectImage }),
  ContextBtn = SDHubCreateEL('span', { class: ['sdhub-gallery-img-btn-contextmenu', 'sdhub-gallery-img-btn'], html: SDHubGallerySVG_ImageButton }),
  ViewerBtn = SDHubCreateEL('span', { 
    class: ['sdhub-gallery-img-btn-imageviewer', 'sdhub-gallery-img-btn'], html: SDHubGallerySVG_Image,
    title: SDHubGetTranslation('image_viewer')
  }),

  imgName = SDHubCreateEL('div', { class: 'sdhub-gallery-img-name' }),
  eFrame = SDHubCreateEL('div', { class: 'sdhub-gallery-img-emptyframe' }),
  imgWrap = SDHubCreateEL('div', { class: 'sdhub-gallery-img-wrapper', children: [img, checkbox, ContextBtn, ViewerBtn, imgName, eFrame] }),

  imgBor = SDHubCreateEL('div', { class: 'sdhub-gallery-img-border' }),
  imgCon = SDHubCreateEL('div', { class: 'sdhub-gallery-img-container', children: [imgWrap, imgBor] }),
  imgBox = SDHubCreateEL('div', { id: 'SDHub-Gallery-Image-Box-0', class: 'sdhub-gallery-img-box', children: imgCon }),

  ImageInfoArrow = SDHubCreateEL('div', { id: 'SDHub-Gallery-Imageinfo-Arrow-Button', html: SDHubGallerySVG_ArrowButton }),
  pageArrow = SDHubCreateEL('div', { id: 'SDHub-Gallery-Page-Arrow-Button', class: 'sdhub-gallery-arrow-scroll', html: SDHubGallerySVG_ArrowButton }),
  pageArrowWrap = SDHubCreateEL('div', { id: 'SDHub-Gallery-Page-Arrow-Wrapper', class: 'sdhub-gallery-arrow-wrapper', children: pageArrow }),
  pageArrowCon = SDHubCreateEL('div', { id: 'SDHub-Gallery-Page-Arrow-Container', class: 'sdhub-sticky-container', children: pageArrowWrap }),
  StickyCon = SDHubCreateEL('div', { id: 'SDHub-Gallery-Sticky-Container', children: [SDHubGalleryCreateBatchBox(), pageArrowCon]});

  const ViewerBtnSVG = ViewerBtn.querySelector('svg');
  if (ViewerBtnSVG) ViewerBtnSVG.classList.remove('sdhub-gallery-cm-svg');

  GalleryWrap.prepend(TabRow, SDHubCreateEL('div', { id: 'SDHub-Gallery-Page-Nav-Box'}));
  GalleryWrap.append(StickyCon, TabLayer);

  SDHubGallery.append(
    SDHubGalleryCreateLightBox(),
    SDHubGalleryCreateContextMenu(),
    SDHubGalleryCreateInfoBox(),
    Setting, GalleryWrap, imgBox, ImageInfoArrow
  );

  document.body.append(SDHubGallery);
  SDHubGalleryCreateSetting(SettingButton, Setting);

  document.addEventListener('keydown', (e) => {
    const C = id => document.getElementById(id)?.style.display === 'block';
    if (!C('tab_SDHub') || !C('SDHub-Gallery-Tab')) return;

    const imginfoRow = document.getElementById(`${SDHGiI}-Row`),
    LightBox = document.getElementById(`${SDHGiV}`),
    infoCon = document.getElementById('SDHub-Gallery-Info-Container');

    if (['Escape', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      const i = imginfoRow?.style.display !== 'flex', b = LightBox?.style.display === 'flex';
      if (i || b) return;

      if (e.key === 'Escape') {
        const img = imginfoRow.querySelector(`#${SDHGiI}-img img`);
        img && (e.preventDefault(), window.SDHubGalleryCloseImageInfo());
      }

      const l = window.SDHubGallerySettings['image-info-layout'] === 'full_width',
      el = l ? imginfoRow : document.getElementById(`${SDHGiI}-Output-Panel`),
      s = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? el.scrollHeight : null;
      if (s !== null) (e.preventDefault(), el.scrollTo({ top: s, behavior: 'smooth' }));
    }

    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const i = imginfoRow?.style.display === 'flex', b = LightBox?.style.display === 'flex',
      s = Setting?.style.display === 'flex', n = infoCon?.style.display === 'flex';
      if (i || b || s || n) return;

      const nav = document.querySelector(`.sdhub-gallery-tab-container.active > .${sdhgp}-nav`),
      btn = nav?.querySelector(e.key === 'ArrowRight' ? `.${sdhgp}-right-button.btn-on` : `.${sdhgp}-left-button.btn-on`);
      btn?.click();
    }
  });

  SDHubGalleryPageArrowEvents(pageArrowWrap);
  SDHubGalleryImageInfoArrowEvents(ImageInfoArrow);
}

function SDHubGalleryPageArrowEvents(arrow) {
  let svg = arrow.querySelector('svg'), locked = false;

  window.SDHubGalleryPageArrowUpdate = () => {
    const GalleryTab = document.getElementById('SDHub-Gallery-Tab'),
    GalleryWrap = document.getElementById('SDHub-Gallery-Wrapper'),
    Tab = GalleryWrap?.querySelector('.sdhub-gallery-tab-container.active'),
    page = Tab?.querySelector(`.${sdhgp}s.selected-page`);

    if (!page) return arrow.style.transform = '';
    if (locked || GalleryTab.style.display !== 'block') return;

    const { scrollTop, scrollHeight, clientHeight } = page,
    overflow = scrollHeight > clientHeight + 1,
    down = scrollTop + clientHeight >= scrollHeight - 5;

    arrow.style.transform = overflow ? sdhubScale : '';
    if (overflow) svg.style.transform = down ? 'rotate(180deg)' : 'rotate(0deg)';
  };

  arrow.addEventListener('click', () => {
    const GalleryWrap = document.getElementById('SDHub-Gallery-Wrapper'),
    Tab = GalleryWrap?.querySelector('.sdhub-gallery-tab-container.active'),
    page = Tab?.querySelector(`.${sdhgp}s.selected-page`);
    if (!page) return;

    locked = true;

    const bottomTab = page.scrollTop + page.clientHeight >= page.scrollHeight - 5,
    topTab = bottomTab ? 0 : page.scrollHeight;
    svg.style.transform = svg.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
    page.scrollTo({ top: topTab, behavior: 'smooth' });

    const b = document.body.getBoundingClientRect(),
    p = window.scrollY || document.documentElement.scrollTop,
    pos = bottomTab ? p + b.top : p + b.bottom - window.innerHeight;
    window.scrollTo({ top: pos, behavior: 'smooth' });

    setTimeout(() => {
      const check = setInterval(() => {
        const stop = bottomTab ? page.scrollTop <= 5 : page.scrollTop + page.clientHeight >= page.scrollHeight - 5;
        if (stop) { clearInterval(check); locked = false; window.SDHubGalleryPageArrowUpdate(); }
      }, 50);
    }, 100);
  });

  const arrowButton = () => {
    const GalleryTab = document.getElementById('SDHub-Gallery-Tab'),
    GalleryWrap = document.getElementById('SDHub-Gallery-Wrapper'),
    Tab = GalleryWrap?.querySelector('.sdhub-gallery-tab-container.active'),
    page = Tab?.querySelector(`.${sdhgp}s.selected-page`);
    if (!page || GalleryTab.style.display !== 'block') return;
    if (!locked) window.SDHubGalleryPageArrowUpdate();
  };

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, arrowButton));
}

function SDHubGalleryImageInfoArrowEvents(arrow) {
  let clicked = false;

  const whichEL = () => {
    const column = document.getElementById(`${SDHGiI}-Row`),
    panel = document.getElementById(`${SDHGiI}-Output-Panel`);
    return (panel && panel.scrollHeight > panel.clientHeight) ? panel : column;
  };

  arrow.onclick = () => {
    clicked = true;
    arrow.style.transform = '';
    const el = whichEL();
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setTimeout(() => clicked = false, 500);
  };

  window.SDHubGalleryImageInfoArrowUpdate = () => {
    if (clicked) return;
    const imginfoRow = document.getElementById(`${SDHGiI}-Row`), el = whichEL();
    if (!el) return;
    if (getComputedStyle(imginfoRow).display !== 'flex') return arrow.style.transform = '';
    const { scrollTop, scrollHeight, clientHeight } = el,
    overflow = scrollHeight > clientHeight + 1,
    bottom = scrollTop + clientHeight >= scrollHeight - 5;
    arrow.style.transform = overflow && !bottom ? sdhubScale : '';
  };

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, window.SDHubGalleryImageInfoArrowUpdate));
}

function SDHubGalleryCreateImagePages(wrapper, imageBoxes) {
  document.getElementById('SDHub-Gallery-Page-Nav-Box').style.display = 'flex';
  let existingPages = wrapper.querySelectorAll(`.${sdhgp}s`),
  totalPages = existingPages.length,
  page = existingPages[totalPages - 1],
  imagesInLastPage = page ? page.querySelectorAll('.sdhub-gallery-img-box').length : 0;

  for (const imgBox of imageBoxes) {
    if (!page || imagesInLastPage >= SDHubGalleryPageLimit) {
      page = document.createElement('div');
      page.className = `${sdhgp}s`;
      page.dataset.page = totalPages++;
      page.addEventListener('scroll', window.SDHubGalleryPageArrowUpdate);
      wrapper.append(page);
      imagesInLastPage = 0;
    }

    page.prepend(imgBox);
    imagesInLastPage++;
  }

  if (totalPages === 1) (page.classList.add('selected-page'), page.style.opacity = '1');

  return totalPages;
}

function SDHubGalleryCreateContextMenu() {
  const submenuArrowSVG = SDHubGallerySVG_SubArrow.replace('<svg', '<svg class="sdhub-gallery-cm-svg submenu-arrow"'),

  cm = `
    <ul class='sdhub-gallery-cm-ul'>
      <li onclick='SDHubGalleryContextMenuButton("open")'>
        <span>${SDHubGallerySVG_OpenInNewTab} ${SDHubGetTranslation('open_new_tab')}</span>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("download")'>
        <span>${SDHubGallerySVG_Download} ${SDHubGetTranslation('download')}</span>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("copy")'>
        <span>${SDHubGallerySVG_Copy} ${SDHubGetTranslation('copy')}</span>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("info")'>
        <span>${SDHubGallerySVG_ImageInfo} ${SDHubGetTranslation('image_info')}</span>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("viewer")'>
        <span>${SDHubGallerySVG_Image} ${SDHubGetTranslation('image_viewer')}</span>
      </li>
      <span class='sdhub-gallery-cm-line'></span>
      <li id='SDHub-Gallery-Context-Select' onclick='SDHubGalleryContextMenuButton("select")'>
        <span>${SDHubGallerySVG_SelectImage} ${SDHubGetTranslation('select_image')}</span>
      </li>
      <li id='SDHub-Gallery-Context-Unselect' onclick='SDHubGalleryContextMenuButton("unselect")'>
        <span>${SDHubGallerySVG_UnselectImage} ${SDHubGetTranslation('unselect_image')}</span>
      </li>
      <li class='sdhub-gallery-cm-sendto'>
        <span>${SDHubGallerySVG_SendTo} ${SDHubGetTranslation('send_to')} ${submenuArrowSVG}</span>
      </li>
      <span class='sdhub-gallery-cm-line'></span>
      <li onclick='SDHubGalleryContextMenuButton("delete")'>
        <span>${SDHubGallerySVG_Delete} ${SDHubGetTranslation('delete')}</span>
      </li>
    </ul>
    <div id='SDHub-Gallery-ContextMenu-SubMenu-SendTo' class='sdhub-gallery-cm-menu sdhub-gallery-cm-submenu'>
      <ul class='sdhub-gallery-cm-ul'>
        <li onclick='SDHubGallerySendImage("txt2img")'>txt2img</li>
        <li onclick='SDHubGallerySendImage("img2img")'>img2img</li>
        <li onclick='SDHubGallerySendImage("extras")'>extras</li>
        <li onclick='SDHubGallerySendImage("inpaint")'>inpaint</li>
        <li onclick='SDHubGallerySendImage("uploader")'>${SDHubGetTranslation('uploader')}</li>
      </ul>
    </div>
  `,

  GalleryCM = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-ContextMenu', class: 'sdhub-gallery-cm-menu', html: cm
  });

  document.addEventListener('wheel', (e) => {
    GalleryCM.style.transform === sdhubScale ? GalleryCM.contains(e.target) ? e.preventDefault() : SDHubGalleryContextMenuClose() : null;
  }, { passive: false });

  document.addEventListener('click', (e) => {
    let btn = '.sdhub-gallery-img-btn-contextmenu';
    if (GalleryCM?.style.transform === sdhubScale && !GalleryCM.contains(e.target) && !e.target.closest(btn)) SDHubGalleryContextMenuClose();
  });

  document.addEventListener('contextmenu', (e) => { if (GalleryCM?.contains(e.target)) e.preventDefault(); });

  return GalleryCM;
}

function SDHubGalleryCreateLightBox() {
  const NextBtn = SDHubCreateEL('span', {
    id: `${SDHGiV}-Next-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubGallerySVG_RightArrow,
    onclick: (e) => (e.stopPropagation(), SDHubGalleryNextImage())
  }),

  PrevBtn = SDHubCreateEL('span', {
    id: `${SDHGiV}-Prev-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubGallerySVG_LeftArrow,
    onclick: (e) => (e.stopPropagation(), SDHubGalleryPrevImage())
  }),

  CloseBtn = SDHubCreateEL('span', {
    id: `${SDHGiV}-Close-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubGallerySVG_Cross,
    onclick: (e) => (e.stopPropagation(), window.SDHubGalleryImageViewerCloseZoom())
  }),

  Control = SDHubCreateEL('div', { id: `${SDHGiV}-Control`, children: [NextBtn, PrevBtn, CloseBtn] }),
  Wrapper = SDHubCreateEL('div', { id: `${SDHGiV}-Wrapper`}),
  LightBox = SDHubCreateEL('div', { id: `${SDHGiV}`, tabindex: 0, children: [Control, Wrapper] });

  document.addEventListener('keydown', (e) => {
    const LightBox = document.getElementById(`${SDHGiV}`),
    NextBtn = document.getElementById(`${SDHGiV}-Next-Button`),
    PrevBtn = document.getElementById(`${SDHGiV}-Prev-Button`),
    C = (id) => id && getComputedStyle(id)?.display === 'flex';

    if (!C(LightBox)) return;

    switch (e.key) {
      case 'Escape': window.SDHubGalleryImageViewerCloseZoom(); break;
      case 'ArrowLeft': if (C(PrevBtn)) SDHubGalleryPrevImage(); break;
      case 'ArrowRight': if (C(NextBtn)) SDHubGalleryNextImage(); break;
    }
  });

  return LightBox;
}

function SDHubGalleryCreateInfoBox() {
  const Spinner = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Spinner', html: SDHubGallerySVG_Spinner }),

  infoText = SDHubCreateEL('p', { id: 'SDHub-Gallery-Info-Text', text: '' }),
  infoBatchTitle = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Batch-Title', text: SDHubGetTranslation('batch_download') }),
  infoBatchText = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Batch-Text'}),
  infoBatchInput = SDHubCreateEL('input', { id: 'SDHub-Gallery-Info-Batch-Input', type: 'text', placeholder: SDHubGetTranslation('default_batch') }),
  infoBatch = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Batch', children: [infoBatchTitle, infoBatchText, infoBatchInput]}),

  infoWarningInput = SDHubCreateEL('input', { id: 'SDHub-Gallery-Info-Warning-Input', class: 'sdhub-gallery-info-checkbox-input', type: 'checkbox' }),
  infoWarningText = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Warning-Text', class: 'sdhub-gallery-info-checkbox-text' }),
  infoWarning = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Info-Warning', class: ['sdhub-checkbox', 'sdhub-gallery-info-checkbox'], children: [infoWarningInput, infoWarningText],
    onclick: () => infoWarningInput.click()
  }),

  infoCheckboxInput = SDHubCreateEL('input', { id: 'SDHub-Gallery-Info-Checkbox-Input', class: 'sdhub-gallery-info-checkbox-input', type: 'checkbox' }),
  infoCheckboxText = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Checkbox-Text', class: 'sdhub-gallery-info-checkbox-text' }),
  infoCheckbox = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Info-Checkbox', class: ['sdhub-checkbox', 'sdhub-gallery-info-checkbox'], children: [infoCheckboxInput, infoCheckboxText],
    onclick: () => infoCheckboxInput.click()
  }),

  ButtonRow = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Button-Row' }),
  Yes = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Yes-Button', class: 'sdhub-gallery-info-button' }),
  No = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-No-Button', class: 'sdhub-gallery-info-button' }),

  infoCheckboxWrap = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Checkbox-Wrapper', children: [infoCheckbox, infoWarning] }),
  infoInner = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Inner', children: [infoText, infoCheckboxWrap, infoBatch, ButtonRow] }),
  infoBox = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Box', children: infoInner }),
  infoCon = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Container', children: [infoBox, Spinner] }),

  lang = navigator.language || navigator.languages[0] || 'en';
  ButtonRow.append(...(lang.startsWith('ja') || lang.startsWith('zh') ? [No, Yes] : [Yes, No]));

  document.addEventListener('keydown', (e) => {
    const C = id => document.getElementById(id)?.style.display === 'block';
    if (!C('tab_SDHub') || !C('SDHub-Gallery-Tab')) return;

    const infoBox = document.getElementById('SDHub-Gallery-Info-Box');
    if (infoBox.style.transform === sdhubScale) {
      if (e.key === 'Enter') e.preventDefault(); ({ Enter: Yes, Escape: No }[e.key]?.click());
    }
  });

  return infoCon;
}

function SDHubGalleryCreateBatchBox() {
  window.SDHubGalleryAllCheckbox = (add = true, currentOnly = true) => {
    const tab = document.querySelector('.sdhub-gallery-tab-container.active'),
    pages = currentOnly
      ? [tab?.querySelector(`.${sdhgp}s.selected-page`)].filter(Boolean)
      : Array.from(tab?.querySelectorAll(`.${sdhgp}s`) || []);

    if (!pages.length) return false;

    let count = 0;

    pages.forEach(page => {
      const s = `.sdhub-gallery-img-box${add ? `:not(.${sdhgis})` : `.${sdhgis}`}`,
      imgBox = page.querySelectorAll(s);
      if (!imgBox.length) return;

      imgBox.forEach(c => {
        c.classList.toggle(sdhgis, add);
        const cb = c.querySelector('.sdhub-gallery-img-btn-checkbox');
        if (cb) {
          cb.classList.toggle(sdhgis, add);
          cb.innerHTML = add ? SDHubGallerySVG_UnselectImage : SDHubGallerySVG_SelectImage;
        }
      });
      count += imgBox.length;
    });

    SDHubGalleryImgSelected += add ? count : -count;
    SDHubGalleryImgSelected = Math.max(0, SDHubGalleryImgSelected);
    if (SDHubGalleryImgSelected === 0) SDHubGalleryToggleBatchBox();

    return count > 0;
  };

  const selectAll = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Select', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_MultiSelect,
    onclick: () => window.SDHubGalleryAllCheckbox()
  }),
  download = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Download', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_Download,
    onclick: () => SDHubGalleryInfoPopUp('batch-download')
  }),
  delet = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Delete', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_Delete,
    onclick: () => SDHubGalleryInfoPopUp('batch-delete')
  }),
  unselectAll = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Unselect', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_MultiUnselect,
    onclick: () => window.SDHubGalleryAllCheckbox(false)
  }),
  setting = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Setting', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_Setting,
    onclick: () => document.getElementById(`${SDHGS}-Button`)?.click()
  }),

  box = SDHubCreateEL('div', { id: 'SDHub-Gallery-Batch-Box', children: [selectAll, download, delet, unselectAll, setting] }),
  batchCon = SDHubCreateEL('div', { id: 'SDHub-Gallery-Batch-Container', class: 'sdhub-sticky-container', children: box });

  document.addEventListener('keydown', (e) => {
    const a = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a',
    C = id => document.getElementById(id)?.style.display;

    if (document.activeElement === document.querySelector('#SDHub-Gallery-ImgChest-API input')) return;

    if (
      C('tab_SDHub') !== 'block' || C('SDHub-Gallery-Tab') !== 'block' || C(`${SDHGiI}-Row`) === 'flex' ||
      C(`${SDHGiV}`) === 'flex' || C(`${SDHGS}`) === 'flex' || C('SDHub-Gallery-Info-Container') === 'flex'
    ) return;

    if (e.key === 'Delete' && box?.style.display == 'flex') return delet.click();

    if (!a) return;
    e.preventDefault();
    e.shiftKey ? unselectAll.click() : window.SDHubGalleryAllCheckbox() && setTimeout(() => SDHubGalleryToggleBatchBox('flex'), 0);
  });

  return batchCon;
}

async function SDHubGalleryCreateimgChest() {
  const imgchestColumn = document.getElementById('SDHub-Gallery-ImgChest-Column');
  if (!imgchestColumn) return;

  const imgchestButton = SDHubCreateEL('div', { id: 'SDHub-Gallery-ImgChest-Button', class: 'sdhub-gallery-ex-button', html: SDHubGallerySVG_ImgChest });
  document.getElementById('SDHub-Gallery-Tab-Button-Row').prepend(imgchestButton, imgchestColumn);

  const imgchestInfo = document.getElementById('SDHub-Gallery-ImgChest-Info');
  imgchestInfo.innerHTML = `${SDHubGetTranslation('auto_upload_to')}
    <a class='sdhub-gallery-imgchest-info' href='https://imgchest.com' target='_blank'>
      imgchest.com
    </a>
  `;

  const checkboxInput = imgchestColumn.querySelector('#SDHub-Gallery-ImgChest-Checkbox input'),
  checkboxSpan = imgchestColumn.querySelector('#SDHub-Gallery-ImgChest-Checkbox span');
  checkboxSpan.textContent = SDHubGetTranslation('click_to_enable');

  ['#SDHub-Gallery-ImgChest-Privacy', '#SDHub-Gallery-ImgChest-NSFW'].forEach(id =>
    imgchestColumn.querySelectorAll(`${id} label > span`).forEach(s => s.textContent = SDHubGetTranslation(s.textContent.toLowerCase()))
  );

  let fromColumn = false;

  const api = imgchestColumn.querySelector('#SDHub-Gallery-ImgChest-API input');
  api?.setAttribute('placeholder', SDHubGetTranslation('imgchest_api_key'));
  api?.addEventListener('mousedown', () => { fromColumn = window.getComputedStyle(imgchestColumn).opacity === '1'; });

  ['Save', 'Load'].forEach(key => {
    const btn = document.getElementById(`SDHub-Gallery-ImgChest-${key}-Button`);
    if (btn) {
      btn.title = SDHubGetTranslation(`${key.toLowerCase()}_setting`);
      btn.textContent = SDHubGetTranslation(key.toLowerCase());
    }
  });

  document.addEventListener('mouseup', () => {
    if (window.getComputedStyle(imgchestColumn).opacity === '1') setTimeout(() => fromColumn = false, 0);
  });

  checkboxInput.onchange = () => {
    const checked = checkboxInput.checked;
    checkboxSpan.textContent = SDHubGetTranslation(checked ? 'enabled' : 'click_to_enable');
    imgchestButton.classList.toggle(sdhubDisplay, checked);
  };

  await fetch(`${SDHubGalleryBase}/imgChest`)
    .then(r => r.json())
    .then(d => {
      const Radio = (id, v) => imgchestColumn.querySelector(`${id} label[data-testid='${v}-radio-label']`)?.click();
      Radio('#SDHub-Gallery-ImgChest-Privacy', d['privacy']);
      Radio('#SDHub-Gallery-ImgChest-NSFW', d['nsfw']);
      if (api) (api.value = d['api-key'], updateInput(api));
    })
    .catch(e => console.error('Error loading imgchest settings:', e));

  imgchestButton.onclick = () => {
    if (window.getComputedStyle(imgchestColumn).opacity === '0') imgchestColumn.classList.add(sdhubDisplay);
  };

  document.addEventListener('click', (e) => {
    if (
      imgchestColumn && !imgchestColumn.contains(e.target) &&
      !fromColumn && window.getComputedStyle(imgchestColumn).opacity === '1'
    ) {
      imgchestColumn.classList.remove(sdhubDisplay);
      fromColumn = false;
    }
  });
}

async function SDHubGalleryLoadInitial(retry = 1000) {
  try {
    const q = (id) => document.getElementById(id),
    infoCon = q('SDHub-Gallery-Info-Container'),
    Spinner = q('SDHub-Gallery-Info-Spinner');

    [infoCon, Spinner].forEach(el => el.classList.add('sdhub-gallery-spinner'));

    const res = await fetch(`${SDHubGalleryBase}/initial`),
    data = await res.json();

    if (data.status === 'waiting') {
      setTimeout(() => SDHubGalleryLoadInitial(retry), retry);
      return;
    }

    if (!data.images?.length) {
      [infoCon, Spinner].forEach(el => el.classList.remove('sdhub-gallery-spinner'));
      return;
    }

    let selectedTab = false;

    const imgBox = q('SDHub-Gallery-Image-Box-0'),
    date = /^(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})$/,
    tabMap = new Map();

    for (let i = data.images.length - 1; i >= 0; i--) {
      let { path, thumb, name } = data.images[i];
      let tab = SDHubGalleryTabList.find((t) => path.includes(`/${t}/`)) || 'extras-images';
      if (tab === 'extras-images') {
        if (path.includes('?init')) tab = 'init-images';
        else if (path.includes('?save')) tab = 'manual-save';
        else {
          const p = path.split('/'), d = p.findIndex((part) => date.test(part)), f = d >= 0 ? p[d] : '';
          if (f && (tab = f) && !q(`SDHub-Gallery-${tab}-Tab-Container`)) SDHubGalleryCloneTab(tab, p[d]);
        }
      }

      if (!tabMap.has(tab)) tabMap.set(tab, []); tabMap.get(tab).unshift({ path, thumb, name });;
    }

    const tabtab = SDHubGalleryTabList.filter(tab => tabMap.has(tab)),
    fallbackTabtab = Array.from(tabMap.keys()).filter(tab => !SDHubGalleryTabList.includes(tab)),
    allTabsInOrder = [...tabtab, ...fallbackTabtab];

    for (const [tabName, images] of tabMap.entries()) {
      const TabRow = q('SDHub-Gallery-Tab-Button-Row'),
      TabBtn = q(`SDHub-Gallery-${tabName}-Tab-Button`),
      TabCon = q(`SDHub-Gallery-${tabName}-Tab-Container`),
      wrapper = TabCon.querySelector(`.${sdhgp}-wrapper`),

      imageBoxes = images.map(({ path, thumb, name }) => {
        const newImgBox = imgBox.cloneNode(true);
        let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
        while (q(newId)) newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;

        newImgBox.id = newId;
        SDHubGalleryImageButtonEvents(newImgBox);

        const img = newImgBox.querySelector('img'),
        nameBox = newImgBox.querySelector('.sdhub-gallery-img-name'),
        named = decodeURIComponent(name);
        nameBox && (nameBox.textContent = named);

        if (img) {
          img.loading = 'lazy';
          img.dataset.image = path;
          img.title = named;

          const loadThumb = new Image();
          loadThumb.src = thumb;
          loadThumb.onload = () => img.src = thumb;
        }

        return newImgBox;
      });

      const totalPages = SDHubGalleryCreateImagePages(wrapper, imageBoxes);

      TabRow.classList.add(sdhubDisplay), TabBtn.style.display = 'flex';
      if (!selectedTab && tabName === allTabsInOrder[0]) {
        TabCon.classList.add('active'), TabBtn.classList.add('selected'), TabCon.style.display = 'flex';
        selectedTab = true;
      }

      SDHubGallerySwitchPage(tabName, null, totalPages - 1);
    }

    [infoCon, Spinner].forEach(el => el.classList.remove('sdhub-gallery-spinner'));
    SDHubGalleryTabImageCounters();
    document.body.classList.remove(SDHubBnS);
    console.log('SD-Hub Gallery Loaded');

  } catch (err) {
    console.error('Error in initial-load:', err);
  }
}

function SDHubGalleryCloneTab(id, name) {
  const TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row'),
  TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper'),

  exTabBtn = TabRow.querySelector('.sdhub-gallery-tab-button:not(.selected)'),
  TabBtn = exTabBtn.cloneNode(true),
  exTabCon = TabWrap.querySelector('.sdhub-gallery-tab-container:not(.active)'),
  TabCon = exTabCon.cloneNode(true),

  right = TabCon.querySelector(`.${sdhgp}-right-button`),
  left = TabCon.querySelector(`.${sdhgp}-left-button`);

  TabBtn.id = `SDHub-Gallery-${id}-Tab-Button`;
  TabBtn.textContent = name;
  TabBtn.style.display = 'flex';
  TabBtn.onclick = () => SDHubGallerySwitchTab(id);
  TabRow.append(TabBtn);

  TabCon.id = `SDHub-Gallery-${id}-Tab-Container`;
  TabCon.style.display = '';
  TabCon.addEventListener('scroll', window.SDHubGalleryPageArrowUpdate);
  TabWrap.append(TabCon);

  right.onclick = () => SDHubGallerySwitchPage(id, 'right')
  left.onclick = () => SDHubGallerySwitchPage(id, 'left')

  SDHubGalleryTabEvents(TabCon);
  if (!SDHubGalleryTabList.includes(id)) SDHubGalleryTabList.push(id);
}