let SDHubGalleryTabList = [
  'txt2img-images',
  'txt2img-grids',
  'img2img-images',
  'img2img-grids',
  'init-images',
  'extras-images',
  'manual-save',
  'Favorites'
],

SDHubGalleryNewImgSrc = new Set(),
SDHubGalleryCMRightClick = false,
SDHubGalleryCMTouch = false,
SDHubGalleryPageLimit,
SDHubGalleryPageLocks = {},
SDHubGalleryImgSelected = 0;

function SDHubGalleryImageButtonEvents(imgBox) {
  const imgCon = imgBox.querySelector('.sdhub-gallery-img-container'),
  img = imgCon.querySelector('img'),
  checkbox = imgCon.querySelector('.sdhub-gallery-img-btn-checkbox'),
  viewerBtn = imgCon.querySelector('.sdhub-gallery-img-btn-imageviewer'),
  favBtn = imgCon.querySelector('.sdhub-gallery-img-btn-fav');

  img.onclick = (e) => e.shiftKey ? checkbox?.click() : SDHubGalleryImageInfo(img);

  favBtn.onclick = async function fav() {
    favBtn.onclick = null;
    try {
      await SDHubGalleryImageFav(imgBox, img);
    } finally {
      favBtn.onclick = fav;
    }
  };

  checkbox.onclick = () => {
    const s = imgBox.classList.contains(SDHubVar.imgSelected), n = !s;
    checkbox.classList.toggle(SDHubVar.imgSelected, n);
    imgBox.classList.toggle(SDHubVar.imgSelected, n);
    SDHubGalleryImgSelected += s ? -1 : 1;
    SDHubGalleryImgSelected = Math.max(0, SDHubGalleryImgSelected);
    SDHubGalleryToggleBatchBox(SDHubGalleryImgSelected > 0 ? 'flex' : '');
    checkbox.innerHTML = n ? SDHubSVG.imageUncheck() : SDHubSVG.imageCheck();
  };

  viewerBtn.onclick = () => SDHubGalleryOpenViewerFromButton(img);
}

async function SDHubGalleryImageFav(imgBox, img) {
  const box = '.sdhub-gallery-img-box', cb = '.sdhub-gallery-img-btn-checkbox',

  TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper'),
  TabFav = document.getElementById('SDHub-Gallery-Favorites-Tab-Container'),
  TabBtn = document.getElementById('SDHub-Gallery-Favorites-Tab-Button'),
  wrapper = TabFav?.querySelector(`.${SDHubVar.page}-wrapper`),
  imgEL = img.getAttribute('data-image'),
  p = decodeURIComponent(imgEL).slice(`${SDHubVar.GalleryBase}-image=`.length),

  unselect = (b) => b?.classList.contains(SDHubVar.imgSelected) && b.querySelector(cb)?.click(),

  op = imgBox.classList.contains(SDHubVar.imgFavorited) ? 'remove' : 'add';

  if (op === 'add') {
    imgBox.classList.add(SDHubVar.imgFavorited);

    const cloneBox = imgBox.cloneNode(true);
    cloneBox.classList.remove(SDHubVar.imgSelected);
    cloneBox.querySelector('img')?.removeAttribute('loading');

    const checkbox = cloneBox.querySelector(cb);
    checkbox && (checkbox.classList.remove(SDHubVar.imgSelected), checkbox.innerHTML = SDHubSVG.imageCheck());

    let page = TabFav.querySelector(`.${SDHubVar.page}s:last-child`);
    if (!page) {
      const totalPages = SDHubGalleryCreateImagePages(wrapper, [cloneBox]);
      SDHubGallerySwitchPage('Favorites', null, totalPages - 1);
      TabBtn.style.display = 'flex';
      page = TabFav.querySelector(`.${SDHubVar.page}s:last-child`);
    }

    SDHubGalleryImageButtonEvents(cloneBox);
    page.prepend(cloneBox);

  } else if (op === 'remove') {
    if (TabFav?.contains(imgBox)) {
      unselect(imgBox);
      imgBox.remove();
      TabWrap.querySelector(`img[data-image='${imgEL}']`)?.closest(box)?.classList.remove(SDHubVar.imgFavorited);
    } else {
      imgBox.classList.remove(SDHubVar.imgFavorited);
      wrapper.querySelector(`img[data-image='${imgEL}']`)?.closest(box)?.remove();
    }

    const page = wrapper.querySelector(`.${SDHubVar.page}s`);
    if (page && page.querySelectorAll(box).length === 0) {
      page.remove();
      TabBtn.style.display = '';
      [...TabWrap.parentElement.querySelectorAll('.sdhub-gallery-tab-button')].find(b => b.style.display === 'flex')?.click();
    }
  }

  fetch(`${SDHubVar.GalleryBase}-favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ p, op })
  }).catch(err => console.error('Failed to update favorite:', err));

  SDHubGalleryTabImageCounters('Favorites');
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

  if (GalleryCM.style.transform === SDHubVar.scale) {
    Object.assign(GalleryCM.style, { transform: ''});
    Object.assign(ul.style, { opacity: '' });
    setTimeout(display, 100);
  } else {
    setTimeout(display, 50);
  }
}

function SDHubGalleryContextMenuDisplay(e, imgEL) {
  SDHubGalleryImageViewerimgList(imgEL);

  const set = (e, s) => e && Object.assign(e.style, s),
  GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
  ul = GalleryCM.querySelector('ul'),

  select = document.getElementById('SDHub-Gallery-Context-Select'),
  unselect = document.getElementById('SDHub-Gallery-Context-Unselect'),
  selected = imgEL?.closest(`.sdhub-gallery-img-box.${SDHubVar.imgSelected}`);

  select.style.display = selected ? 'none' : '';
  unselect.style.display = selected ? '' : 'none';

  set(GalleryCM, { left: '', right: '', top: '', bottom: '' });

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
    set(GalleryCM, { transform: SDHubVar.scale, pointerEvents: 'auto' });
    set(ul, { opacity: '1' });
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
        set(submenu, { transform: SDHubVar.scale, pointerEvents: 'auto' });
        set(ul, { opacity: '1' });
        setTimeout(() => {
          anim = false;
          SDHubGalleryContextSubmenu();
        }, 310);
      });
    }, 310);
  };

  const hide = (check = false) => {
    if (check && anim) return;

    clearTimeout(show);
    anim = true;

    hover = setTimeout(() => {
      requestAnimationFrame(() => {
        set(submenu, { transform: '', pointerEvents: '' });
        set(ul, { opacity: '' });
        setTimeout(() => {
          anim = false;
          SDHubGalleryContextSubmenu();
        }, 310);
      });
    }, 0);
  };

  if (SDHubGalleryCMTouch) {
    subbtn.onmouseenter = subbtn.onmouseleave = null;
    submenu.onmouseenter = submenu.onmouseleave = null;
    subbtn.onclick = () => {
      const forming = submenu.style.transform === SDHubVar.scale;
      forming ? hide(true) : display(true);
    };
  } else {
    subbtn.onclick = null;
    let hoverDelay;

    [subbtn, submenu].forEach(el => {
      el.onmouseenter = () => {
        clearTimeout(hoverDelay);
        hoverDelay = setTimeout(() => {
          if (subbtn.matches(':hover') || submenu.matches(':hover')) display();
        }, 150);
      };

      el.onmouseleave = () => {
        clearTimeout(hoverDelay);
        hoverDelay = setTimeout(() => {
          if (!subbtn.matches(':hover') && !submenu.matches(':hover')) hide();
        }, 150);
      };
    });
  }
}

function SDHubGalleryContextMenuClose() {
  SDHubGalleryCMRightClick = false;
  SDHubGalleryCMTouch = false;

  const set = (e, s) => e && Object.assign(e.style, s),
  GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu'),
  ul = GalleryCM?.querySelector('ul'),
  submenu = document.getElementById('SDHub-Gallery-ContextMenu-SubMenu-SendTo'),
  ulsub = submenu?.querySelector('ul');

  set(GalleryCM, { transform: '', pointerEvents: '' });
  set(ul, { opacity: '' });

  setTimeout(() => {
    set(submenu, { transform: '', pointerEvents: '' });
    set(ulsub, { opacity: '' });
  }, 100);
}

function SDHubGaleryContextImage(v) {
  SDHubGalleryContextMenuClose();
  const path = window.SDHubImg = window.SDHubImagePath, img = document.querySelector(`img[data-image='${path}']`);
  if (v && img) {
    img.classList.add(SDHubVar.style);
    setTimeout(() => img.classList.remove(SDHubVar.style), 1000);
  }

  return { img, path };
}

async function SDHubGalleryContextMenuButton(v) {
  const c = ['copy', 'download', 'delete'],
  { img, path } = SDHubGaleryContextImage(c.includes(v));

  switch (v) {
    case 'open':
      window.open(path, '_blank');
      break;

    case 'download':
      fetch(path)
        .then(r => r.blob())
        .then(b => {
          const url = URL.createObjectURL(b), link = document.createElement('a');
          link.href = url; link.download = img.title; document.body.appendChild(link);
          link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        });
      break;

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
      img.parentElement.querySelector('.sdhub-gallery-img-btn-checkbox').click();
      break;

    case 'delete':
      SDHubGalleryInfoPopUp('delete');
      break;
  }
}

async function SDHubGallerySendImage(v) {
  const set = (e, s) => e && Object.assign(e.style, s),
  submenu = document.getElementById('SDHub-Gallery-ContextMenu-SubMenu-SendTo'),
  ulsub = submenu?.querySelector('ul');

  set(submenu, { transition: 'transform 150ms ease', transform: 'scale(0.9)' });
  set(ulsub, { transition: 'opacity 150ms ease', opacity: '0' });

  const { path } = SDHubGaleryContextImage(v);

  if (v === 'uploader') {
    const area = document.querySelector('#SDHub-Uploader-Input textarea'),
    imgPath = decodeURIComponent(path.slice(`${SDHubVar.GalleryBase}-image=`.length));
    area.value += area.value ? `\n${imgPath}` : imgPath;
    updateInput(area);
    return;
  }

  const imgInput = document.querySelector(`#${SDHubVar.ImgInfo}-img input`),
  infoCon = document.getElementById('SDHub-Gallery-Info-Container');

  infoCon.style.display = 'flex';
  SDHubGalleryBlur('spin');

  if (imgInput) {
    setTimeout(async () => {
      window.SDHubGalleryDisplayImageInfo = null;
      await SDHubGalleryUpdateImageInput(imgInput, path);
    }, 100);

    window.SDHubGallerySendImageInfo = () => {
      setTimeout(() => requestAnimationFrame(() => {
        document.querySelector(`#${SDHubVar.ImgInfo}-SendButton > #${v}_tab`)?.click();
        infoCon.style.display = '';
        setTimeout(() => SDHubGalleryBlur('remove'), 200);
      }), 100);
    };
  }
}

async function SDHubGalleryImageInfo(imgEL) {
  const imgInfoRow = document.getElementById(`${SDHubVar.ImgInfo}-Row`),
  imgInput = imgInfoRow.querySelector(`#${SDHubVar.ImgInfo}-img input`),
  infoCon = document.getElementById('SDHub-Gallery-Info-Container'),
  LightBox = document.getElementById(`${SDHubVar.ImgViewer}`);

  infoCon.style.display = imgInfoRow.style.display = 'flex';
  imgInfoRow.style.pointerEvents = 'none';
  imgInfoRow.focus();
  SDHubGalleryBlur('spin');

  if (imgInput) {
    setTimeout(async () => {
      window.SDHubGallerySendImageInfo = null;
      window.SDHubImagePath = window.SDHubImg = imgEL.getAttribute('data-image');
      await SDHubGalleryUpdateImageInput(imgInput, window.SDHubImagePath);
    }, 100);

    window.SDHubGalleryDisplayImageInfo = () => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        imgInfoRow.classList.add(SDHubVar.style);
        infoCon.style.display = '';

        setTimeout(() => window.SDHubGalleryImageInfoArrowUpdate(), 0);
        setTimeout(() => SDHubGalleryBlur('remove'), 100);
        setTimeout(() => imgInfoRow.style.pointerEvents = '', 300);
        setTimeout(() => {
          imgInfoRow.onkeydown = (e) => {
            if (LightBox?.style.display === 'flex') return;
            if (e.key === 'Escape') window.SDHubGalleryCloseImageInfo();
            if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
              const l = window.SDHubGallerySettings['image-info-layout'] === 'full_width',
              el = l ? imgInfoRow : document.getElementById(`${SDHubVar.ImgInfo}-Output-Panel`),
              s = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? el.scrollHeight : null;
              if (s !== null) (e.preventDefault(), el.scrollTo({ top: s, behavior: 'smooth' }));
            }
          };
        }, 400);
      }));
    };
  }
}

async function SDHubGalleryDeleteImage() {
  const b = '.sdhub-gallery-img-box',

  TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper'),
  imgEL = TabWrap.querySelector(`img[data-image='${window.SDHubImagePath}']`),
  imgBox = imgEL?.closest(b),
  path = decodeURIComponent(imgEL?.getAttribute('data-image')?.replace(`${SDHubVar.GalleryBase}-image=`, '')),
  thumb = decodeURIComponent(imgEL?.getAttribute('src')?.replace(`${SDHubVar.GalleryBase}-thumb=`, '')),
  perma = window.SDHubGallerySettings?.['single-delete-permanent'] ?? false;

  try {
    const res = await fetch(`${SDHubVar.GalleryBase}-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, thumb, ...(perma && { permanent: true }) }),
    });

    if (!res.ok) throw new Error(await res.text());

    const r = await res.json();
    if (r.status === 'deleted') {
      if (imgBox?.classList.contains(SDHubVar.imgSelected)) {
        imgBox.classList.remove(SDHubVar.imgSelected);
        imgBox.querySelector('.sdhub-gallery-img-btn-checkbox')?.classList.remove(SDHubVar.imgSelected);
        SDHubGalleryImgSelected = Math.max(0, SDHubGalleryImgSelected - 1);
        SDHubGalleryToggleBatchBox(SDHubGalleryImgSelected > 0 ? 'flex' : '');
      }

      if (imgBox?.classList.contains(SDHubVar.imgFavorited)) {
        TabWrap.querySelectorAll(`${b}.${SDHubVar.imgFavorited}`).forEach(box => 
          box.querySelector(`img[data-image='${window.SDHubImagePath}']`)?.closest(`${b}.${SDHubVar.imgFavorited}`)?.remove()
        );
      }

      imgBox.remove();

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
  const b = '.sdhub-gallery-img-box',

  TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper'),
  TabCon = TabWrap.querySelector('.sdhub-gallery-tab-container.active'),
  imgBoxes = Array.from(TabCon.querySelectorAll(`${b}.${SDHubVar.imgSelected}`)),
  perm = window.SDHubGallerySettings?.['batch-delete-permanent'] ?? false,

  images = imgBoxes.map(box => {
    const i = box.querySelector('.sdhub-gallery-img');
    return {
      path: i.getAttribute('data-image'),
      thumb: i.getAttribute('src'),
      fav: box.classList.contains(SDHubVar.imgFavorited),
      box
    };
  }).filter(Boolean);

  if (images.length === 0) return;

  try {
    const res = await fetch(`${SDHubVar.GalleryBase}-batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(images.map(({ path, thumb }) => ({
        path: decodeURIComponent(path.replace(`${SDHubVar.GalleryBase}-image=`, '')),
        thumb,
        ...(perm && { permanent: true })
      }))),
    });

    if (!res.ok) return console.error('Failed to delete images:', res.statusText);

    const r = await res.json();
    if (r.status === 'deleted') {
      window.SDHubGalleryAllCheckbox(false, false);

      images.forEach(({ fav, box, path }) => {
        box?.remove();

        if (fav) {
          TabWrap.querySelectorAll(`${b}.${SDHubVar.imgFavorited}`).forEach(boxs =>
            boxs.querySelector(`img[data-image='${path}']`)?.closest(`${b}.${SDHubVar.imgFavorited}`)?.remove()
          );
        }
      });

    } else {
      console.error('Deletion failed:', r);
    }

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
    imgBox = Array.from(TabCon.querySelectorAll(`.sdhub-gallery-img-box.${SDHubVar.imgSelected}`)),

    images = imgBox.map(b => {
      const i = b.querySelector('.sdhub-gallery-img'), p = i?.dataset?.image;
      return p ? { path: decodeURIComponent(p.replace(`${SDHubVar.GalleryBase}-image=`, '')) } : null;
    }).filter(Boolean);

    if (images.length === 0) return;

    path.value = JSON.stringify({ name, images });
    updateInput(path);
  }
}

function SDHubGalleryToggleBatchBox(v = '') {
  const box = document.getElementById('SDHub-Gallery-Batch-Box');
  v === 'flex'
    ? (box.style.display = 'flex', requestAnimationFrame(() => box.classList.add(SDHubVar.style)))
    : (box.classList.remove(SDHubVar.style), setTimeout(() => box.style.display = '', 200));
}

function SDHubGalleryInfoPopUp(f, tabName = null) {
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

  displayBox = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => infoBox.classList.add(SDHubVar.style)));
  },

  spin = () => {
    requestAnimationFrame(() => {
      setTimeout(() => Spinner.classList.add(SDHubVar.style), 0);
      infoBox.classList.remove(SDHubVar.style);
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

  checking = async ({ keys, skipWarning, func, delay = 1000, spin }) => {
    spin && spin();

    if (!skipWarning) {
      keys.forEach(k => {
        window.SDHubGallerySettings[k] = (k.includes('suppress'))
          ? infoWarningInput.checked
          : infoCheckboxInput.checked;
      });

      try {
        const res = await fetch(`${SDHubVar.GalleryBase}-save-setting`, {
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
    SDHubGalleryTabSwitch(tabName);
    setTimeout(() => SDHubGalleryBlur('baygon'), 100);
  };

  No.onclick = () => {
    infoBox.classList.remove(SDHubVar.style);
    SDHubGalleryBlur('baygon');
    setTimeout(() => (
      infoCon.style.display = infoText.style.display = checkboxWrap.style.display = 
      infoBatch.style.display = infoCheckbox.style.display = infoWarning.style.display = '',
      infoCheckboxInput.checked = infoWarningInput.checked = false
    ), 200);
    No.onclick = null;
  };

  switch (f) {
    case 'delete': {
      const k = 'single-delete-permanent', sk = 'single-delete-suppress-warning';

      displayCon();
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
          requestAnimationFrame(() => infoBox.classList.remove(SDHubVar.style));
          setTimeout(() => infoCon.style.display = checkboxWrap.style.display = infoCheckbox.style.display = '', 200);
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
  infoWarning = q('Warning');

  setTimeout(() => SDHubGalleryBlur('baygon'), 1000);
  setTimeout(() => {
    infoBox.classList.remove(SDHubVar.style);
    infoCon.style.display = checkboxWrap.style.display = '';
    infoBatch.style.display = infoCheckbox.style.display = infoWarning.style.display = '';
  }, 1100);
}

function SDHubGalleryBlur(f) {
  const layer = document.getElementById('SDHub-Gallery-Tab-Layer'),
  Spinner = document.getElementById('SDHub-Gallery-Info-Spinner'),

  id = 'SDHub-Gallery-Blur',
  e = document.getElementById(id),
  css = `
    #SDHub-Tab .sdhub-sticky-container *,
    #${SDHubVar.ImgInfo}-Row * {
      pointer-events: none !important;
    }

    #SDHub-Gallery-Batch-Box, #SDHub-Gallery-Page-Arrow-Wrapper {
      opacity: .8;
    }
  `;

  if (f === 'add' || f === 'spin') {
    if (!e) {
      layer.style.display = 'flex';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (f === 'spin') Spinner.classList.add(SDHubVar.style);
        layer.classList.add(SDHubVar.style);
        document.body.appendChild(Object.assign(document.createElement('style'), { id, textContent: css }));
        document.body.classList.add(SDHubVar.noScroll);
      }));
    }

    return;
  }

  e?.remove();
  if (f === 'baygon') document.body.classList.remove(SDHubVar.noScroll);
  [layer, Spinner].forEach(l => l.classList.remove(SDHubVar.style));
  setTimeout(() => layer.style.display = '', 300);
}

function SDHubCreateGallery() {
  const GalleryTab = document.getElementById('SDHub-Gallery-Tab'),
  SDHubGallery = document.getElementById('SDHubGallery');

  if (GalleryTab && SDHubGallery) {
    SDHubGallery.style.display = '';
    const Setting = SDHubGallery.querySelector(`#${SDHubVar.Setting}`),

    infoCon = SDHubGallery.querySelector('#SDHub-Gallery-Info-Container'),
    GalleryWrap = SDHubGallery.querySelector('#SDHub-Gallery-Wrapper'),
    imgBox = SDHubGallery.querySelector('#SDHub-Gallery-imgBox');
    GalleryTab.prepend(Setting, infoCon, GalleryWrap, imgBox);

    const SettingWrapper = Setting.querySelector(`#${SDHubVar.Setting}-Wrapper`),
    repo = document.querySelector('#SDHub-Repo > a');
    SettingWrapper && repo && SettingWrapper.append(repo.cloneNode(true));

    const sendButton = document.getElementById(`${SDHubVar.ImgInfo}-SendButton`);
    sendButton?.querySelectorAll('button').forEach(btn => {
      btn.tabIndex = -1;
      btn.onclick = () => SDHubGallerySendButton(btn.id);
    });

    const imgInfoRow = document.getElementById(`${SDHubVar.ImgInfo}-Row`);
    imgInfoRow.tabIndex = 0;
    imgInfoRow.append(SDHubGallery.querySelector('#SDHub-Gallery-Image-Info-Arrow-Button'));
    imgInfoRow.addEventListener('scroll', window.SDHubGalleryImageInfoArrowUpdate);

    window.SDHubGalleryCloseImageInfo = () => {
      const gr3 = document.querySelector(`#${SDHubVar.ImgInfo}-img > div > div > div > button:nth-child(2)`),
      gr4 = document.querySelector(`.gradio-container-4-40-0 #${SDHubVar.ImgInfo}-img > div > div > button`),
      btn = gr3 || gr4;

      document.body.classList.remove(SDHubVar.noScroll);
      imgInfoRow.classList.remove(SDHubVar.style);
      imgInfoRow.onkeydown = window.SDHubGalleryDisplayImageInfo = window.SDHubGallerySendImageInfo = null;
      setTimeout(() => (btn?.click(), (imgInfoRow.style.display = ''), window.SDHubGalleryImageInfoRaw = ''), 210);
    };

    const imgInfo = document.querySelector(`#${SDHubVar.ImgInfo}-img`),
    imgFrame = SDHubEL('div', { id: `${SDHubVar.ImgInfo}-img-frame` }),
    exitButton = SDHubEL('div', { id: `${SDHubVar.ImgInfo}-Exit-Button`, html: SDHubSVG.cross(), onclick: () => window.SDHubGalleryCloseImageInfo() });
    imgInfo.append(exitButton, imgFrame);

    const Panel = document.getElementById(`${SDHubVar.ImgInfo}-Output-Panel`),
    imgArea  = SDHubEL('div', { id: `${SDHubVar.ImgInfo}-img-area`, onclick: () => document.querySelector(`#${SDHubVar.ImgInfo}-img img`)?.click() });
    Panel.prepend(imgArea);
    Panel.addEventListener('scroll', window.SDHubGalleryImageInfoArrowUpdate);

    ['drop', 'dragover'].forEach(t => document.addEventListener(t, e => {
      const E = e.target.id === imgArea.id || e.target.classList?.contains(`${SDHubVar.imgInfo}-output-content`);
      E && (e.preventDefault(), e.stopPropagation());
    }));

    const HTMLPanel = document.getElementById(`${SDHubVar.ImgInfo}-HTML`);
    HTMLPanel.classList.add('prose');

    SDHubGalleryCreateimgChest();
    SDHubGalleryLoadSettings();
    window.addEventListener('blur', SDHubGalleryContextMenuClose);
  }
}

async function SDHubGalleryNewImage(images) {
  try {
    const gallery = new Map();

    for (const { path, thumb, name } of images) {
      if (SDHubGalleryNewImgSrc.has(path)) continue;
      SDHubGalleryNewImgSrc.add(path);
      new Image().src = path;

      const tab = SDHubGalleryTabList.find(t => path.includes(`/${t}/`));
      const whichGallery =
        tab?.startsWith('txt2img') ? 'txt2img_gallery' :
        tab?.startsWith('img2img') ? 'img2img_gallery' :
        tab?.startsWith('extras')  ? 'extras_gallery' :
        '';

      if (!whichGallery) continue;
      if (!gallery.has(whichGallery)) gallery.set(whichGallery, []);
      gallery.get(whichGallery).push({ path, thumb, name });
    }

    for (const [whichGallery, imageObjs] of gallery) {
      await SDHubGalleryGetNewImage(whichGallery, imageObjs);
    }

  } catch (err) {
    console.error('Error fetching new images:', err);
  }
}

async function SDHubGalleryGetNewImage(whichGallery, imagesToAdd = []) {
  const g = (id) => document.getElementById(id),
  box = g('SDHub-Gallery-imgBox'),
  tabMap = new Map();

  for (let { path, thumb, name } of imagesToAdd) {
    const grid = path.includes('grid-'),
    prefix = whichGallery.split('_')[0],
    whichTab = whichGallery === 'extras_gallery' ? 'extras-images' : grid ? `${prefix}-grids` : `${prefix}-images`,

    imgBox = box.cloneNode(true);
    imgBox.removeAttribute('id');
    SDHubGalleryImageButtonEvents(imgBox);

    if (!tabMap.has(whichTab)) tabMap.set(whichTab, []);
    tabMap.get(whichTab).push({ imgBox, path, thumb, name });
  }

  const tabs = SDHubGalleryTabList,
  tabSorted = [...tabMap.keys()].sort((a, b) => {
    const ai = tabs.indexOf(a), bi = tabs.indexOf(b);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });

  for (const tabName of tabSorted) {
    const images = tabMap.get(tabName),
    TabRow = g('SDHub-Gallery-Tab-Button-Row'),
    TabBtn = g(`SDHub-Gallery-${tabName}-Tab-Button`),
    TabCon = g(`SDHub-Gallery-${tabName}-Tab-Container`),
    wrapper = TabCon.querySelector(`.${SDHubVar.page}-wrapper`),
    imageBoxes = [];

    let loaded = 0, selectedTab = false;

    for (const { imgBox, path, thumb, name } of images) {
      const img = imgBox.querySelector('img'),
      nameBox = imgBox.querySelector('.sdhub-gallery-img-name'),
      named = decodeURIComponent(name);
      nameBox && (nameBox.textContent = named);

      if (img) {
        img.loading = 'lazy';
        img.dataset.image = path;
        img.title = named;

        const imgThumb = new Image();
        imgThumb.src = thumb;
        imgThumb.onload = () => {
          img.src = thumb;
          ++loaded === images.length && SDHubGalleryTabImageCounters();
        };
      }

      imageBoxes.push(imgBox);
    }

    const totalPages = SDHubGalleryCreateImagePages(wrapper, imageBoxes);

    TabRow.classList.add(SDHubVar.style);
    TabBtn.style.display = 'flex';

    if (!selectedTab && !document.querySelector('.sdhub-gallery-tab-container.active')) {
      TabCon.classList.add('active');
      TabBtn.classList.add('selected');
      TabCon.style.display = 'flex';
      selectedTab = true;
    }

    SDHubGallerySwitchPage(tabName, null, totalPages - 1);
  }
}