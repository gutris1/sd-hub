let SDHubGalleryBase = '/sd-hub-gallery',
    SDHubGalleryTabImageIndex = 1,
    SDHubGalleryCMRightClick = false,
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
    sdhgs = 'sdhub-gallery-setting';

const SDHubGalleryTabList = [
  'txt2img-images',
  'txt2img-grids',
  'img2img-images',
  'img2img-grids',
  'init-images',
  'extras-images',
  'manual-save'
];

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

  const currentPage = pages[pageIndex],
        newPage = pages[newIndex];
  SDHubGalleryPageLocks[tabName] = true;

  requestAnimationFrame(() => {
    currentPage.style.opacity = '';
    currentPage.classList.remove(selected);
    newPage.classList.add(selected);

    requestAnimationFrame(() => {
      newPage.style.opacity = '1';
      SDHubGalleryPageLocks[tabName] = false;
      setTimeout(() => window.SDHubGalleryPageArrowUpdate(), 0);
    });
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
  const Btn = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Button`);
  if (Btn?.classList.contains('selected')) return;

  const Tab = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`),
        counter = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Image-Counter`);

  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Container']").forEach(tab => {
    tab.style.display = '';
    tab.classList.remove('active');
    const count = document.getElementById(tab.id.replace('-Tab-Container', '-Tab-Image-Counter'));
    if (count) count.style.display = '';
  });

  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Button']").forEach(btn => btn.classList.remove('selected'));

  if (Tab) (Tab.style.display = 'flex', Tab.classList.add('active'), counter && (counter.style.display = 'flex'));
  if (Btn) Btn.classList.add('selected');

  const page = Tab?.querySelector(`.${sdhgp}s.selected-page`);
  if (page) {
    page.style.transition = 'none', page.style.opacity = '';
    requestAnimationFrame(() => (page.style.transition = '', page.style.opacity = '1'));
  }

  setTimeout(() => window.SDHubGalleryPageArrowUpdate(), 0);
}

function SDHubGalleryTabEvents(TabCon) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');

  TabCon.ondrag = TabCon.ondragend = TabCon.ondragstart = (e) => (e.stopPropagation(), e.preventDefault());

  TabCon.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const imgEL = e.target.closest('img');
    if (!imgEL || !TabCon.contains(imgEL)) return SDHubGalleryKillContextMenu();
    e.preventDefault(), SDHubGalleryCMRightClick = true, SDHubGalleryContextMenu(e, imgEL);
  });

  TabCon.addEventListener('click', e => {
    if (!e.target.closest('.sdhub-gallery-img-btn-contextmenu') &&
        (!e.target.closest('.sdhub-gallery-img-box') || !GalleryCM?.contains(e.target))) SDHubGalleryKillContextMenu();
  });

  TabCon.addEventListener('mousemove', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM.style.transform !== 'scale(var(--sdhub-scale))') return;
    const insideCM = GalleryCM?.matches(':hover'),
          insideImg = e.target.closest('.sdhub-gallery-img-box')?.matches(':hover');
    if (!insideCM && !insideImg && !SDHubGalleryCMRightClick) setTimeout(() => SDHubGalleryKillContextMenu(), 100);
  });
}

function SDHubGalleryTabImageCounters() {
  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Container']").forEach(tab => {
    const img = tab.querySelectorAll('img').length,
          counter = document.getElementById(tab.id.replace('-Tab-Container', '-Tab-Image-Counter'));
    counter && (counter.textContent = img > 0 ? `${img} ${SDHubGetTranslation('item', img)}` : '');
  });
}

function SDHubGalleryImageButtonEvents(imgBox) {
  const img = imgBox.querySelector('img'),
        checkbox = imgBox.querySelector('.sdhub-gallery-img-btn-checkbox'),
        contextBtn = imgBox.querySelector('.sdhub-gallery-img-btn-contextmenu'),
        viewerBtn = imgBox.querySelector('.sdhub-gallery-img-btn-imageviewer');

  let hover = null;

  img.onclick = e => e.shiftKey ? checkbox?.click() : SDHubGalleryImageInfo(img);

  checkbox.onclick = () => {
    const s = imgBox.classList.contains(sdhgis),
          n = !s;

    checkbox.classList.toggle(sdhgis, n);
    imgBox.classList.toggle(sdhgis, n);

    SDHubGalleryImgSelected += s ? -1 : 1;
    SDHubGalleryImgSelected = Math.max(0, SDHubGalleryImgSelected);
    SDHubGalleryBatchBoxToggle(SDHubGalleryImgSelected > 0 ? 'flex' : '');
    checkbox.innerHTML = n ? SDHubGallerySVG_UnselectImage : SDHubGallerySVG_SelectImage;
  };

  contextBtn.onmouseleave = () => (clearTimeout(hover), hover = null);
  contextBtn.onmouseenter = (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (!SDHubGalleryCMRightClick && GalleryCM.style.transform === 'scale(var(--sdhub-scale))' && GalleryCM.dataset.box === imgBox.id) return;
    hover = setTimeout(() => (SDHubGalleryCMRightClick = false, GalleryCM.dataset.box = imgBox.id, SDHubGalleryContextMenu(e, img)), 300);
  };

  viewerBtn.onclick = () => SDHubGalleryOpenViewerFromButton(img);
}

function SDHubGalleryCloneTab(id, name) {
  const TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row'),
        TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper'),
        TabCounter = document.getElementById('SDHub-Gallery-Tab-Counter-Container');

  let exTabBtn = document.querySelector('.sdhub-gallery-tab-button:not(.selected)'),
      TabBtn = exTabBtn.cloneNode(true);
  TabBtn.id = `SDHub-Gallery-${id}-Tab-Button`;
  TabBtn.textContent = name;
  TabBtn.style.display = 'flex';
  TabBtn.addEventListener('click', () => SDHubGallerySwitchTab(id));
  TabRow.append(TabBtn);

  let exTabCon = document.querySelector('.sdhub-gallery-tab-container:not(.active)'),
      TabCon = exTabCon.cloneNode(false);
  TabCon.id = `SDHub-Gallery-${id}-Tab-Container`;
  TabCon.style.display = '';
  TabCon.addEventListener('scroll', window.SDHubGalleryPageArrowUpdate);
  TabWrap.append(TabCon);

  let exCounter = document.querySelector('.sdhub-gallery-tab-image-counter'),
      counter = exCounter.cloneNode(true);
  counter.id = `SDHub-Gallery-${id}-Tab-Image-Counter`;
  counter.style.display = '';
  TabCounter.append(counter);

  SDHubGalleryTabEvents(TabCon);
  if (!SDHubGalleryTabList.includes(id)) SDHubGalleryTabList.push(id);
}

function SDHubGalleryBatchBoxToggle(v = '') {
  const setBtn = document.getElementById(`${SDHGS}-Button`),
        box = document.getElementById('SDHub-Gallery-Batch-Box');

  v === 'flex'
    ? (box.style.display = 'flex', setBtn.classList.add(`${sdhgs}-disable`),
        requestAnimationFrame(() => box.classList.add('sdhub-gallery-batchbox-display')))
    : (box.classList.remove('sdhub-gallery-batchbox-display'), setBtn.classList.remove(`${sdhgs}-disable`),
        setTimeout(() => box.style.display = '', 200));
}

function SDHubGalleryKillContextMenu() {
  SDHubGalleryCMRightClick = false;

  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
        ul = GalleryCM?.querySelector('ul'),
        submenu = document.getElementById('SDHub-Gallery-ContextMenu-SubMenu-SendTo'),
        ulsub = submenu?.querySelector('ul');

  Object.assign(ul.style, { transition: 'opacity 150ms ease', opacity: '0' });
  Object.assign(ulsub.style, { transition: 'opacity 150ms ease', opacity: '0' });
  Object.assign(GalleryCM.style, { transition: 'transform 150ms ease', transform: 'scale(0.9)' });
  Object.assign(submenu.style, { transition: 'transform 150ms ease', transform: 'scale(0.9)' });

  setTimeout(() => requestAnimationFrame(() => {
    Object.assign(ul.style, { transition: '', opacity: '' });
    Object.assign(ulsub.style, { transition: '', opacity: '' });
    Object.assign(GalleryCM.style, { left: '', top: '', right: '', transition: 'none', transform: '' });
    Object.assign(submenu.style, { left: '', top: '', right: '', transform: '' });
  }, 100));
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
        ul = GalleryCM?.querySelector('ul');

  const display = () => SDHubGalleryContextMenuDisplay(e, imgEL);

  if (GalleryCM.style.transform === 'scale(var(--sdhub-scale))') {
    Object.assign(ul.style, { transition: 'opacity 150ms ease', opacity: '0' });
    Object.assign(GalleryCM.style, { transition: 'transform 150ms ease', transform: 'scale(0.9)' });
    setTimeout(display, 100);
  } else {
    display();
  }
}

function SDHubGalleryContextMenuDisplay(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
        ul = GalleryCM.querySelector('ul'),
        page = imgEL.closest(`.${sdhgp}s.selected-page`);

  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageList = [...page.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);

  const select = document.getElementById('SDHub-Gallery-Context-Select'),
        unselect = document.getElementById('SDHub-Gallery-Context-Unselect'),
        imgBox = imgEL.parentElement.parentElement,
        selected = imgBox?.classList.contains(sdhgis);

  if (select) select.style.display = selected ? 'none' : '';
  if (unselect) unselect.style.display = selected ? '' : 'none';

  Object.assign(GalleryCM.style, { transition: 'none', left: '', right: '', top: '', bottom: '', transform: '' });
  Object.assign(ul.style, { transition: 'none', opacity: '' });

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

  Object.assign(GalleryCM.style, { left: `${posX}px`, top: `${posY}px` });

  const bounds = GalleryCM.getBoundingClientRect();

  bounds.right > viewportWidth && (GalleryCM.style.left = `${viewportWidth - menuWidth - 5}px`);
  bounds.left < 0 && (GalleryCM.style.left = '5px');
  bounds.bottom > viewportHeight && (GalleryCM.style.top = `${viewportHeight - menuHeight - 5}px`);
  bounds.top < 0 && (GalleryCM.style.top = '5px');

  GalleryCM.style.transformOrigin = `${originY} left`;

  requestAnimationFrame(() => setTimeout(() => {
    Object.assign(GalleryCM.style, { transition: '', transform: 'scale(var(--sdhub-scale))' });
    Object.assign(ul.style, { transition: '', opacity: '1' });
    setTimeout(() => SDHubGalleryContextSubmenu(), 310);
  }, 10));
}

function SDHubGalleryContextSubmenu() {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
        subbtn = GalleryCM.querySelector('.sdhub-gallery-cm-sendto'),
        submenu = document.getElementById('SDHub-Gallery-ContextMenu-SubMenu-SendTo'),
        ul = submenu.querySelector('ul');

  submenu.style.transition = ul.style.transition = '';

  const cm = GalleryCM.getBoundingClientRect(),
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

  const btnTop = btn.top - cm.top,
        btnBottom = btn.bottom - cm.top;

  let Y = below < cmH
    ? (submenu.style.top = `${(btnBottom - cmH + 8).toFixed(2)}px`, 'bottom')
    : (submenu.style.top = `${(btnTop - 8).toFixed(2)}px`, 'top');

  submenu.style.transformOrigin = `${Y} ${X}`;

  let hover, show;

  const display = () => {
    clearTimeout(hover);
    clearTimeout(show);
    show = setTimeout(() => {
      requestAnimationFrame(() => {
        Object.assign(submenu.style, { transform: 'scale(var(--sdhub-scale))' });
        Object.assign(ul.style, { opacity: '1' });
        setTimeout(() => SDHubGalleryContextSubmenu(), 310);
      });
    }, 200);
  };

  const hide = () => {
    clearTimeout(show);
    hover = setTimeout(() => {
      requestAnimationFrame(() => {
        Object.assign(submenu.style, { transform: '' });
        Object.assign(ul.style, { opacity: '' });
        setTimeout(() => SDHubGalleryContextSubmenu(), 310);
      });
    }, 100);
  };

  requestAnimationFrame(() => [subbtn, submenu].forEach(el => (el.onmouseenter = display, el.onmouseleave = hide)));
}

function SDHubGaleryContextImage(v) {
  SDHubGalleryKillContextMenu();
  const path = window.SDHubImagePath, img = document.querySelector(`img[data-image='${path}']`);
  if (v && img) img.classList.add('sdhub-gallery-img-pulse'), setTimeout(() => img.classList.remove('sdhub-gallery-img-pulse'), 600);
  return { img, path };
}

async function SDHubGalleryContextMenuButton(v) {
  const c = ['copy', 'download', 'delete'];
  const { img, path } = SDHubGaleryContextImage(c.includes(v));

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

  const input = document.querySelector(`#${SDHGiI}-img input`),
        infoCon = document.getElementById('SDHub-Gallery-Info-Container'),
        Spinner = document.getElementById('SDHub-Gallery-Info-Spinner');

  infoCon.style.display = 'flex';
  SDHubGalleryBlur('add');
  Spinner.classList.add('sdhub-gallery-spinner');
  window.SDHubGalleryDisplayImageInfo = null;

  if (input) {
    requestAnimationFrame(() => infoCon.style.opacity = '1');
    await SDHubGalleryUpdateImageInput(input, path);

    window.SDHubGallerySendImageInfo = () => {
      setTimeout(() => {
        document.querySelector(`#${SDHGiI}-SendButton > #${v}_tab`)?.click();
        setTimeout(() => {
          infoCon.style.opacity = infoCon.style.display = '';
          SDHubGalleryBlur('remove'); Spinner.classList.remove('sdhub-gallery-spinner');
        }, 100);
      }, 200);
    };
  }
}

async function SDHubGalleryImageInfo(imgEL) {
  const imginfoRow = document.getElementById(`${SDHGiI}-Row`),
        imgPanel = document.getElementById(`${SDHGiI}-img`),
        input = imgPanel.querySelector('input'),
        infoCon = document.getElementById('SDHub-Gallery-Info-Container'),
        Spinner = document.getElementById('SDHub-Gallery-Info-Spinner');

  infoCon.style.display = 'flex';
  SDHubGalleryBlur('add');
  Spinner.classList.add('sdhub-gallery-spinner');
  window.SDHubGallerySendImageInfo = null;

  if (input) {
    requestAnimationFrame(() => {
      infoCon.style.opacity = '1';
      imginfoRow.style.display = 'flex';
      imginfoRow.style.pointerEvents = 'none';
    });

    window.SDHubImagePath = imgEL.getAttribute('data-image');
    await SDHubGalleryUpdateImageInput(input, window.SDHubImagePath);

    window.SDHubGalleryDisplayImageInfo = () => {
      setTimeout(() => {
        imginfoRow.style.opacity = '1';
        infoCon.style.display = infoCon.style.opacity = imginfoRow.style.pointerEvents = '';
        setTimeout(() => (SDHubGalleryBlur('remove'), Spinner.classList.remove('sdhub-gallery-spinner')), 100);
        setTimeout(() => window.SDHubGalleryImageInfoArrowUpdate(), 0);
      }, 200);
    };
  }
}

async function SDHubGalleryDeleteImage() {
  const imgEL = document.querySelector(`img[data-image='${window.SDHubImagePath}']`),
        imgBox = imgEL?.closest('.sdhub-gallery-img-box'),
        path = decodeURIComponent(window.SDHubImagePath).slice(`${SDHubGalleryBase}/image=`.length),
        thumb = decodeURIComponent(imgEL?.src.split('/').pop()),
        perm = window.SDHubGallerySettings?.['single-delete-permanent'] ?? false;

  try {
    const res = await fetch(`${SDHubGalleryBase}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: path, thumb: thumb, ...(perm && { permanent: true }) }),
    });

    if (!res.ok) throw new Error(await res.text());

    const r = await res.json();
    if (r.status === 'deleted') {
      if (imgBox?.classList.contains(sdhgis)) {
        imgBox.classList.remove(sdhgis);
        imgBox.querySelector('.sdhub-gallery-img-btn-checkbox')?.classList.remove(sdhgis);
        SDHubGalleryImgSelected = Math.max(0, SDHubGalleryImgSelected - 1);
        SDHubGalleryBatchBoxToggle(SDHubGalleryImgSelected > 0 ? 'flex' : '');
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
        perm = window.SDHubGallerySettings?.['batch-delete-permanent'] ?? false;

  const img = imgBox.map(b => {
    const i = b.querySelector('.sdhub-gallery-img'),
          p = i.dataset.image,
          t = i.getAttribute('src');

    return {
      path: decodeURIComponent(p.replace(`${SDHubGalleryBase}/image=`, '')),
      thumb: decodeURIComponent(t.replace(`${SDHubGalleryBase}/thumb/`, '')),
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
          imgBox = Array.from(TabCon.querySelectorAll(`.sdhub-gallery-img-box.${sdhgis}`));

    const images = imgBox.map(b => {
      const i = b.querySelector('.sdhub-gallery-img'),
            p = i?.dataset?.image;
      return p ? { path: decodeURIComponent(p.replace(`${SDHubGalleryBase}/image=`, '')) } : null;
    }).filter(Boolean);

    if (images.length === 0) return;

    path.value = JSON.stringify({ name, images });
    updateInput(path);
  }
}

function SDHubGalleryInfoPopUp(f, whichTab = null) {
  const q = id => document.getElementById(`SDHub-Gallery-Info-${id}`),
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
        No = q('No-Button');

  let bc = 'sdhub-gallery-batch-download';

  const displayCon = () => {
    infoCon.style.display = 'flex';
    SDHubGalleryBlur('add');
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

  const spin = () => {
    requestAnimationFrame(() => {
      Spinner.classList.add('sdhub-gallery-spinner');
      infoBox.style.pointerEvents = infoBox.style.opacity = '';
      infoBox.style.transform = 'scale(1.5)';
    });
  };

  const text = (t, k) => {
    infoText.style.display = '';
    checkboxWrap.style.display = infoCheckbox.style.display = 'flex';
    infoCheckboxText.textContent = SDHubGetTranslation(t);
    infoCheckboxInput.checked = !!(window.SDHubGallerySettings?.[k]);
  };

  const warn = (t, k) => {
    infoText.style.display = '';
    checkboxWrap.style.display = infoWarning.style.display = 'flex';
    infoWarningText.textContent = SDHubGetTranslation(t);
    infoWarningInput.checked = !!(window.SDHubGallerySettings?.[k]);
  };

  const buttons = () => {
    Yes.textContent = SDHubGetTranslation('yes');
    No.textContent = SDHubGetTranslation('no');
    Yes.style.minWidth = No.style.minWidth = '';
    [Yes, No].forEach(b => b.classList.remove(bc));
  };

  const bd = () => {
    infoText.style.display = 'none';
    infoBatch.style.display = 'flex';
    infoBatchText.textContent = SDHubGetTranslation('file_name');
    Yes.textContent = SDHubGetTranslation('download');
    No.textContent = SDHubGetTranslation('cancel');
    Yes.style.minWidth = No.style.minWidth = '130px';
    [Yes, No].forEach(b => b.classList.add(bc));
  };

  const displayBox = () => {
    requestAnimationFrame(() => {
      infoCon.style.opacity = infoBox.style.opacity = '1';
      infoBox.style.pointerEvents = 'auto';
      infoBox.style.transform = 'scale(var(--sdhub-scale))';
    });
  };

  const checking = async ({ keys, skipWarning, func, delay = 1000, spin }) => {
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
  };

  const warning = k => (window.SDHubGallerySettings || {})[k] ?? false;

  const switchTab = () => {
    window.SDHubGalleryAllCheckbox(false, false);
    SDHubGalleryTabSwitch(whichTab);
    setTimeout(() => SDHubGalleryBlur('baygon'), 100);
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
  const id = 'SDHub-Gallery-Blur',
        e = document.getElementById(id),
        FoxFire = /firefox/i.test(navigator.userAgent),
        css = `
          #SDHub-Gallery-Tab-Wrapper {
            ${FoxFire ? '' : 'filter: blur(3px);'}
            pointer-events: none;
          }

          #SDHub-Tab .sdhub-sticky-container > * {
            pointer-events: none;
          }

          #SDHub-Tab .sdhub-sticky-container {
            opacity: 0.4;
            filter: blur(2px);
          }

          :root #SDHub-Gallery-Tab-Wrapper {
            opacity: 0.7;
          }

          .dark #SDHub-Gallery-Tab-Wrapper {
            opacity: 0.5;
          }
        `;

  f === 'add'
    ? (!e && (() => {
        document.body.appendChild(Object.assign(document.createElement('style'), { id, textContent: css }));
        document.body.classList.add(SDHubBnS);
      })())
    : (e?.remove(), f === 'baygon' && document.body.classList.remove(SDHubBnS));
}

async function SDHubGalleryImgChestUpload(paths, names) {
  if (!document.querySelector('#SDHub-Gallery-ImgChest-Checkbox input')?.checked) return;

  const api = document.querySelector('#SDHub-Gallery-ImgChest-API input')?.value.trim(); if (!api) return;
  const whichone = (id) => document.querySelector(`${id} > div > label.selected`)?.getAttribute('data-testid')?.replace('-radio-label', '').toLowerCase() || '';
  const [privacy, nsfw] = ['#SDHub-Gallery-ImgChest-Privacy', '#SDHub-Gallery-ImgChest-NSFW'].map(whichone);

  const sorted = paths.map((path, i) => ({ path, name: names[i] })).sort((a, b) => b.name.includes('grid-') - a.name.includes('grid-')),
        files = await Promise.all(sorted.map(({ path }) => SDHubGalleryCreateImageFile(path)));

  const data = new FormData();
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
          TabWrap = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Wrapper'),
          imgBox = SDHubGallery.querySelector('#SDHub-Gallery-Image-Box-0'),
          StickyCon = SDHubGallery.querySelector('#SDHub-Gallery-Sticky-Container');

    GalleryTab.prepend(Setting, infoCon, StickyCon, TabWrap, imgBox);

    const SettingWrapper = Setting.querySelector(`#${SDHGS}-Wrapper`),
          repo = document.querySelector('#SDHub-Repo > a');
    SettingWrapper && repo && SettingWrapper.append(repo.cloneNode(true));

    const imgchestColumn = document.getElementById('SDHub-Gallery-ImgChest-Column');
    if (imgchestColumn) SDHubGalleryCreateimgChest(TabWrap, imgchestColumn);

    const sendButton = document.getElementById(`${SDHGiI}-SendButton`);
    sendButton?.querySelectorAll('button').forEach(btn => btn.onclick = () => SDHubGallerySendButton(btn.id));

    const imginfoRow = document.getElementById(`${SDHGiI}-Row`);
    imginfoRow.append(SDHubGallery.querySelector('#SDHub-Gallery-Image-Info-Arrow'));
    imginfoRow.addEventListener('scroll', window.SDHubGalleryImageInfoArrowUpdate);

    const imgCon = document.querySelector(`#${SDHGiI}-img > .image-container`),
          imgFrame = SDHubCreateEL('div', { id: `${SDHGiI}-img-frame` }),
          clearButton = SDHubCreateEL('div', { id: `${SDHGiI}-Clear-Button`, html: SDHubGallerySVG_Cross });

    window.SDHubGalleryCloseImageInfo = () => {
      const btn = document.querySelector(`#${SDHGiI}-img > div > div > div > button:nth-child(2)`) ||
                  document.querySelector(`.gradio-container-4-40-0 #${SDHGiI}-img > div > div > button`);

      imginfoRow.style.opacity = '';
      document.body.classList.remove(SDHubBnS);
      window.SDHubGalleryDisplayImageInfo = null;
      window.SDHubGallerySendImageInfo = null;
      setTimeout(() => (btn.click(), (imginfoRow.style.display = ''), window.SDHubGalleryImageInfoRaw = ''), 200);
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

    SDHubGalleryLoadSettings();
    onAfterUiUpdate(SDHubGalleryWatchNewImage);
  }
}

function SDHubGalleryWatchNewImage() {
  const SDGallery = ['txt2img_gallery', 'img2img_gallery', 'extras_gallery'];

  SDGallery.forEach(whichGallery => {
    const preview = document.querySelector(`#${whichGallery} > .preview`);
    if (!preview) return;

    const img = preview.querySelectorAll('.thumbnails img');
    if (img.length === 0) return;

    let New = false;
    img.forEach(imgEL => {
      const src = imgEL.getAttribute('src');
      if (!src || !src.includes('/file=')) return;

      const path = src.split('/file=')[1].split('?')[0],
            key = `${whichGallery}-${path}`;

      if (!SDHubGalleryNewImageSrc.has(key)) {
        New = true;
        SDHubGalleryNewImageSrc.add(key);
      }
    });

    if (New) SDHubGalleryGetNewImage(whichGallery);
  });
}

async function SDHubGalleryGetNewImage(whichGallery) {
  let imgBox = document.getElementById('SDHub-Gallery-Image-Box-0'),
      imgNames = [],
      imgPaths = [],
      loaded = 0,
      selectedTab = false;

  const tabMap = new Map();

  let newImg = Array.from(document.querySelectorAll(`#${whichGallery} > .preview > .thumbnails img`)).sort((a, b) => {
    const gridImg = a.getAttribute('src')?.includes('grid-') ? 1 : 0,
          gridNot = b.getAttribute('src')?.includes('grid-') ? 1 : 0;
    return gridImg - gridNot;
  });

  for (let index = 0; index < newImg.length; index++) {
    const imgEL = newImg[index];
    let src = imgEL.getAttribute('src');
    if (!src || !src.includes('/file=')) continue;

    let imgSrc = src.split('/file=')[1].split('?')[0],
        whichTab = whichGallery === 'extras_gallery'
        ? 'extras-images' : imgSrc.includes('grid-')
          ? `${whichGallery.split('_')[0]}-grids` : `${whichGallery.split('_')[0]}-images`;

    const TabCon = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`);
    if (!TabCon || !imgBox) continue;

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
    const aa = tabs.indexOf(a),
          bb = tabs.indexOf(b);
    return (aa === -1 ? Infinity : aa) - (bb === -1 ? Infinity : bb);
  });

  for (const tabName of tabSorted) {
    const images = tabMap.get(tabName),
          TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`),
          wrapper = TabCon.querySelector(`.${sdhgp}-wrapper`),
          TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row'),
          TabBtn = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Button`),
          Counter = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Image-Counter`),
          imageBoxes = [];

    for (const { newImgBox, imgSrc } of images) {
      const img = newImgBox.querySelector('img'),
            path = `${SDHubGalleryBase}/image=${imgSrc}`,
            name = path.split('/').pop().split('?')[0],
            nameBox = newImgBox.querySelector('.sdhub-gallery-img-name'),
            decoded = decodeURIComponent(name);
      if (nameBox) nameBox.textContent = decoded;

      const res = await fetch(`${SDHubGalleryBase}/get-thumb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: imgSrc })
      });

      if (!res.ok) { console.error('Thumbnail failed:', res.statusText); continue; }
      const data = await res.json();

      if (img) {
        img.loading = 'lazy';
        img.dataset.image = path;
        img.title = decoded;

        const loadThumb = new Image();
        loadThumb.src = data.status;
        loadThumb.onload = () => {
          img.src = data.status;
          ++loaded === newImg.length && SDHubGalleryTabImageCounters();
        };
      }

      imgNames.push(name);
      imgPaths.push(path);
      imageBoxes.push(newImgBox);
    }

    const totalPages = SDHubGalleryCreateImagePages(wrapper, imageBoxes);

    if (TabRow && TabBtn) TabRow.style.display = TabBtn.style.display = 'flex';

    if (!selectedTab) {
      TabCon.classList.add('active');
      TabBtn.classList.add('selected');
      TabCon.style.display = Counter.style.display = 'flex';
      selectedTab = true;
    }

    SDHubGallerySwitchPage(tabName, null, totalPages - 1);
  }

  if (imgNames.length) {
    SDHubGalleryImgChestUpload(imgPaths, imgNames);
    try {
      await fetch(`${SDHubGalleryBase}/new-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: imgPaths })
      });
    } catch (err) {
      console.error('Failed to notify /new-image:', err);
    }
  }

  SDHubGalleryTabImageCounters();
}