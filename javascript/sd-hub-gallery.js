let SDHubGalleryBase = '/sd-hub-gallery',

SDHubGalleryTabImageIndex = 1,
SDHubGalleryCMRightClick = false,
SDHubGalleryCMTouch = false,
SDHubGalleryNewImageSrc = new Set(),
SDHubGalleryPageLimit,
SDHubGalleryPageLocks = {},
SDHubGalleryImgSelected = 0,

sdhgis = 'sdhub-gallery-img-selected',
SDHGiI = 'SDHub-Gallery-Imageinfo',
sdhgii = 'sdhub-gallery-imageinfo',
SDHGiV = 'SDHub-Gallery-Image-Viewer',
sdhgp = 'sdhub-gallery-page',
SDHGS = 'SDHub-Gallery-Setting',
sdhgs = 'sdhub-gallery-setting',

SDHubGalleryTabList = [
  'txt2img-images',
  'txt2img-grids',
  'img2img-images',
  'img2img-grids',
  'init-images',
  'extras-images',
  'manual-save'
];

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

async function SDHubGalleryCreateImageFile(path) {
  try {
    const res = await fetch(path),
    blob = await res.blob(),
    name = path.split('/').pop().split('?')[0];
    return new File([blob], name, { type: blob.type });
  } catch (err) { console.error('Error in creating file:', err); return null; }
}

function SDHubGallerySwitchPage(tabName, direction = null, targetIndex = null) {
  if (SDHubGalleryPageLocks[tabName]) return;
  let selected = 'selected-page';

  const TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`),
  wrapper = TabCon.querySelector(`.${sdhgp}-wrapper`),
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

  const nav = TabCon.querySelector(`.${sdhgp}-nav`),
  right = nav?.querySelector(`.${sdhgp}-right-button`),
  left = nav?.querySelector(`.${sdhgp}-left-button`),
  indi = nav?.querySelector(`.${sdhgp}-indicator`);

  right && right.classList.toggle('btn-on', newIndex > 0);
  left && left.classList.toggle('btn-on', newIndex < pages.length - 1);
  indi && (indi.textContent = `${newIndex + 1} / ${pages.length}`);
}

function SDHubGallerySwitchTab(whichTab) {
  const box = document.getElementById('SDHub-Gallery-Batch-Box');
  box?.style.display === 'flex' ? SDHubGalleryInfoPopUp('switch-tab', whichTab) : SDHubGalleryTabSwitch(whichTab);
}

function SDHubGalleryTabSwitch(whichTab) {
  const Btn = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Button`),
  Tab = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`);

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
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');

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

  TabCon.addEventListener('click', e => {
    if (!e.target.closest('.sdhub-gallery-img-btn-contextmenu') &&
        (!e.target.closest('.sdhub-gallery-img-box') || !GalleryCM?.contains(e.target))) SDHubGalleryContextMenuClose();
  });

  TabCon.addEventListener('mousemove', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM.style.transform !== sdhubScale) return;
    const insideCM = GalleryCM?.matches(':hover'), insideImg = e.target.closest('.sdhub-gallery-img-box')?.matches(':hover');
    if (!insideCM && !insideImg && !SDHubGalleryCMRightClick) setTimeout(() => SDHubGalleryContextMenuClose(), 100);
  });
}

function SDHubGalleryTabImageCounters() {
  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Container']").forEach(tab => {
    const img = tab.querySelectorAll('img').length, counter = tab.querySelector('.sdhub-gallery-tab-image-counter');
    counter && (counter.textContent = img > 0 ? `${img} ${SDHubGetTranslation('item', img)}` : '');
  });
}

function SDHubGalleryImageButtonEvents(imgBox) {
  const imgCon = imgBox.querySelector('.sdhub-gallery-img-container'),
  img = imgCon.querySelector('img'),
  checkbox = imgCon.querySelector('.sdhub-gallery-img-btn-checkbox'),
  contextBtn = imgCon.querySelector('.sdhub-gallery-img-btn-contextmenu'),
  viewerBtn = imgCon.querySelector('.sdhub-gallery-img-btn-imageviewer');

  img.onclick = (e) => e.shiftKey ? checkbox?.click() : SDHubGalleryImageInfo(img);

  checkbox.onclick = () => {
    const s = imgBox.classList.contains(sdhgis), n = !s;
    checkbox.classList.toggle(sdhgis, n);
    imgBox.classList.toggle(sdhgis, n);
    SDHubGalleryImgSelected += s ? -1 : 1;
    SDHubGalleryImgSelected = Math.max(0, SDHubGalleryImgSelected);
    SDHubGalleryToggleBatchBox(SDHubGalleryImgSelected > 0 ? 'flex' : '');
    checkbox.innerHTML = n ? SDHubGallerySVG_UnselectImage : SDHubGallerySVG_SelectImage;
  };

  let hover = null;
  contextBtn.onmouseleave = () => (clearTimeout(hover), hover = null);
  contextBtn.onmouseenter = (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (!SDHubGalleryCMRightClick && GalleryCM.style.transform === sdhubScale && GalleryCM.dataset.box === imgBox.id) return;
    hover = setTimeout(() => (SDHubGalleryCMRightClick = false, GalleryCM.dataset.box = imgBox.id, SDHubGalleryContextMenu(e, img)), 300);
  };

  viewerBtn.onclick = () => SDHubGalleryOpenViewerFromButton(img);
}

function SDHubGalleryContextMenuClose() {
  SDHubGalleryCMRightClick = false;
  SDHubGalleryCMTouch = false;

  const set = (e, s) => e && Object.assign(e.style, s),
  GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
  ul = GalleryCM?.querySelector('ul'),
  submenu = document.getElementById('SDHub-Gallery-ContextMenu-SubMenu-SendTo'),
  ulsub = submenu?.querySelector('ul');

  set(GalleryCM, { transition: 'transform 150ms ease', transform: 'scale(0.9)' });
  set(ul, { transition: 'opacity 150ms ease', opacity: '0' });

  setTimeout(() => {
    set(GalleryCM, { left: '', top: '', right: '', transition: 'none', transform: '' });
    set(ul, { transition: '', opacity: '' });
    set(submenu, { left: '', top: '', right: '', transform: '' });
    set(ulsub, { transition: '', opacity: '' });
  }, 100);
}

function SDHubGalleryContextMenu(e, imgEL) {
  if (e.touches?.[0] || e.changedTouches?.[0]) {
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;
  }

  const display = () => SDHubGalleryContextMenuDisplay(e, imgEL),
  GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
  ul = GalleryCM?.querySelector('ul');

  if (GalleryCM.style.transform === sdhubScale) {
    Object.assign(ul.style, { transition: 'opacity 150ms ease', opacity: '0' });
    Object.assign(GalleryCM.style, { transition: 'transform 150ms ease', transform: 'scale(0.9)' });
    setTimeout(display, 100);
  } else {
    setTimeout(display, 100);
  }
}

function SDHubGalleryContextMenuDisplay(e, imgEL) {
  SDHubGalleryImageViewerimgList(imgEL);

  const set = (e, s) => e && Object.assign(e.style, s),
  GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
  ul = GalleryCM.querySelector('ul'),
  submenu = document.getElementById('SDHub-Gallery-ContextMenu-SubMenu-SendTo'),
  ulsub = submenu?.querySelector('ul'),

  select = document.getElementById('SDHub-Gallery-Context-Select'),
  unselect = document.getElementById('SDHub-Gallery-Context-Unselect'),
  imgBox = imgEL.parentElement.parentElement,
  selected = imgBox?.classList.contains(sdhgis);

  if (select) select.style.display = selected ? 'none' : '';
  if (unselect) unselect.style.display = selected ? '' : 'none';

  set(GalleryCM, { transition: 'none', left: '', right: '', top: '', bottom: '', transform: '' });
  set(ul, { transition: 'none', opacity: '' });
  set(submenu, { transition: 'none', transform: '' });
  set(ulsub, { transition: 'none', opacity: '' });

  let originY;

  const menuWidth = GalleryCM.offsetWidth,
  menuHeight = GalleryCM.offsetHeight,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
  cursorX = e.clientX,
  cursorY = e.clientY,
  spaceRight = viewportWidth - cursorX,
  spaceBelow = viewportHeight - cursorY,
  posX = spaceRight >= menuWidth ? cursorX : viewportWidth - menuWidth - 5,
  posY = spaceBelow >= menuHeight ? (originY = 'top', cursorY) : (originY = 'bottom', cursorY - menuHeight);

  set(GalleryCM, { left: `${posX}px`, top: `${posY}px` });

  const bounds = GalleryCM.getBoundingClientRect();

  bounds.right > viewportWidth && (GalleryCM.style.left = `${viewportWidth - menuWidth - 5}px`);
  bounds.left < 0 && (GalleryCM.style.left = '5px');
  bounds.bottom > viewportHeight && (GalleryCM.style.top = `${viewportHeight - menuHeight - 5}px`);
  bounds.top < 0 && (GalleryCM.style.top = '5px');

  GalleryCM.style.transformOrigin = `${originY} left`;

  setTimeout(() => requestAnimationFrame(() => {
    set(GalleryCM, { transition: '', transform: sdhubScale });
    set(ul, { transition: '', opacity: '1' });
    setTimeout(() => SDHubGalleryContextSubmenu(), 310);
  }), 10);
}

function SDHubGalleryContextSubmenu() {
  const set = (e, s) => e && Object.assign(e.style, s),
  GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
  subbtn = GalleryCM.querySelector('.sdhub-gallery-cm-sendto'),
  submenu = document.getElementById('SDHub-Gallery-ContextMenu-SubMenu-SendTo'),
  ul = submenu.querySelector('ul'),

  cm = GalleryCM.getBoundingClientRect(),
  btn = subbtn.getBoundingClientRect(),
  cmW = submenu.offsetWidth,
  cmH = submenu.offsetHeight,
  wW = window.innerWidth,
  wH = window.innerHeight,
  right = wW - btn.right,
  below = wH - btn.bottom;

  submenu.style.left = submenu.style.right = 'auto';
  ul.style.marginLeft = ul.style.marginRight = '0';

  let X = right >= cmW
    ? (submenu.style.left = '100%', ul.style.marginLeft = '10px', 'left')
    : (submenu.style.right = '100%', ul.style.marginRight = '10px', 'right');

  const btnTop = btn.top - cm.top, btnBottom = btn.bottom - cm.top;

  let Y = below < cmH
    ? (submenu.style.top = `${(btnBottom - cmH + 8).toFixed(2)}px`, 'bottom')
    : (submenu.style.top = `${(btnTop - 8).toFixed(2)}px`, 'top');

  submenu.style.transformOrigin = `${Y} ${X}`;

  let hover, show;
  let anim = false;

  requestAnimationFrame(() => {
    set(submenu, { transition: '' });
    set(ul, { transition: '' });
  });

  const display = (check = false) => {
    if (check && anim) return;

    clearTimeout(hover);
    clearTimeout(show);
    anim = true;

    show = setTimeout(() => {
      requestAnimationFrame(() => {
        set(submenu, { transform: sdhubScale });
        set(ul, { opacity: '1' });
        setTimeout(() => {
          anim = false;
          SDHubGalleryContextSubmenu();
        }, 310);
      });
    }, 200);
  };

  const hide = (check = false) => {
    if (check && anim) return;

    clearTimeout(show);
    anim = true;

    hover = setTimeout(() => {
      requestAnimationFrame(() => {
        set(submenu, { transform: '' });
        set(ul, { opacity: '' });
        setTimeout(() => {
          anim = false;
          SDHubGalleryContextSubmenu();
        }, 310);
      });
    }, 100);
  };

  if (SDHubGalleryCMTouch) {
    subbtn.onmouseenter = subbtn.onmouseleave = null;
    submenu.onmouseenter = submenu.onmouseleave = null;
    subbtn.onclick = () => {
      const forming = submenu.style.transform === sdhubScale;
      forming ? hide(true) : display(true);
    };
  } else {
    subbtn.onclick = null;
    requestAnimationFrame(() => {
      [subbtn, submenu].forEach(el => {
        el.onmouseenter = () => display();
        el.onmouseleave = () => hide();
      });
    });
  }
}

function SDHubGaleryContextImage(v) {
  SDHubGalleryContextMenuClose();
  const path = window.SDHubImagePath, img = document.querySelector(`img[data-image='${path}']`);
  if (v && img) img.classList.add('sdhub-gallery-img-pulse'), setTimeout(() => img.classList.remove('sdhub-gallery-img-pulse'), 600);
  return { img, path };
}

async function SDHubGalleryContextMenuButton(v) {
  const c = ['copy', 'download', 'delete'],
  { img, path } = SDHubGaleryContextImage(c.includes(v));

  switch (v) {
    case 'open':
      window.open(path, '_blank');
      break;

    case 'download': {
      const link = Object.assign(document.createElement('a'), { href: path, download: img?.title });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      break;
    }

    case 'copy': {
      const file = await SDHubGalleryCreateImageFile(path);
      if (file) await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
      break;
    }

    case 'info':
      if (img) SDHubGalleryImageInfo(img, new Event('click'));
      break;

    case 'viewer':
      SDHubGalleryImageViewer('m');
      break;

    case 'select':
    case 'unselect':
      img?.parentElement.querySelector('.sdhub-gallery-img-btn-checkbox')?.click();
      break;

    case 'delete':
      SDHubGalleryInfoPopUp('delete');
      break;
  }
}

async function SDHubGallerySendImage(v) {
  const { path } = SDHubGaleryContextImage(v);

  if (v === 'uploader') {
    const area = document.querySelector('#SDHub-Uploader-Input textarea'),
    imgPath = decodeURIComponent(path.slice(`${SDHubGalleryBase}/image=`.length));
    area.value += area.value ? `\n${imgPath}` : imgPath;
    updateInput(area);
    return;
  }

  const imginfoRow = document.getElementById(`${SDHGiI}-Row`),
  input = imginfoRow.querySelector(`#${SDHGiI}-img input`),
  infoCon = document.getElementById('SDHub-Gallery-Info-Container'),
  Spinner = document.getElementById('SDHub-Gallery-Info-Spinner');

  infoCon.style.display = 'flex';

  if (input) {
    requestAnimationFrame(() => {
      infoCon.style.opacity = '1';
      SDHubGalleryBlur('add');
      setTimeout(() => Spinner.classList.add('sdhub-gallery-spinner'), 0);
    });

    window.SDHubGalleryDisplayImageInfo = null;
    await SDHubGalleryUpdateImageInput(input, path);

    window.SDHubGallerySendImageInfo = () => {
      setTimeout(() => requestAnimationFrame(() => {
        document.querySelector(`#${SDHGiI}-SendButton > #${v}_tab`)?.click();
        infoCon.style.opacity = infoCon.style.display = '';
        Spinner.classList.remove('sdhub-gallery-spinner');
        setTimeout(() => SDHubGalleryBlur('remove'), 200);
      }), 100);
    };
  }
}

async function SDHubGalleryImageInfo(imgEL) {
  const imginfoRow = document.getElementById(`${SDHGiI}-Row`),
  input = imginfoRow.querySelector(`#${SDHGiI}-img input`),
  infoCon = document.getElementById('SDHub-Gallery-Info-Container'),
  Spinner = document.getElementById('SDHub-Gallery-Info-Spinner');

  infoCon.style.display = imginfoRow.style.display = 'flex';

  if (input) {
    requestAnimationFrame(() => {
      infoCon.style.opacity = '1';
      SDHubGalleryBlur('add');
      setTimeout(() => Spinner.classList.add('sdhub-gallery-spinner'), 0);
    });

    window.SDHubGallerySendImageInfo = null;
    window.SDHubImagePath = imgEL.getAttribute('data-image');
    await SDHubGalleryUpdateImageInput(input, window.SDHubImagePath);

    window.SDHubGalleryDisplayImageInfo = () => {
      setTimeout(() => {
        imginfoRow.style.opacity = '1';
        infoCon.style.display = infoCon.style.opacity = '';
        Spinner.classList.remove('sdhub-gallery-spinner');
        setTimeout(() => SDHubGalleryBlur('remove'), 100);
        setTimeout(() => window.SDHubGalleryImageInfoArrowUpdate(), 0);
      }, 100);
    };
  }
}

async function SDHubGalleryDeleteImage() {
  const imgEL = document.querySelector(`img[data-image='${window.SDHubImagePath}']`),
  imgBox = imgEL?.closest('.sdhub-gallery-img-box'),
  path = decodeURIComponent(window.SDHubImagePath).slice(`${SDHubGalleryBase}/image=`.length),
  thumb = decodeURIComponent(imgEL?.src.split('/').pop()),
  perma = window.SDHubGallerySettings?.['single-delete-permanent'] ?? false;

  try {
    const res = await fetch(`${SDHubGalleryBase}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: path, thumb: thumb, ...(perma && { permanent: true }) }),
    });

    if (!res.ok) throw new Error(await res.text());

    const r = await res.json();
    if (r.status === 'deleted') {
      if (imgBox?.classList.contains(sdhgis)) {
        imgBox.classList.remove(sdhgis);
        imgBox.querySelector('.sdhub-gallery-img-btn-checkbox')?.classList.remove(sdhgis);
        SDHubGalleryImgSelected = Math.max(0, SDHubGalleryImgSelected - 1);
        SDHubGalleryToggleBatchBox(SDHubGalleryImgSelected > 0 ? 'flex' : '');
      }

      imgBox?.remove();
    } else {
      console.error('Deletion failed:', r);
    }

  } catch (err) {
    console.error('Error deleting image:', err);
  } finally {
    SDHubGalleryCloseInfoPopup();
  }
}

async function SDHubGalleryBatchDelete() {
  const TabCon = document.querySelector('.sdhub-gallery-tab-container.active'),
  imgBox = Array.from(TabCon.querySelectorAll(`.sdhub-gallery-img-box.${sdhgis}`)),
  perm = window.SDHubGallerySettings?.['batch-delete-permanent'] ?? false,

  img = imgBox.map(b => {
    const i = b.querySelector('.sdhub-gallery-img'), p = i.dataset.image, t = i.getAttribute('src');
    return {
      path: decodeURIComponent(p.replace(`${SDHubGalleryBase}/image=`, '')),
      thumb: decodeURIComponent(t.replace(`${SDHubGalleryBase}/thumb=`, '')),
      ...(perm && { permanent: true })
    };
  }).filter(Boolean);

  if (img.length === 0) return;

  try {
    const res = await fetch(`${SDHubGalleryBase}/batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(img),
    });

    if (!res.ok) return console.error('Failed to delete images:', res.statusText);

    const r = await res.json();
    r.status === 'deleted'
      ? (window.SDHubGalleryAllCheckbox(false, false), imgBox.forEach(b => b.remove()))
      : console.error('Deletion failed:', r);

  } catch (err) {
    console.error('Error deleting images:', err);
  } finally {
    SDHubGalleryCloseInfoPopup();
  }
}

async function SDHubGalleryBatchDownload(onchange = false) {
  if (onchange) {
    const path = document.querySelector('#SDHub-Gallery-Batch-Path textarea');
    if (!path?.value) return;

    const waiting = setInterval(() => {
      const link = document.querySelector('#SDHub-Gallery-Batch-File a[download]');
      if (link) {
        link.onclick = () => requestAnimationFrame(() => {
          SDHubGalleryCloseInfoPopup('dl');
          path.value = '';
          updateInput(path);
          document.getElementById('SDHub-Gallery-Batch-Button')?.click();
          clearInterval(waiting);
        });

        setTimeout(() => link.click(), 100);
      }
    }, 1000);
  } else {
    const path = document.querySelector('#SDHub-Gallery-Batch-Path textarea'),
    name = document.getElementById('SDHub-Gallery-Info-Batch-Input')?.value?.trim() || 'sdhub-gallery',
    TabCon = document.querySelector('.sdhub-gallery-tab-container.active'),
    imgBox = Array.from(TabCon.querySelectorAll(`.sdhub-gallery-img-box.${sdhgis}`)),

    images = imgBox.map(b => {
      const i = b.querySelector('.sdhub-gallery-img'), p = i?.dataset?.image;
      return p ? { path: decodeURIComponent(p.replace(`${SDHubGalleryBase}/image=`, '')) } : null;
    }).filter(Boolean);

    if (images.length === 0) return;

    path.value = JSON.stringify({ name, images });
    updateInput(path);
  }
}

function SDHubGalleryToggleBatchBox(v = '') {
  const box = document.getElementById('SDHub-Gallery-Batch-Box');
  v === 'flex'
    ? (box.style.display = 'flex', requestAnimationFrame(() => box.classList.add('sdhub-gallery-batchbox-display')))
    : (box.classList.remove('sdhub-gallery-batchbox-display'), setTimeout(() => box.style.display = '', 200));
}

function SDHubGalleryInfoPopUp(f, whichTab = null) {
  const bc = 'sdhub-gallery-batch-download',

  q = id => document.getElementById(`SDHub-Gallery-Info-${id}`),
  infoCon = q('Container'),
  infoBox = q('Box'),
  infoText = q('Text'),
  infoBatch = q('Batch'),
  infoBatchText = q('Batch-Text'),
  checkboxWrap = q('Checkbox-Wrapper'),
  infoCheckbox = q('Checkbox'),
  infoCheckboxText = q('Checkbox-Text'),
  infoCheckboxInput = q('Checkbox-Input'),
  infoWarning = q('Warning'),
  infoWarningText = q('Warning-Text'),
  infoWarningInput = q('Warning-Input'),
  Spinner = q('Spinner'),
  Yes = q('Yes-Button'),
  No = q('No-Button'),

  displayCon = () => {
    infoCon.style.display = 'flex';
    SDHubGalleryBlur('add');
  },

  spin = () => {
    requestAnimationFrame(() => {
      setTimeout(() => Spinner.classList.add('sdhub-gallery-spinner'), 0);
      infoBox.style.pointerEvents = infoBox.style.opacity = '';
      infoBox.style.transform = 'scale(1.5)';
    });
  },

  text = (t, k) => {
    infoText.style.display = '';
    checkboxWrap.style.display = infoCheckbox.style.display = 'flex';
    infoCheckboxText.textContent = SDHubGetTranslation(t);
    infoCheckboxInput.checked = !!(window.SDHubGallerySettings?.[k]);
  },

  warn = (t, k) => {
    infoText.style.display = '';
    checkboxWrap.style.display = infoWarning.style.display = 'flex';
    infoWarningText.textContent = SDHubGetTranslation(t);
    infoWarningInput.checked = !!(window.SDHubGallerySettings?.[k]);
  },

  buttons = () => {
    Yes.textContent = SDHubGetTranslation('yes');
    No.textContent = SDHubGetTranslation('no');
    Yes.style.minWidth = No.style.minWidth = '';
    [Yes, No].forEach(b => b.classList.remove(bc));
  },

  bd = () => {
    infoText.style.display = 'none';
    infoBatch.style.display = 'flex';
    infoBatchText.textContent = SDHubGetTranslation('file_name');
    Yes.textContent = SDHubGetTranslation('download');
    No.textContent = SDHubGetTranslation('cancel');
    Yes.style.minWidth = No.style.minWidth = '130px';
    [Yes, No].forEach(b => b.classList.add(bc));
  },

  displayBox = () => {
    requestAnimationFrame(() => {
      infoCon.style.opacity = infoBox.style.opacity = '1';
      infoBox.style.pointerEvents = 'auto';
      infoBox.style.transform = sdhubScale;
    });
  },

  checking = async ({ keys, skipWarning, func, delay = 1000, spin }) => {
    spin && spin();

    if (!skipWarning) {
      keys.forEach(k => {
        window.SDHubGallerySettings[k] = (k.includes('suppress'))
          ? infoWarningInput.checked
          : infoCheckboxInput.checked;
      });

      try {
        const res = await fetch(`${SDHubGalleryBase}/save-setting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(window.SDHubGallerySettings)
        });
        if (!res.ok) throw new Error('Failed to save setting');
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(func, delay);
  },

  warning = (k) => (window.SDHubGallerySettings || {})[k] ?? false,

  switchTab = () => {
    window.SDHubGalleryAllCheckbox(false, false);
    SDHubGalleryTabSwitch(whichTab);
    setTimeout(() => SDHubGalleryBlur('baygon'), 100);
  };

  No.onclick = () => {
    infoBox.style.opacity = infoBox.style.pointerEvents = infoCon.style.opacity = '';
    infoBox.style.transform = 'scale(1.5)';
    SDHubGalleryBlur('baygon');
    setTimeout(() => (
      infoCon.style.display = infoBox.style.transform = infoText.style.display = checkboxWrap.style.display = 
      infoBatch.style.display = infoCheckbox.style.display = infoWarning.style.display = '',
      infoCheckboxInput.checked = infoWarningInput.checked = false
    ), 200);
    No.onclick = null;
  };

  switch (f) {
    case 'delete': {
      const k = 'single-delete-permanent', sk = 'single-delete-suppress-warning';

      displayCon();
      infoCon.style.opacity = '1';
      const name = decodeURIComponent(window.SDHubImagePath.split('/').pop()),
      skip = warning(sk),
      cfg = { keys: [k, sk], func: SDHubGalleryDeleteImage, spin };

      if (skip) {
        checking({ ...cfg, skipWarning: true });
      } else {
        infoText.textContent = `${SDHubGetTranslation('delete')} ${name}?`;
        text('delete_permanent', k);
        warn('suppress_warning', sk);
        buttons();
        displayBox();

        Yes.onclick = () => checking({ ...cfg, skipWarning: false });
      }
      break;
    }

    case 'batch-delete': {
      const k = 'batch-delete-permanent', sk = 'batch-delete-suppress-warning';

      displayCon();
      infoCon.style.opacity = '1';
      const skip = warning(sk), cfg = { keys: [k, sk], func: SDHubGalleryBatchDelete, spin };

      if (skip) {
        checking({ ...cfg, skipWarning: true });
      } else {
        infoText.innerHTML = SDHubGetTranslation('batchbox_ask_deleting', SDHubGalleryImgSelected);
        text('delete_permanent', k);
        warn('suppress_warning', sk);
        buttons();
        displayBox();

        Yes.onclick = () => checking({ ...cfg, skipWarning: false });
      }
      break;
    }

    case 'batch-download':
      displayCon();
      bd();

      displayBox();
      Yes.onclick = () => (spin(), SDHubGalleryBatchDownload());
      break;

    case 'switch-tab': {
      const sk = 'switch-tab-suppress-warning', skip = warning(sk);

      if (skip) {
        switchTab();
      } else {
        displayCon();
        infoText.innerHTML = SDHubGetTranslation('batchbox_ask_switching', SDHubGalleryImgSelected);
        warn('suppress_warning', sk);
        buttons();
        displayBox();

        Yes.onclick = () => {
          Yes.onclick = null;
          checking({ keys: [sk], skipWarning: false, func: switchTab, delay: 0 });

          requestAnimationFrame(() => {
            infoBox.style.pointerEvents = infoBox.style.opacity = infoCon.style.opacity = '';
            infoBox.style.transform = 'scale(1.5)';
          });

          setTimeout(() => {
            infoCon.style.display = infoBox.style.transform =
            checkboxWrap.style.display = infoCheckbox.style.display = '';
          }, 200);
        };
      }
      break;
    }
  }
}

function SDHubGalleryCloseInfoPopup(f = false) {
  if (f !== 'dl') {
    SDHubGalleryTabImageCounters();
    SDHubGalleryRePages();
  }

  const q = id => document.getElementById(`SDHub-Gallery-Info-${id}`),
  infoCon = q('Container'),
  infoBox = q('Box'),
  infoBatch = q('Batch'),
  checkboxWrap = q('Checkbox-Wrapper'),
  infoCheckbox = q('Checkbox'),
  infoWarning = q('Warning'),
  Spinner = q('Spinner');

  setTimeout(() => (infoCon.style.opacity = '', SDHubGalleryBlur('baygon')), 1000);
  setTimeout(() => {
    infoCon.style.display = infoBox.style.transform = checkboxWrap.style.display = '';
    infoBatch.style.display = infoCheckbox.style.display = infoWarning.style.display = '';
    Spinner.classList.remove('sdhub-gallery-spinner');
  }, 1100);
}

function SDHubGalleryBlur(f) {
  const layer = document.getElementById('SDHub-Gallery-Tab-Layer'),
  id = 'SDHub-Gallery-Blur',
  e = document.getElementById(id),
  css = `
    #SDHub-Gallery-Tab-Layer {
      opacity: 1;
    }

    #SDHub-Tab .sdhub-sticky-container *,
    #${SDHGiI}-Row * {
      pointer-events: none !important;
    }

    #SDHub-Gallery-Batch-Box, #SDHub-Gallery-Page-Arrow-Wrapper {
      opacity: .8;
    }

    #SDHub-Tab .sdhub-gallery-blur-layer {
      transform: scale(1);
      opacity: 1;
    }
  `;

  f === 'add'
    ? (!e && (
        layer.style.display = 'flex',
        requestAnimationFrame(() => {
          document.body.appendChild(Object.assign(document.createElement('style'), { id, textContent: css }));
          document.body.classList.add(SDHubBnS);
        })
      ))
    : (e?.remove(), f === 'baygon' && document.body.classList.remove(SDHubBnS), setTimeout(() => layer.style.display = '', 300));
}

async function SDHubGalleryImgChestUpload(paths, names) {
  if (!document.querySelector('#SDHub-Gallery-ImgChest-Checkbox input')?.checked) return;

  const api = document.querySelector('#SDHub-Gallery-ImgChest-API input')?.value.trim(); if (!api) return;
  const whichone = (id) => document.querySelector(`${id} > div > label.selected`)?.getAttribute('data-testid')?.replace('-radio-label', '').toLowerCase() || '';
  const [privacy, nsfw] = ['#SDHub-Gallery-ImgChest-Privacy', '#SDHub-Gallery-ImgChest-NSFW'].map(whichone);

  const sorted = paths.map((path, i) => ({ path, name: names[i] })).sort((a, b) => b.name.includes('grid-') - a.name.includes('grid-')),
  files = await Promise.all(sorted.map(({ path }) => SDHubGalleryCreateImageFile(path))),
  data = new FormData();

  files.forEach(file => file && data.append('images[]', file));
  data.append('title', sorted.length > 1 && sorted.some(item => item.name.includes('grid-')) ? sorted[1].name : sorted[0].name);
  data.append('privacy', privacy || 'hidden');
  data.append('nsfw', nsfw || 'true');

  try {
    const r = await fetch('https://api.imgchest.com/v1/post', {
      method: 'POST', headers: { Authorization: `Bearer ${api}` }, body: data,
    }).then(res => res.json());

    console.log('Uploaded:', r);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

function SDHubCreateGallery() {
  const GalleryTab = document.getElementById('SDHub-Gallery-Tab'),
  SDHubGallery = document.getElementById('SDHubGallery');

  if (GalleryTab && SDHubGallery) {
    SDHubGallery.style.display = '';
    const Setting = SDHubGallery.querySelector(`#${SDHGS}`),

    infoCon = SDHubGallery.querySelector('#SDHub-Gallery-Info-Container'),
    GalleryWrap = SDHubGallery.querySelector('#SDHub-Gallery-Wrapper'),
    imgBox = SDHubGallery.querySelector('#SDHub-Gallery-Image-Box-0');
    GalleryTab.prepend(Setting, infoCon, GalleryWrap, imgBox);

    const SettingWrapper = Setting.querySelector(`#${SDHGS}-Wrapper`),
    repo = document.querySelector('#SDHub-Repo > a');
    SettingWrapper && repo && SettingWrapper.append(repo.cloneNode(true));

    const sendButton = document.getElementById(`${SDHGiI}-SendButton`);
    sendButton?.querySelectorAll('button').forEach(btn => btn.onclick = () => SDHubGallerySendButton(btn.id));

    const imginfoRow = document.getElementById(`${SDHGiI}-Row`);
    imginfoRow.append(SDHubGallery.querySelector('#SDHub-Gallery-Imageinfo-Arrow-Button'));
    imginfoRow.addEventListener('scroll', window.SDHubGalleryImageInfoArrowUpdate);

    const imgCon = document.querySelector(`#${SDHGiI}-img > .image-container`),
    imgFrame = SDHubCreateEL('div', { id: `${SDHGiI}-img-frame` }),
    clearButton = SDHubCreateEL('div', { id: `${SDHGiI}-Clear-Button`, html: SDHubGallerySVG_Cross });

    window.SDHubGalleryCloseImageInfo = () => {
      const btn = document.querySelector(`.gradio-container-4-40-0 #${SDHGiI}-img > div > div > button`) ||
                  document.querySelector(`#${SDHGiI}-img > div > div > div > button:nth-child(2)`);

      imginfoRow.style.opacity = '';
      document.body.classList.remove(SDHubBnS);
      window.SDHubGalleryDisplayImageInfo = null;
      window.SDHubGallerySendImageInfo = null;
      setTimeout(() => (btn?.click(), (imginfoRow.style.display = ''), window.SDHubGalleryImageInfoRaw = ''), 300);
    };

    clearButton.onclick = () => window.SDHubGalleryCloseImageInfo();
    imgCon.append(clearButton, imgFrame);

    const Panel = document.getElementById(`${SDHGiI}-Output-Panel`),
    imgArea  = SDHubCreateEL('div', { id: `${SDHGiI}-img-area`, onclick: () => document.querySelector(`#${SDHGiI}-img img`)?.click() });

    Panel.prepend(imgArea);
    Panel.addEventListener('scroll', window.SDHubGalleryImageInfoArrowUpdate);

    ['drop', 'dragover'].forEach(t => document.addEventListener(t, e => {
      const E = e.target.id === imgArea.id || e.target.classList?.contains(`${sdhgii}-output-content`);
      E && (e.preventDefault(), e.stopPropagation());
    }));

    const HTMLPanel = document.getElementById(`${SDHGiI}-HTML`);
    HTMLPanel.classList.add('prose');

    SDHubGalleryCreateimgChest();
    SDHubGalleryLoadSettings();
    onAfterUiUpdate(SDHubGalleryWatchNewImage);
    window.addEventListener('blur', SDHubGalleryContextMenuClose);
  }
}

async function SDHubGalleryWatchNewImage() {
  try {
    const { images } = await fetch(`${SDHubGalleryBase}/new-image`).then(r => r.json());
    if (!images?.length) return;

    const gallery = new Map();

    for (const imgPath of images) {
      if (SDHubGalleryNewImageSrc.has(imgPath)) continue;
      SDHubGalleryNewImageSrc.add(imgPath);
      const tab = SDHubGalleryTabList.find(t => imgPath.includes(`/${t}/`)),
      whichGallery =
        tab.startsWith('txt2img') ? 'txt2img_gallery' :
        tab.startsWith('img2img') ? 'img2img_gallery' :
        tab.startsWith('extras')  ? 'extras_gallery' :
        '';

      if (!whichGallery) continue;
      if (!gallery.has(whichGallery)) gallery.set(whichGallery, []);
      gallery.get(whichGallery).push(imgPath);
    }

    for (const [whichGallery, paths] of gallery) await SDHubGalleryGetNewImage(whichGallery, paths);
    await fetch(`${SDHubGalleryBase}/loaded`, { method: 'POST' });

  } catch (err) {
    console.error("Error fetching new images:", err);
  }
}

async function SDHubGalleryGetNewImage(whichGallery, imgPathsToAdd = []) {
  let imgBox = document.getElementById('SDHub-Gallery-Image-Box-0'),
  imgNames = [],
  imgPaths = [],
  loaded = 0,
  selectedTab = false;

  const tabMap = new Map();

  for (let imgSrc of imgPathsToAdd) {
    const grid = imgSrc.includes('grid-'),
    prefix = whichGallery.split('_')[0],
    whichTab =
      whichGallery === 'extras_gallery'
        ? 'extras-images'
        : grid
        ? `${prefix}-grids`
        : `${prefix}-images`;

    const newImgBox = imgBox.cloneNode(true);
    let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
    while (document.getElementById(newId)) newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
    newImgBox.id = newId;
    SDHubGalleryImageButtonEvents(newImgBox);

    if (!tabMap.has(whichTab)) tabMap.set(whichTab, []);
    tabMap.get(whichTab).push({ newImgBox, imgSrc });
  }

  const tabs = SDHubGalleryTabList,
  tabSorted = [...tabMap.keys()].sort((a, b) => {
    const ai = tabs.indexOf(a), bi = tabs.indexOf(b);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });

  for (const tabName of tabSorted) {
    const images = tabMap.get(tabName),
    TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row'),
    TabBtn = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Button`),
    TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`),
    wrapper = TabCon.querySelector(`.${sdhgp}-wrapper`),
    imageBoxes = [];

    for (const { newImgBox, imgSrc } of images) {
      const img = newImgBox.querySelector('img'),
      path = `${SDHubGalleryBase}/image=${imgSrc}`,
      name = path.split('/').pop().split('?')[0],
      nameBox = newImgBox.querySelector('.sdhub-gallery-img-name'),
      named = decodeURIComponent(name);

      if (nameBox) nameBox.textContent = named;

      if (img) {
        img.loading = 'lazy';
        img.dataset.image = path;
        img.title = named;

        const thumb = await SDHubGalleryGetNewThumbnail(imgSrc),
        loadThumb = new Image();
        loadThumb.src = thumb;
        loadThumb.onload = () => {
          img.src = thumb;
          if (++loaded === images.length) SDHubGalleryTabImageCounters();
        };
      }

      imgNames.push(name);
      imgPaths.push(path);
      imageBoxes.push(newImgBox);
    }

    const totalPages = SDHubGalleryCreateImagePages(wrapper, imageBoxes);

    TabRow.classList.add(sdhubDisplay);
    TabBtn.style.display = 'flex';

    if (!selectedTab && !document.querySelector('.sdhub-gallery-tab-container.active')) {
      TabCon.classList.add('active');
      TabBtn.classList.add('selected');
      TabCon.style.display = 'flex';
      selectedTab = true;
    }

    SDHubGallerySwitchPage(tabName, null, totalPages - 1);
  }

  if (imgNames.length) SDHubGalleryImgChestUpload(imgPaths, imgNames);
  SDHubGalleryTabImageCounters();
}

async function SDHubGalleryGetNewThumbnail(src) {
  try {
    const res = await fetch(`${SDHubGalleryBase}/new-thumb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: src })
    });

    if (!res.ok) {
      console.error('Thumbnail failed:', res.statusText);
      return null;
    }

    const r = await res.json();
    console.log(r.status);
    return r.status || null;
  } catch (err) {
    console.error('Thumbnail error:', err);
    return null;
  }
}