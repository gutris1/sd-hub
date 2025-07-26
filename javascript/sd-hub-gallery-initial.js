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

  const SDHubGallery = SDHubCreateEL('div', { id: 'SDHubGallery', style: { display: 'none' } });

  const Setting = SDHubCreateEL('div', { id: `${SDHGS}`, tabindex: 0 }),
        SettingButton = SDHubCreateEL('div', {
          id: `${SDHGS}-Button`, class: 'sdhub-gallery-ex-button', html: SDHubGallerySVG_Setting, title: SDHubGetTranslation('setting_title')
        });

  const TabRow = SDHubCreateEL('div', { id: 'SDHub-Gallery-Tab-Button-Row', children: SettingButton }),
        TabLayer = SDHubCreateEL('div', { id: 'SDHub-Gallery-Tab-Layer' }),
        TabWrap = SDHubCreateEL('div', { id: 'SDHub-Gallery-Tab-Wrapper' }),
        GalleryWrap = SDHubCreateEL('div', { id: 'SDHub-Gallery-Wrapper', children: TabWrap });

  SDHubGalleryTabList.forEach(whichTab => {
    let btnTitle = whichTab.includes('-grids') ? whichTab : whichTab.split('-')[0].toLowerCase();

    const TabBtn = SDHubCreateEL('button', {
      id: `SDHub-Gallery-${whichTab}-Tab-Button`, class: ['lg', 'primary', 'gradio-button', 'svelte-cmf5ev', 'sdhub-gallery-tab-button'],
      text: btnTitle, onclick: () => SDHubGallerySwitchTab(whichTab)
    });

    const pageWrapper = SDHubCreateEL('div', { class: `${sdhgp}-wrapper` }),
          TabCon = SDHubCreateEL('div', { id: `SDHub-Gallery-${whichTab}-Tab-Container`, class: 'sdhub-gallery-tab-container', children: pageWrapper });

    const rightNavButton = SDHubCreateEL('span', {
      class: [`${sdhgp}-right-button`, `${sdhgp}-nav-button`], html: SDHubGallerySVG_RightArrow,
      onclick: () => SDHubGallerySwitchPage(whichTab, 'right')
    });
    const leftNavButton = SDHubCreateEL('span', {
      class: [`${sdhgp}-left-button`, `${sdhgp}-nav-button`], html: SDHubGallerySVG_LeftArrow,
      onclick: () => SDHubGallerySwitchPage(whichTab, 'left')
    });
    const pageIndicator = SDHubCreateEL('span', { class: `${sdhgp}-indicator`, text: '1 / 1' }),
          imgCounter = SDHubCreateEL('div', { id: `SDHub-Gallery-${whichTab}-Tab-Image-Counter`, class: 'sdhub-gallery-tab-image-counter' }),
          pageNav = SDHubCreateEL('div', { class: `${sdhgp}-nav`, children: [leftNavButton, pageIndicator, rightNavButton, imgCounter] });
    TabCon.appendChild(pageNav);

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
        imgBox = SDHubCreateEL('div', { id: 'SDHub-Gallery-Image-Box-0', class: 'sdhub-gallery-img-box', children: imgCon });

  const ImageInfoArrow = SDHubCreateEL('div', { id: 'SDHub-Gallery-Imageinfo-Arrow-Button', html: SDHubGallerySVG_ArrowButton }),
        pageArrow = SDHubCreateEL('div', { id: 'SDHub-Gallery-Page-Arrow-Button', class: 'sdhub-gallery-arrow-scroll', html: SDHubGallerySVG_ArrowButton }),
        pageArrowWrap = SDHubCreateEL('div', { id: 'SDHub-Gallery-Page-Arrow-Wrapper', class: 'sdhub-gallery-arrow-wrapper', children: pageArrow }),
        pageArrowCon = SDHubCreateEL('div', { id: 'SDHub-Gallery-Page-Arrow-Container', class: 'sdhub-sticky-container', children: pageArrowWrap }),
        StickyCon = SDHubCreateEL('div', { id: 'SDHub-Gallery-Sticky-Container', children: [SDHubGalleryCreateBatchBox(), pageArrowCon]});

  const ViewerBtnSVG = ViewerBtn.querySelector('svg');
  if (ViewerBtnSVG) ViewerBtnSVG.classList.remove('sdhub-gallery-cm-svg');

  const pageNavBox = SDHubCreateEL('div', { id: 'SDHub-Gallery-Page-Nav-Box'});

  GalleryWrap.prepend(TabRow, pageNavBox);
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
  let svg = arrow.querySelector('svg');
  let locked = false;

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

    arrow.style.transform = overflow ? 'scale(var(--sdhub-scale))' : '';
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
    const imginfoRow = document.getElementById(`${SDHGiI}-Row`),
          el = whichEL();
    if (!el) return;
    if (getComputedStyle(imginfoRow).display !== 'flex') return arrow.style.transform = '';
    const { scrollTop, scrollHeight, clientHeight } = el,
          overflow = scrollHeight > clientHeight + 1,
          bottom = scrollTop + clientHeight >= scrollHeight - 5;
    arrow.style.transform = overflow && !bottom ? 'scale(var(--sdhub-scale))' : '';
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
  const submenuArrowSVG = SDHubGallerySVG_SubArrow.replace('<svg', '<svg class="sdhub-gallery-cm-svg submenu-arrow"');

  const cm = `
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
  `;

  const GalleryCM = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-ContextMenu', class: 'sdhub-gallery-cm-menu', html: cm
  });

  document.addEventListener('wheel', (e) => {
    GalleryCM.style.transform === 'scale(var(--sdhub-scale))' ? GalleryCM.contains(e.target) ? e.preventDefault() : SDHubGalleryKillContextMenu() : null;
  }, { passive: false });

  document.addEventListener('click', (e) => {
    let btn = '.sdhub-gallery-img-btn-contextmenu';
    if (GalleryCM?.style.transform === 'scale(var(--sdhub-scale))' && !GalleryCM.contains(e.target) && !e.target.closest(btn)) SDHubGalleryKillContextMenu();
  });

  document.addEventListener('contextmenu', (e) => { if (GalleryCM?.contains(e.target)) e.preventDefault(); });

  return GalleryCM;
}

function SDHubGalleryCreateLightBox() {
  const NextBtn = SDHubCreateEL('span', {
    id: `${SDHGiV}-Next-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubGallerySVG_RightArrow,
    onclick: (e) => (e.stopPropagation(), SDHubGalleryNextImage())
  });

  const PrevBtn = SDHubCreateEL('span', {
    id: `${SDHGiV}-Prev-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubGallerySVG_LeftArrow,
    onclick: (e) => (e.stopPropagation(), SDHubGalleryPrevImage())
  });

  const CloseBtn = SDHubCreateEL('span', {
    id: `${SDHGiV}-Close-Button`, class: 'sdhub-gallery-img-viewer-button', html: SDHubGallerySVG_Cross,
    onclick: (e) => (e.stopPropagation(), window.SDHubGalleryImageViewerCloseZoom())
  });

  const Control = SDHubCreateEL('div', { id: `${SDHGiV}-Control`, children: [NextBtn, PrevBtn, CloseBtn] }),
        Wrapper = SDHubCreateEL('div', { id: `${SDHGiV}-Wrapper` }),
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
  const Spinner = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Spinner', html: SDHubGallerySVG_Spinner });
  Spinner.querySelector('svg')?.classList.add('sdhub-gallery-spinner-rotation');

  const infoText = SDHubCreateEL('p', { id: 'SDHub-Gallery-Info-Text', text: '' });

  const infoBatchTitle = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Batch-Title', text: SDHubGetTranslation('batch_download') }),
        infoBatchText = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Batch-Text'}),
        infoBatchInput = SDHubCreateEL('input', { id: 'SDHub-Gallery-Info-Batch-Input', type: 'text', placeholder: SDHubGetTranslation('default_batch') }),
        infoBatch = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Batch', children: [infoBatchTitle, infoBatchText, infoBatchInput]});

  const infoWarningInput = SDHubCreateEL('input', { id: 'SDHub-Gallery-Info-Warning-Input', class: 'sdhub-gallery-info-checkbox-input', type: 'checkbox' }),
        infoWarningText = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Warning-Text', class: 'sdhub-gallery-info-checkbox-text' }),
        infoWarning = SDHubCreateEL('div', {
          id: 'SDHub-Gallery-Info-Warning', class: ['sdhub-checkbox', 'sdhub-gallery-info-checkbox'], children: [infoWarningInput, infoWarningText],
          onclick: () => infoWarningInput.click()
        });

  const infoCheckboxInput = SDHubCreateEL('input', { id: 'SDHub-Gallery-Info-Checkbox-Input', class: 'sdhub-gallery-info-checkbox-input', type: 'checkbox' }),
        infoCheckboxText = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Checkbox-Text', class: 'sdhub-gallery-info-checkbox-text' }),
        infoCheckbox = SDHubCreateEL('div', {
          id: 'SDHub-Gallery-Info-Checkbox', class: ['sdhub-checkbox', 'sdhub-gallery-info-checkbox'], children: [infoCheckboxInput, infoCheckboxText],
          onclick: () => infoCheckboxInput.click()
        });

  const ButtonRow = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Button-Row' }),
        Yes = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-Yes-Button', class: 'sdhub-gallery-info-button' }),
        No = SDHubCreateEL('span', { id: 'SDHub-Gallery-Info-No-Button', class: 'sdhub-gallery-info-button' });

  const lang = navigator.language || navigator.languages[0] || 'en';
  ButtonRow.append(...(lang.startsWith('ja') || lang.startsWith('zh') ? [No, Yes] : [Yes, No]));

  const infoCheckboxWrap = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Checkbox-Wrapper', children: [infoCheckbox, infoWarning] }),
        infoInner = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Inner', children: [infoText, infoCheckboxWrap, infoBatch, ButtonRow] }),
        infoBox = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Box', children: infoInner }),
        infoCon = SDHubCreateEL('div', { id: 'SDHub-Gallery-Info-Container', children: [infoBox, Spinner] });

  document.addEventListener('keydown', (e) => {
    const C = id => document.getElementById(id)?.style.display === 'block';
    if (!C('tab_SDHub') || !C('SDHub-Gallery-Tab')) return;

    const infoBox = document.getElementById('SDHub-Gallery-Info-Box');
    if (infoBox.style.transform === 'scale(var(--sdhub-scale))') {
      if (e.key === 'Enter') e.preventDefault(); ({ Enter: Yes, Escape: No }[e.key]?.click());
    }
  });

  return infoCon;
}

function SDHubGalleryCreateBatchBox() {
  window.SDHubGalleryAllCheckbox = (add = true, currentOnly = true) => {
    const tab = document.querySelector('.sdhub-gallery-tab-container.active');
    const pages = currentOnly
      ? [tab?.querySelector(`.${sdhgp}s.selected-page`)].filter(Boolean)
      : Array.from(tab?.querySelectorAll(`.${sdhgp}s`) || []);

    if (!pages.length) return false;

    let count = 0;

    pages.forEach(page => {
      const s = `.sdhub-gallery-img-box${add ? `:not(.${sdhgis})` : `.${sdhgis}`}`;
      const imgBox = page.querySelectorAll(s);
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
  });
  const download = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Download', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_Download,
    onclick: () => SDHubGalleryInfoPopUp('batch-download')
  });
  const delet = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Delete', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_Delete,
    onclick: () => SDHubGalleryInfoPopUp('batch-delete')
  });
  const unselectAll = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Unselect', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_MultiUnselect,
    onclick: () => window.SDHubGalleryAllCheckbox(false)
  });
  const setting = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-Batch-Setting', class: 'sdhub-gallery-batch-button', html: SDHubGallerySVG_Setting,
    onclick: () => document.getElementById(`${SDHGS}-Button`)?.click()
  });
  const box = SDHubCreateEL('div', { id: 'SDHub-Gallery-Batch-Box', children: [selectAll, download, delet, unselectAll, setting] }),
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

  const imgchestButton = SDHubCreateEL('div', {
    id: 'SDHub-Gallery-ImgChest-Button', class: 'sdhub-gallery-ex-button', html: SDHubGallerySVG_ImgChest, children: imgchestColumn
  });

  document.getElementById('SDHub-Gallery-Tab-Button-Row').prepend(imgchestButton);

  const checkboxInput = document.querySelector('#SDHub-Gallery-ImgChest-Checkbox input'),
        checkboxSpan = document.querySelector('#SDHub-Gallery-ImgChest-Checkbox span');
  checkboxSpan.textContent = SDHubGetTranslation('click_to_enable');

  const g = imgchestButton.querySelectorAll('svg g');
  const hover = () => [g[2], g[6]].forEach(g => g?.querySelectorAll('path').forEach(p => p.style.fill = 'var(--primary-500)'));
  const unhover = () => !checkboxInput.checked && [g[2], g[6]].forEach(g => g?.querySelectorAll('path').forEach(p => p.style.fill = ''));

  imgchestButton.onmouseover = hover;
  imgchestButton.onmouseleave = unhover;

  document.querySelectorAll('#SDHub-Gallery-ImgChest-Info').forEach(el => {
    if (el.textContent.includes('Auto Upload to')) {
      el.innerHTML = `${SDHubGetTranslation('auto_upload_to')}
        <a class='sdhub-gallery-imgchest-info' href='https://imgchest.com' target='_blank'>
          imgchest.com
        </a>`;
    }
  });

  ['#SDHub-Gallery-ImgChest-Privacy', '#SDHub-Gallery-ImgChest-NSFW'].forEach(id =>
    document.querySelectorAll(`${id} label > span`).forEach(s => s.textContent = SDHubGetTranslation(s.textContent.toLowerCase()))
  );

  let fromColumn = false;

  const api = document.querySelector('#SDHub-Gallery-ImgChest-API input');
  api?.setAttribute('placeholder', SDHubGetTranslation('imgchest_api_key'));
  api?.addEventListener('mousedown', () => { fromColumn = window.getComputedStyle(imgchestColumn).display === 'flex'; });

  ['Save', 'Load'].forEach(key => {
    const btn = document.getElementById(`SDHub-Gallery-ImgChest-${key}-Button`);
    if (btn) {
      btn.title = SDHubGetTranslation(`${key.toLowerCase()}_setting`);
      btn.textContent = SDHubGetTranslation(key.toLowerCase());
    }
  });

  document.addEventListener('mouseup', () => {
    if (window.getComputedStyle(imgchestColumn).display === 'flex') setTimeout(() => fromColumn = false, 0);
  });

  document.addEventListener('change', () => {
    const checked = checkboxInput.checked;
    checkboxSpan.style.color = checked ? 'var(--background-fill-primary)' : '';
    checkboxSpan.textContent = SDHubGetTranslation(checked ? 'enabled' : 'click_to_enable');
    checked ? hover() : unhover();
  });

  await fetch(`${SDHubGalleryBase}/imgChest`)
    .then(r => r.json())
    .then(d => {
      const Radio = (id, v) => document.querySelector(`${id} label[data-testid='${v}-radio-label']`)?.click();
      Radio('#SDHub-Gallery-ImgChest-Privacy', d['privacy']);
      Radio('#SDHub-Gallery-ImgChest-NSFW', d['nsfw']);
      if (api) (api.value = d['api-key'], updateInput(api));
    })
    .catch(e => console.error('Error loading imgchest settings:', e));

  document.addEventListener('click', (e) => {
    if (imgchestButton && imgchestColumn) {
      if (imgchestButton.contains(e.target) && window.getComputedStyle(imgchestColumn).display === 'none') {
        imgchestColumn.style.display = 'flex';
        requestAnimationFrame(() => {
          imgchestColumn.style.opacity = '1';
          imgchestColumn.style.transform = 'scale(var(--sdhub-scale))';
        });
      } else if (!imgchestColumn.contains(e.target) && !fromColumn) {
        imgchestColumn.style.display = '';
        imgchestColumn.style.opacity = '';
        imgchestColumn.style.transform = '';
        fromColumn = false;
      }
    }
  });
}

async function SDHubGalleryLoadInitial(retry = 1000) {
  try {
    const infoCon = document.getElementById('SDHub-Gallery-Info-Container'),
          Spinner = document.getElementById('SDHub-Gallery-Info-Spinner');

    infoCon.style.display = 'flex';
    infoCon.style.position = 'relative';
    infoCon.style.opacity = '1';
    Spinner.classList.add('sdhub-gallery-spinner');

    const res = await fetch(`${SDHubGalleryBase}/initial`);
    const data = await res.json();

    if (data.status === 'waiting') {
      setTimeout(() => SDHubGalleryLoadInitial(retry), retry);
      return;
    }

    if (!data.images?.length) {
      infoCon.style.opacity = infoCon.style.display = infoCon.style.position = '';
      Spinner.classList.remove('sdhub-gallery-spinner');
      return;
    }

    let selectedTab = false;
    const imgBox = document.getElementById('SDHub-Gallery-Image-Box-0'),
          todayRegex = /^\d{4}-\d{2}-\d{2}$/,
          tabMap = new Map();

    for (let i = data.images.length - 1; i >= 0; i--) {
      let { path } = data.images[i];
      let tabToUse = SDHubGalleryTabList.find((tab) => path.includes(`/${tab}/`)) || 'extras-images';
      if (tabToUse === 'extras-images') {
        if (path.includes('?init')) tabToUse = 'init-images';
        else if (path.includes('?save')) tabToUse = 'manual-save';
        else {
          const pathParts = path.split('/'),
                dateIndex = pathParts.findIndex((part) => todayRegex.test(part)),
                parentFolder = dateIndex > 0 ? `${pathParts[dateIndex - 1]}-${pathParts[dateIndex]}` : '';
          if (parentFolder) {
            tabToUse = parentFolder;
            const tabName = `${pathParts[dateIndex - 1]} ${pathParts[dateIndex]}`;
            if (!document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Container`)) SDHubGalleryCloneTab(tabToUse, tabName);
          }
        }
      }

      if (!tabMap.has(tabToUse)) tabMap.set(tabToUse, []);
      tabMap.get(tabToUse).unshift({ path });
    }

    const tabtab = SDHubGalleryTabList.filter(tab => tabMap.has(tab)),
          fallbackTabtab = Array.from(tabMap.keys()).filter(tab => !SDHubGalleryTabList.includes(tab)),
          allTabsInOrder = [...tabtab, ...fallbackTabtab];

    for (const [tabName, images] of tabMap.entries()) {
      const TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`),
            wrapper = TabCon.querySelector(`.${sdhgp}-wrapper`),
            TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row'),
            TabBtn = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Button`),
            Counter = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Image-Counter`);

      const imageBoxes = images.map(({ path }) => {
        const newImgBox = imgBox.cloneNode(true);
        let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
        while (document.getElementById(newId)) newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;

        newImgBox.id = newId;
        SDHubGalleryImageButtonEvents(newImgBox);

        const img = newImgBox.querySelector('img'),
              name = path.split('/').pop().split('?')[0],
              thumb = `${SDHubGalleryBase}/thumb/${name.replace(/\.[^/.]+$/, '.jpeg')}`,
              nameBox = newImgBox.querySelector('.sdhub-gallery-img-name'),
              decoded = decodeURIComponent(name);

        if (nameBox) nameBox.textContent = decoded;
        if (img) {
          img.loading = 'lazy';
          img.dataset.image = path;
          img.title = decoded;

          const loadThumb = new Image();
          loadThumb.src = thumb;
          loadThumb.onload = () => img.src = thumb;
        }

        return newImgBox;
      });

      const totalPages = SDHubGalleryCreateImagePages(wrapper, imageBoxes);

      if (TabRow && TabBtn) TabRow.style.display = TabBtn.style.display = 'flex';

      if (!selectedTab && tabName === allTabsInOrder[0]) {
        TabCon.classList.add('active');
        TabBtn.classList.add('selected');
        TabCon.style.display = Counter.style.display = 'flex';
        selectedTab = true;
      }

      SDHubGallerySwitchPage(tabName, null, totalPages - 1);
    }

    infoCon.style.opacity = infoCon.style.display = infoCon.style.position = '';
    Spinner.classList.remove('sdhub-gallery-spinner');
    SDHubGalleryTabImageCounters();
    console.log('SD-Hub Gallery Loaded');
    document.body.classList.remove(SDHubBnS);
  } catch (err) {
    console.error('Error in initial-load:', err);
  }
}