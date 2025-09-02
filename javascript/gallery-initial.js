function SDHubGalleryDOMLoaded() {
  const file = `${window.SDHubFilePath}styleGallery.css?${(Date.now() / 1000).toFixed(6)}`,
  link = SDHubEL('link', { rel: 'stylesheet', property: 'stylesheet', href: file });
  document.body.appendChild(link);

  const SDHubGallery = SDHubEL('div', { id: 'SDHubGallery', style: { display: 'none' } }),

  Setting = SDHubEL('div', { id: `${SDHubVar.Setting}`, tabindex: 0 }),
  SettingButton = SDHubEL('div', {
    id: `${SDHubVar.Setting}-Button`, class: 'sdhub-gallery-ex-button', html: SDHubSVG.gear(), title: SDHubGetTranslation('setting_title')
  }),

  TabRow = SDHubEL('div', { id: 'SDHub-Gallery-Tab-Button-Row', children: SettingButton }),
  TabLayer = SDHubEL('div', { id: 'SDHub-Gallery-Tab-Layer' }),
  TabWrap = SDHubEL('div', { id: 'SDHub-Gallery-Tab-Wrapper' }),
  GalleryWrap = SDHubEL('div', { id: 'SDHub-Gallery-Wrapper', children: TabWrap });

  SDHubGalleryTabList.forEach(tabName => {
    let btnTitle = tabName.includes('-grids') ? tabName : tabName === 'Favorites' ? tabName  : tabName.split('-')[0].toLowerCase();

    const TabBtn = SDHubEL('button', {
      id: `SDHub-Gallery-${tabName}-Tab-Button`, class: ['lg', 'primary', 'gradio-button', 'svelte-cmf5ev', 'sdhub-gallery-tab-button'],
      text: btnTitle, onclick: () => SDHubGallerySwitchTab(tabName)
    }),

    pageWrapper = SDHubEL('div', { class: `${SDHubVar.page}-wrapper` }),
    TabCon = SDHubEL('div', { id: `SDHub-Gallery-${tabName}-Tab-Container`, class: 'sdhub-gallery-tab-container', children: pageWrapper }),

    navClick = (c) => {
      const btn = document.querySelector(c);
      requestAnimationFrame(() => {
        btn.style.transform = 'scale(1.25)'; btn.style.filter = 'var(--sdhub-gallery-flash-nav-button)';
        setTimeout(() => (btn.style.transform = btn.style.filter = ''), 300);
      });
    },

    rightNavButton = SDHubEL('span', {
      class: [`${SDHubVar.page}-right-button`, `${SDHubVar.page}-nav-button`], html: SDHubSVG.rightArrow(),
      onclick: () => (navClick(`.${SDHubVar.page}-right-button.btn-on`), SDHubGallerySwitchPage(tabName, 'right'))
    }),

    leftNavButton = SDHubEL('span', {
      class: [`${SDHubVar.page}-left-button`, `${SDHubVar.page}-nav-button`], html: SDHubSVG.leftArrow(),
      onclick: () => (navClick(`.${SDHubVar.page}-left-button.btn-on`), SDHubGallerySwitchPage(tabName, 'left'))
    }),

    pageIndicator = SDHubEL('span', { class: `${SDHubVar.page}-indicator`, text: '1 / 1' }),
    imgCounter = SDHubEL('div', { class: 'sdhub-gallery-tab-image-counter' }),
    pageNav = SDHubEL('div', { class: `${SDHubVar.page}-nav`, children: [leftNavButton, pageIndicator, rightNavButton, imgCounter] });

    TabCon.append(pageNav);
    TabRow.append(TabBtn);
    TabWrap.append(TabCon);
    SDHubGalleryTabEvents(TabCon);
  });

  const img = SDHubEL('img', { class: 'sdhub-gallery-img', src: 'https://huggingface.co/gutris1/webui/resolve/main/misc/card-no-preview.png' }),
  favBtn = SDHubEL('span', { class: ['sdhub-gallery-img-btn-fav', 'sdhub-gallery-img-btn'], html: SDHubSVG.favButton() }),
  CheckBtn = SDHubEL('span', { class: ['sdhub-gallery-img-btn-checkbox', 'sdhub-gallery-img-btn'], html: SDHubSVG.imageCheck() }),
  ViewerBtn = SDHubEL('span', { 
    class: ['sdhub-gallery-img-btn-imageviewer', 'sdhub-gallery-img-btn'], html: SDHubSVG.imageButton(),
    title: SDHubGetTranslation('image_viewer')
  }),

  imgName = SDHubEL('div', { class: 'sdhub-gallery-img-name' }),
  imgFrame = SDHubEL('div', { class: 'sdhub-gallery-img-frame' }),
  imgWrap = SDHubEL('div', { class: 'sdhub-gallery-img-wrapper', children: [img, favBtn, CheckBtn, ViewerBtn, imgName, imgFrame] }),

  imgBor = SDHubEL('span', { class: 'sdhub-gallery-img-border' }),
  imgCon = SDHubEL('div', { class: 'sdhub-gallery-img-container', children: [imgWrap, imgBor] }),
  imgBox = SDHubEL('div', { id: 'SDHub-Gallery-imgBox', class: 'sdhub-gallery-img-box', children: imgCon }),

  ImageInfoArrow = SDHubEL('div', { id: 'SDHub-Gallery-Image-Info-Arrow-Button', html: SDHubSVG.arrowButton() }),
  pageArrow = SDHubEL('div', { id: 'SDHub-Gallery-Page-Arrow-Button', class: 'sdhub-gallery-arrow-scroll', html: SDHubSVG.arrowButton() }),
  pageArrowWrap = SDHubEL('div', { id: 'SDHub-Gallery-Page-Arrow-Wrapper', class: 'sdhub-gallery-arrow-wrapper', children: pageArrow }),
  pageArrowCon = SDHubEL('div', { id: 'SDHub-Gallery-Page-Arrow-Container', class: 'sdhub-sticky-container', children: pageArrowWrap }),
  StickyCon = SDHubEL('div', { id: 'SDHub-Gallery-Sticky-Container', children: [SDHubGalleryCreateBatchBox(), pageArrowCon]});

  const ViewerBtnSVG = ViewerBtn.querySelector('svg');
  if (ViewerBtnSVG) ViewerBtnSVG.classList.remove('sdhub-gallery-cm-svg');

  GalleryWrap.prepend(TabRow, SDHubEL('div', { id: 'SDHub-Gallery-Page-Nav-Box'}));
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

    const imginfoRow = document.getElementById(`${SDHubVar.ImgInfo}-Row`),
    LightBox = document.getElementById(`${SDHubVar.ImgViewer}`),
    infoCon = document.getElementById('SDHub-Gallery-Info-Container');

    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const i = imginfoRow?.style.display === 'flex', b = LightBox?.style.display === 'flex',
      s = Setting?.style.display === 'flex', n = infoCon?.style.display === 'flex';
      if (i || b || s || n) return;

      const nav = document.querySelector(`.sdhub-gallery-tab-container.active > .${SDHubVar.page}-nav`),
      btn = nav?.querySelector(e.key === 'ArrowRight' ? `.${SDHubVar.page}-right-button.btn-on` : `.${SDHubVar.page}-left-button.btn-on`);
      btn?.click();
    }
  });

  SDHubGalleryPageArrowEvents(pageArrowWrap);
  SDHubGalleryImageInfoArrowEvents(ImageInfoArrow);
  SDHubGalleryWS();
}

function SDHubGalleryPageArrowEvents(arrow) {
  let svg = arrow.querySelector('svg'), locked = false;

  window.SDHubGalleryPageArrowUpdate = () => {
    const GalleryTab = document.getElementById('SDHub-Gallery-Tab'),
    GalleryWrap = document.getElementById('SDHub-Gallery-Wrapper'),
    Tab = GalleryWrap?.querySelector('.sdhub-gallery-tab-container.active'),
    page = Tab?.querySelector(`.${SDHubVar.page}s.selected-page`);

    if (!page) return arrow.style.transform = '';
    if (locked || GalleryTab.style.display !== 'block') return;

    const { scrollTop, scrollHeight, clientHeight } = page,
    overflow = scrollHeight > clientHeight + 1,
    down = scrollTop + clientHeight >= scrollHeight - 5;

    arrow.style.transform = overflow ? SDHubVar.scale : '';
    if (overflow) svg.style.transform = down ? 'rotate(180deg)' : 'rotate(0deg)';
  };

  arrow.addEventListener('click', () => {
    const GalleryWrap = document.getElementById('SDHub-Gallery-Wrapper'),
    Tab = GalleryWrap?.querySelector('.sdhub-gallery-tab-container.active'),
    page = Tab?.querySelector(`.${SDHubVar.page}s.selected-page`);
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
    page = Tab?.querySelector(`.${SDHubVar.page}s.selected-page`);
    if (!page || GalleryTab.style.display !== 'block') return;
    if (!locked) window.SDHubGalleryPageArrowUpdate();
  };

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, arrowButton));
}

function SDHubGalleryImageInfoArrowEvents(arrow) {
  let clicked = false;

  const whichEL = () => {
    const column = document.getElementById(`${SDHubVar.ImgInfo}-Row`),
    panel = document.getElementById(`${SDHubVar.ImgInfo}-Output-Panel`);
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
    const imginfoRow = document.getElementById(`${SDHubVar.ImgInfo}-Row`), el = whichEL();
    if (!el) return;
    if (getComputedStyle(imginfoRow).display !== 'flex') return arrow.style.transform = '';
    const { scrollTop, scrollHeight, clientHeight } = el,
    overflow = scrollHeight > clientHeight + 1,
    bottom = scrollTop + clientHeight >= scrollHeight - 5;
    arrow.style.transform = overflow && !bottom ? SDHubVar.scale : '';
  };

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, window.SDHubGalleryImageInfoArrowUpdate));
}

function SDHubGalleryCreateImagePages(wrapper, imageBoxes) {
  document.getElementById('SDHub-Gallery-Page-Nav-Box').style.display = 'flex';
  let existingPages = wrapper.querySelectorAll(`.${SDHubVar.page}s`),
  totalPages = existingPages.length,
  page = existingPages[totalPages - 1],
  imagesInLastPage = page ? page.querySelectorAll('.sdhub-gallery-img-box').length : 0;

  for (const imgBox of imageBoxes) {
    if (!page || imagesInLastPage >= SDHubGalleryPageLimit) {
      page = SDHubEL('div', { class: `${SDHubVar.page}s` });
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
  const cm = `
    <ul class='sdhub-gallery-cm-ul'>
      <li data-menu='open'>
        <span>${SDHubSVG.openInNewTab()} ${SDHubGetTranslation('open_new_tab')}</span>
      </li>
      <li data-menu='download'>
        <span>${SDHubSVG.download()} ${SDHubGetTranslation('download')}</span>
      </li>
      <li data-menu='copy'>
        <span>${SDHubSVG.copy()} ${SDHubGetTranslation('copy')}</span>
      </li>
      <li data-menu='info'>
        <span>${SDHubSVG.imageInfo()} ${SDHubGetTranslation('image_info')}</span>
      </li>
      <li data-menu='viewer'>
        <span>${SDHubSVG.imageButton()} ${SDHubGetTranslation('image_viewer')}</span>
      </li>
      <span class='sdhub-gallery-cm-line'></span>
      <li id='SDHub-Gallery-Context-Select' data-menu='select'>
        <span>${SDHubSVG.imageCheck()} ${SDHubGetTranslation('select_image')}</span>
      </li>
      <li id='SDHub-Gallery-Context-Unselect' data-menu='unselect'>
        <span>${SDHubSVG.imageUncheck()} ${SDHubGetTranslation('unselect_image')}</span>
      </li>
      <li class='sdhub-gallery-cm-sendto'>
        <span>${SDHubSVG.menuButton()} ${SDHubGetTranslation('send_to')} ${SDHubSVG.subMenuArrow('sdhub-gallery-cm-svg submenu-arrow')}</span>
      </li>
      <span class='sdhub-gallery-cm-line'></span>
      <li data-menu='delete'>
        <span>${SDHubSVG.delete()} ${SDHubGetTranslation('delete')}</span>
      </li>
    </ul>
    <div id='SDHub-Gallery-ContextMenu-SubMenu-SendTo' class='sdhub-gallery-cm-menu sdhub-gallery-cm-submenu'>
      <ul class='sdhub-gallery-cm-ul'>
        <li data-submenu='txt2img'>txt2img</li>
        <li data-submenu='img2img'>img2img</li>
        <li data-submenu='extras'>extras</li>
        <li data-submenu='inpaint'>inpaint</li>
        <li data-submenu='uploader'>${SDHubGetTranslation('uploader')}</li>
      </ul>
    </div>
  `,

  GalleryCM = SDHubEL('div', {  id: 'SDHub-Gallery-ContextMenu', class: 'sdhub-gallery-cm-menu', html: cm });

  GalleryCM.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li || !GalleryCM.contains(li)) return;

    if (li.dataset.menu) {
      SDHubGalleryContextMenuButton(li.dataset.menu);
    } else if (li.dataset.submenu) {
      SDHubGallerySendImage(li.dataset.submenu);
    }

    SDHubGalleryContextMenuClose();
  });

  document.addEventListener('wheel', (e) => {
    GalleryCM.classList.contains(SDHubVar.style) ? (GalleryCM.contains(e.target)
      ? e.preventDefault()
      : SDHubGalleryContextMenuClose())
      : null;
  }, { passive: false });

  document.addEventListener('click', (e) => {
    if (!e.isTrusted) return;
    if (GalleryCM.classList.contains(SDHubVar.style) && !GalleryCM.contains(e.target)) SDHubGalleryContextMenuClose();
  });

  document.addEventListener('contextmenu', (e) => {
    if (GalleryCM?.contains(e.target)) e.preventDefault();
  });

  return GalleryCM;
}

function SDHubGalleryCreateLightBox() {
  const NextBtn = SDHubEL('span', {
    id: `${SDHubVar.ImgViewer}-Next-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubSVG.rightArrow(),
    onclick: (e) => (e.stopPropagation(), SDHubGalleryNextImage())
  }),

  PrevBtn = SDHubEL('span', {
    id: `${SDHubVar.ImgViewer}-Prev-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubSVG.leftArrow(),
    onclick: (e) => (e.stopPropagation(), SDHubGalleryPrevImage())
  }),

  ExitBtn = SDHubEL('span', {
    id: `${SDHubVar.ImgViewer}-Exit-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubSVG.cross(),
    onclick: (e) => (e.stopPropagation(), window.SDHubGalleryImageViewerExit())
  }),

  Control = SDHubEL('div', { id: `${SDHubVar.ImgViewer}-Control`, children: [NextBtn, PrevBtn, ExitBtn] }),
  Wrapper = SDHubEL('div', { id: `${SDHubVar.ImgViewer}-Wrapper`}),
  LightBox = SDHubEL('div', { id: `${SDHubVar.ImgViewer}`, tabindex: 0, children: [Control, Wrapper] });

  return LightBox;
}

function SDHubGalleryCreateInfoBox() {
  const Spinner = SDHubEL('div', { id: 'SDHub-Gallery-Info-Spinner', html: SDHubSVG.spinner() }),

  infoText = SDHubEL('p', { id: 'SDHub-Gallery-Info-Text', text: '' }),
  infoBatchTitle = SDHubEL('span', { id: 'SDHub-Gallery-Info-Batch-Title', text: SDHubGetTranslation('batch_download') }),
  infoBatchText = SDHubEL('span', { id: 'SDHub-Gallery-Info-Batch-Text'}),
  infoBatchInput = SDHubEL('input', { id: 'SDHub-Gallery-Info-Batch-Input', type: 'text', placeholder: SDHubGetTranslation('default_batch') }),
  infoBatch = SDHubEL('div', { id: 'SDHub-Gallery-Info-Batch', children: [infoBatchTitle, infoBatchText, infoBatchInput]}),

  infoWarningInput = SDHubEL('input', { id: 'SDHub-Gallery-Info-Warning-Input', class: 'sdhub-gallery-info-checkbox-input', type: 'checkbox' }),
  infoWarningText = SDHubEL('span', { id: 'SDHub-Gallery-Info-Warning-Text', class: 'sdhub-gallery-info-checkbox-text' }),
  infoWarning = SDHubEL('div', {
    id: 'SDHub-Gallery-Info-Warning', class: ['sdhub-checkbox', 'sdhub-gallery-info-checkbox'], children: [infoWarningInput, infoWarningText],
    onclick: () => infoWarningInput.click()
  }),

  infoCheckboxInput = SDHubEL('input', { id: 'SDHub-Gallery-Info-Checkbox-Input', class: 'sdhub-gallery-info-checkbox-input', type: 'checkbox' }),
  infoCheckboxText = SDHubEL('span', { id: 'SDHub-Gallery-Info-Checkbox-Text', class: 'sdhub-gallery-info-checkbox-text' }),
  infoCheckbox = SDHubEL('div', {
    id: 'SDHub-Gallery-Info-Checkbox', class: ['sdhub-checkbox', 'sdhub-gallery-info-checkbox'], children: [infoCheckboxInput, infoCheckboxText],
    onclick: () => infoCheckboxInput.click()
  }),

  ButtonRow = SDHubEL('div', { id: 'SDHub-Gallery-Info-Button-Row' }),
  Yes = SDHubEL('span', { id: 'SDHub-Gallery-Info-Yes-Button', class: 'sdhub-gallery-info-button' }),
  No = SDHubEL('span', { id: 'SDHub-Gallery-Info-No-Button', class: 'sdhub-gallery-info-button' }),

  infoCheckboxWrap = SDHubEL('div', { id: 'SDHub-Gallery-Info-Checkbox-Wrapper', children: [infoCheckbox, infoWarning] }),
  infoInner = SDHubEL('div', { id: 'SDHub-Gallery-Info-Inner', children: [infoText, infoCheckboxWrap, infoBatch, ButtonRow] }),
  infoBox = SDHubEL('div', { id: 'SDHub-Gallery-Info-Box', children: infoInner }),
  infoCon = SDHubEL('div', { id: 'SDHub-Gallery-Info-Container', children: [infoBox, Spinner] }),

  lang = navigator.language || navigator.languages[0] || 'en';
  ButtonRow.append(...(lang.startsWith('ja') || lang.startsWith('zh') ? [No, Yes] : [Yes, No]));

  document.addEventListener('keydown', (e) => {
    const C = id => document.getElementById(id)?.style.display === 'block',
    infoBox = document.getElementById('SDHub-Gallery-Info-Box');
    if (!C('tab_SDHub') || !C('SDHub-Gallery-Tab')) return;

    if (infoBox.classList.contains(SDHubVar.style)) {
      if (e.key === 'Enter') e.preventDefault(); ({ Enter: Yes, Escape: No }[e.key]?.click());
    }
  });

  return infoCon;
}

function SDHubGalleryCreateBatchBox() {
  window.SDHubGalleryAllCheckbox = (add = true, currentOnly = true) => {
    const tab = document.querySelector('.sdhub-gallery-tab-container.active'),
    pages = currentOnly
      ? [tab?.querySelector(`.${SDHubVar.page}s.selected-page`)].filter(Boolean)
      : Array.from(tab?.querySelectorAll(`.${SDHubVar.page}s`) || []);

    if (!pages.length) return false;

    let count = 0;

    pages.forEach(page => {
      const s = `.sdhub-gallery-img-box${add ? `:not(.${SDHubVar.imgSelected})` : `.${SDHubVar.imgSelected}`}`,
      imgBox = page.querySelectorAll(s);
      if (!imgBox.length) return;

      imgBox.forEach(c => {
        c.classList.toggle(SDHubVar.imgSelected, add);
        const cb = c.querySelector('.sdhub-gallery-img-btn-checkbox');
        if (cb) {
          cb.classList.toggle(SDHubVar.imgSelected, add);
          cb.innerHTML = add ? SDHubSVG.imageUncheck() : SDHubSVG.imageCheck();
        }
      });
      count += imgBox.length;
    });

    SDHubGalleryImgSelected += add ? count : -count;
    SDHubGalleryImgSelected = Math.max(0, SDHubGalleryImgSelected);
    if (SDHubGalleryImgSelected === 0) SDHubGalleryToggleBatchBox();

    return count > 0;
  };

  const selectAll = SDHubEL('div', {
    id: 'SDHub-Gallery-Batch-Select', class: 'sdhub-gallery-batch-button', html: SDHubSVG.multiSelect(),
    onclick: () => window.SDHubGalleryAllCheckbox()
  }),
  download = SDHubEL('div', {
    id: 'SDHub-Gallery-Batch-Download', class: 'sdhub-gallery-batch-button', html: SDHubSVG.download(),
    onclick: () => SDHubGalleryInfoPopUp('batch-download')
  }),
  delet = SDHubEL('div', {
    id: 'SDHub-Gallery-Batch-Delete', class: 'sdhub-gallery-batch-button', html: SDHubSVG.delete(),
    onclick: () => SDHubGalleryInfoPopUp('batch-delete')
  }),
  unselectAll = SDHubEL('div', {
    id: 'SDHub-Gallery-Batch-Unselect', class: 'sdhub-gallery-batch-button', html: SDHubSVG.multiUnselect(),
    onclick: () => window.SDHubGalleryAllCheckbox(false)
  }),
  setting = SDHubEL('div', {
    id: 'SDHub-Gallery-Batch-Setting', class: 'sdhub-gallery-batch-button', html: SDHubSVG.gear(),
    onclick: () => document.getElementById(`${SDHubVar.Setting}-Button`)?.click()
  }),

  box = SDHubEL('div', { id: 'SDHub-Gallery-Batch-Box', children: [selectAll, download, delet, unselectAll, setting] }),
  batchCon = SDHubEL('div', { id: 'SDHub-Gallery-Batch-Container', class: 'sdhub-sticky-container', children: box });

  document.addEventListener('keydown', (e) => {
    const a = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a',
    C = id => document.getElementById(id)?.style.display;

    if (document.activeElement === document.querySelector('#SDHub-Gallery-ImgChest-API input')) return;

    if (
      C('tab_SDHub') !== 'block' || C('SDHub-Gallery-Tab') !== 'block' || C(`${SDHubVar.ImgInfo}-Row`) === 'flex' ||
      C(`${SDHubVar.ImgViewer}`) === 'flex' || C(`${SDHubVar.Setting}`) === 'flex' || C('SDHub-Gallery-Info-Container') === 'flex'
    ) return;

    if (e.key === 'Delete' && box?.style.display == 'flex') return delet.click();

    if (!a) return;
    e.preventDefault();
    e.shiftKey ? unselectAll.click() : window.SDHubGalleryAllCheckbox() && setTimeout(() => SDHubGalleryToggleBatchBox('flex'), 0);
  });

  return batchCon;
}

async function SDHubGalleryCreateimgChest() {
  const column = document.getElementById('SDHub-Gallery-ImgChest-Column');
  if (!column) return;

  const button = SDHubEL('div', { id: 'SDHub-Gallery-ImgChest-Button', class: 'sdhub-gallery-ex-button', html: SDHubSVG.imgChest() });
  document.getElementById('SDHub-Gallery-Tab-Button-Row').prepend(button, column);

  const info = document.getElementById('SDHub-Gallery-ImgChest-Info');
  info.innerHTML = `${SDHubGetTranslation('auto_upload_to')}
    <a class='sdhub-gallery-imgchest-info' href='https://imgchest.com' target='_blank'>
      imgchest.com
    </a>
  `;

  const checkboxInput = column.querySelector('#SDHub-Gallery-ImgChest-Checkbox input'),
  checkboxSpan = column.querySelector('#SDHub-Gallery-ImgChest-Checkbox span');
  checkboxSpan.textContent = SDHubGetTranslation('click_to_enable');

  ['#SDHub-Gallery-ImgChest-Privacy', '#SDHub-Gallery-ImgChest-NSFW'].forEach(id =>
    column.querySelectorAll(`${id} label > span`).forEach(s => s.textContent = SDHubGetTranslation(s.textContent.toLowerCase()))
  );

  let fromColumn = false;

  const api = column.querySelector('#SDHub-Gallery-ImgChest-API input');
  api?.setAttribute('placeholder', SDHubGetTranslation('imgchest_api_key'));
  api?.addEventListener('mousedown', () => { fromColumn = window.getComputedStyle(column).opacity === '1'; });

  ['Save', 'Load'].forEach(key => {
    const btn = document.getElementById(`SDHub-Gallery-ImgChest-${key}-Button`);
    if (btn) {
      btn.title = SDHubGetTranslation(`${key.toLowerCase()}_setting`);
      btn.textContent = SDHubGetTranslation(key.toLowerCase());
    }
  });

  document.addEventListener('mouseup', () => {
    if (window.getComputedStyle(column).opacity === '1') setTimeout(() => fromColumn = false, 0);
  });

  checkboxInput.onchange = () => {
    const checked = checkboxInput.checked;
    checkboxSpan.textContent = SDHubGetTranslation(checked ? 'enabled' : 'click_to_enable');
    button.classList.toggle(SDHubVar.style, checked);
  };

  await fetch(`${SDHubVar.GalleryBase}-imgChest`)
    .then(r => r.json())
    .then(d => {
      const Radio = (id, v) => column.querySelector(`${id} label[data-testid='${v}-radio-label']`)?.click();
      Radio('#SDHub-Gallery-ImgChest-Privacy', d['privacy']);
      Radio('#SDHub-Gallery-ImgChest-NSFW', d['nsfw']);
      if (api) (api.value = d['api-key'], updateInput(api));
    })
    .catch(e => console.error('Error loading imgchest settings:', e));

  button.onclick = () => {
    if (window.getComputedStyle(column).opacity === '0') column.classList.add(SDHubVar.style);
  };

  document.addEventListener('click', (e) => {
    if (column && !column.contains(e.target) && !fromColumn && window.getComputedStyle(column).opacity === '1') {
      column.classList.remove(SDHubVar.style);
      fromColumn = false;
    }
  });
}

async function SDHubGalleryImgChest(images) {
  if (!document.querySelector('#SDHub-Gallery-ImgChest-Checkbox input')?.checked) return;
  const api = document.querySelector('#SDHub-Gallery-ImgChest-API input')?.value.trim();
  if (!api) return;

  const getRadio = (id) =>
    document.querySelector(`${id} > div > label.selected`)
      ?.getAttribute('data-testid')?.replace('-radio-label', '').toLowerCase() || '',

  privacy = getRadio('#SDHub-Gallery-ImgChest-Privacy') || 'hidden',
  nsfw = getRadio('#SDHub-Gallery-ImgChest-NSFW') || 'true',

  s = images.map(img => ({
    url: `${window.location.protocol}//${window.location.host}${img.path}`,
    name: img.name
  })).sort((a, b) => b.name.includes('grid-') - a.name.includes('grid-')),

  d = {
    images: s,
    title: (s.length > 1 && s.some(item => item.name.includes('grid-'))) ? s[1].name : s[0]?.name || '',
    privacy, nsfw, api,
  };

  try {
    const r = await fetch(`${SDHubVar.GalleryBase}-imgChest-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    }),

    j = await r.json();
    console.log('Uploaded :', j);
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

async function SDHubGalleryCreateImageFile(path) {
  try {
    const res = await fetch(path),
    blob = await res.blob(),
    name = path.split('/').pop().split('?')[0];
    return new File([blob], name, { type: blob.type });
  } catch (err) { console.error('Error in creating file:', err); return null; }
}

async function SDHubGalleryUpdateImageInput(input, path) {
  try {
    const file = await SDHubGalleryCreateImageFile(path);
    if (!file) throw new Error('Failed to create file');
    const data = new DataTransfer();
    data.items.add(file);
    input.files = data.files;
    const e = new Event('change', { bubbles: true, composed: true });
    input.dispatchEvent(e);
  } catch (err) { console.error('Error in updating image input:', err); }
}

function SDHubGallerySwitchPage(tabName, direction = null, targetIndex = null) {
  if (SDHubGalleryPageLocks[tabName]) return;
  let selected = 'selected-page';

  const TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`),
  wrapper = TabCon.querySelector(`.${SDHubVar.page}-wrapper`),
  pages = Array.from(wrapper.children);

  if (pages.length === 0) return;

  let pageIndex = pages.findIndex(p => p.classList.contains(selected));
  if (pageIndex === -1) pageIndex = 0;

  const newIndex = targetIndex !== null
    ? targetIndex : direction === 'left'
      ? Math.min(pageIndex + 1, pages.length - 1) : direction === 'right'
        ? Math.max(pageIndex - 1, 0) : pageIndex;

  if (newIndex === pageIndex) return;

  const currentPage = pages[pageIndex], newPage = pages[newIndex];
  SDHubGalleryPageLocks[tabName] = true;

  requestAnimationFrame(() => {
    currentPage.classList.remove(selected);
    newPage.classList.add(selected);
    SDHubGalleryPageLocks[tabName] = false;
    setTimeout(() => window.SDHubGalleryPageArrowUpdate(), 0);
  });

  const nav = TabCon.querySelector(`.${SDHubVar.page}-nav`),
  right = nav?.querySelector(`.${SDHubVar.page}-right-button`),
  left = nav?.querySelector(`.${SDHubVar.page}-left-button`),
  indi = nav?.querySelector(`.${SDHubVar.page}-indicator`);

  right && right.classList.toggle('btn-on', newIndex > 0);
  left && left.classList.toggle('btn-on', newIndex < pages.length - 1);
  indi && (indi.textContent = `${newIndex + 1} / ${pages.length}`);
}

function SDHubGallerySwitchTab(tabName) {
  const box = document.getElementById('SDHub-Gallery-Batch-Box');
  box?.style.display === 'flex' ? SDHubGalleryInfoPopUp('switch-tab', tabName) : SDHubGalleryTabSwitch(tabName);
}

function SDHubGalleryTabSwitch(tabName) {
  const Btn = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Button`),
  Tab = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`);

  if (Btn?.classList.contains('selected')) return;

  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Container']").forEach(tab => {
    tab.style.display = ''; tab.classList.remove('active');
  });

  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Button']").forEach(btn => btn.classList.remove('selected'));

  if (Tab) (Tab.style.display = 'flex', Tab.classList.add('active'));
  if (Btn) Btn.classList.add('selected');

  setTimeout(() => window.SDHubGalleryPageArrowUpdate(), 0);
}

function SDHubGalleryTabEvents(TabCon) {
  TabCon.ondrag = TabCon.ondragend = TabCon.ondragstart = (e) => (e.stopPropagation(), e.preventDefault());

  TabCon.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const imgEL = e.target.closest('img');
    if (!imgEL || !TabCon.contains(imgEL)) return SDHubGalleryContextMenuClose();

    SDHubGalleryCMRightClick = true;
    SDHubGalleryCMTouch = false;
    SDHubGalleryContextMenu(e, imgEL);
  });

  let touche;

  TabCon.addEventListener('touchstart', (e) => {
    const imgEL = e.target.closest('img');
    if (!imgEL || !TabCon.contains(imgEL)) return SDHubGalleryContextMenuClose();

    touche = setTimeout(() => {
      SDHubGalleryCMRightClick = true;
      SDHubGalleryCMTouch = true;
      SDHubGalleryContextMenu(e, imgEL);
    }, 500);
  });

  ['touchend', 'touchmove', 'touchcancel'].forEach(event => {
    TabCon.addEventListener(event, () => clearTimeout(touche));
  });
}

function SDHubGalleryTabImageCounters(tabName) {
  let t;

  if (tabName) {
    const tab = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`);
    t = tab ? [tab] : [];
  } else {
    t = Array.from(document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Container']"));
  }

  t.forEach(tab => {
    const n = tab.querySelectorAll('img').length, c = tab.querySelector('.sdhub-gallery-tab-image-counter');
    c && (c.textContent = n > 0 ? `${n} ${SDHubGetTranslation('item', n)}` : '');
  });
}

async function SDHubGalleryLoadInitial(retry = 1000) {
  try {
    const g = (id) => document.getElementById(id),
    box = g('SDHub-Gallery-imgBox'),
    infoCon = g('SDHub-Gallery-Info-Container'),
    Spinner = g('SDHub-Gallery-Info-Spinner');
    [infoCon, Spinner].forEach(el => el.classList.add(SDHubVar.style));

    const r = await (await fetch(`${SDHubVar.GalleryBase}-initial`)).json();

    if (r.status === 'waiting') {
      setTimeout(() => SDHubGalleryLoadInitial(retry), retry);
      return;
    }

    if (!r.images?.length) {
      [infoCon, Spinner].forEach(el => el.classList.remove(SDHubVar.style));
      return;
    }

    let selectedTab = false;

    const date = /^(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})$/, tabMap = new Map();
    for (let i = r.images.length - 1; i >= 0; i--) {
      let { path, thumb, name } = r.images[i];

      const Fav = path.includes('?favorite') || path.includes('&favorite');
      const imgPath = path.replace(/[?&]favorite/, '').split('?')[0];

      let tab = SDHubGalleryTabList.find((t) => imgPath.includes(`/${t}/`)) || 'extras-images';
      if (tab === 'extras-images') {
        if (path.includes('?init')) tab = 'init-images';
        else if (path.includes('?save')) tab = 'manual-save';
        else {
          const p = imgPath.split('/'), d = p.findIndex((part) => date.test(part)), f = d >= 0 ? p[d] : '';
          if (f && (tab = f) && !g(`SDHub-Gallery-${tab}-Tab-Container`)) SDHubGalleryCloneTab(tab, p[d]);
        }
      }

      if (!tabMap.has(tab)) tabMap.set(tab, []);
      tabMap.get(tab).unshift({ path: imgPath, thumb, name, fav: Fav });
    }

    if (r.favorites?.length) {
      tabMap.set('Favorites', r.favorites.map(({ path, thumb, name }) => ({
        path: path.split('?')[0], thumb, name, fav: true
      })));
    }

    const tabtab = SDHubGalleryTabList.filter(tab => tabMap.has(tab)),
    fallbackTabtab = Array.from(tabMap.keys()).filter(tab => !SDHubGalleryTabList.includes(tab)),
    allTabsInOrder = [...tabtab, ...fallbackTabtab];

    for (const [tabName, images] of tabMap.entries()) {
      const TabRow = g('SDHub-Gallery-Tab-Button-Row'),
      TabBtn = g(`SDHub-Gallery-${tabName}-Tab-Button`),
      TabCon = g(`SDHub-Gallery-${tabName}-Tab-Container`),
      wrapper = TabCon.querySelector(`.${SDHubVar.page}-wrapper`),

      imageBoxes = images.map(({ path, thumb, name, fav }) => {
        const imgBox = box.cloneNode(true);
        imgBox.removeAttribute('id');
        SDHubGalleryImageButtonEvents(imgBox);

        const img = imgBox.querySelector('img'),
        nameBox = imgBox.querySelector('.sdhub-gallery-img-name'),
        named = decodeURIComponent(name);
        nameBox && (nameBox.textContent = named);

        if (fav) imgBox.classList.add(SDHubVar.imgFavorited);

        if (img) {
          img.loading = 'lazy';
          img.dataset.image = path;
          img.title = named;

          const imgThumb = new Image();
          imgThumb.src = thumb;
          imgThumb.onload = () => img.src = thumb;
        }

        return imgBox;
      });

      const totalPages = SDHubGalleryCreateImagePages(wrapper, imageBoxes);

      TabRow.classList.add(SDHubVar.style);
      TabBtn.style.display = 'flex';

      if (!selectedTab && tabName === allTabsInOrder[0]) {
        TabCon.classList.add('active');
        TabBtn.classList.add('selected');
        TabCon.style.display = 'flex';
        selectedTab = true;
      }

      SDHubGallerySwitchPage(tabName, null, totalPages - 1);
    }

    [infoCon, Spinner].forEach(el => el.classList.remove(SDHubVar.style));
    SDHubGalleryTabImageCounters();
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

  right = TabCon.querySelector(`.${SDHubVar.page}-right-button`),
  left = TabCon.querySelector(`.${SDHubVar.page}-left-button`);

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

function SDHubGalleryWS() {
  const u = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${SDHubVar.GalleryBase}/w`;
  let c = false, r = 0;

  (function f() {
    if (c || r >= 2) return;
    const w = new WebSocket(u);
    w.onopen = () => (c = true, r = 0, w.send('ping'));
    w.onclose = (e) => (c = false, e.code !== 2000 && ++r < 2 && setTimeout(() => !c && f(), 2000));
    w.onerror = () => (c = false, r++);
    w.onmessage = (e) => {
      if (e.data === 'pong') return;
      const j = JSON.parse(e.data);
      j.batch ? SDHubGalleryImgChest(j.images) : SDHubGalleryNewImage([j]);
    };
  })();
}