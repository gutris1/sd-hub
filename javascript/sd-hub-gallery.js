let SDHubGalleryImageDataCache = new DataTransfer();
let SDHubGalleryFetchTimeout = null;
let SDHubGalleryLastFetch = 0;
let SDHubGalleryTabImageIndex = 1;
let SDHubGalleryCMHover = null;
let SDHubGalleryCMRightClick = false;
let SDHubGalleryNewImageSrc = new Set();

const SDHubGalleryTabList = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids'
];

onUiLoaded(function () {
  let GalleryTab = document.querySelector('#sdhub-gallery-tab');
  if (GalleryTab) SDHubCreateGallery(GalleryTab);
});

onAfterUiUpdate(function() {
  SDHubGalleryWatchNewImage();
});

function SDHubGalleryLoadInitial() {
  fetch('/sd-hub-gallery-initial')
    .then(response => response.json())
    .then(data => {
      if (!data.images?.length) return;

      let imgDiv = document.querySelector('#sdhub-imgdiv-0');
      let loaded = 0;
      let total = data.images.length;
      let selectedTab = false;
      const today = /^\d{4}-\d{2}-\d{2}$/;

      document.querySelectorAll('[id^="sdhub-gallery-"][id$="-tab-div"]').forEach(tab => {
        if (tab.classList.contains('active') && tab.style.display === 'flex') {
          selectedTab = true;
        }
      });

      const processImage = async (index) => {
        if (index >= total) return;

        let { path } = data.images[index];
        let whichTab = SDHubGalleryTabList.find((tab) => path.includes(`/${tab}/`));

        let tabToUse = whichTab || 'extras-images';
        let pathParts = path.split("/");
        let parentFolder = pathParts[pathParts.length - 2];

        if (!whichTab) {
          if (path.includes('?extras')) {
            tabToUse = 'extras-images';
          } else if (today.test(parentFolder)) {
            tabToUse = parentFolder;
            if (!document.getElementById(`sdhub-gallery-${tabToUse}-tab-div`)) {
              SDHubGalleryCloneTab(tabToUse, parentFolder);
            }
          }
        }

        const TabDiv = document.getElementById(`sdhub-gallery-${tabToUse}-tab-div`);
        const TabBtn = document.getElementById(`sdhub-gallery-${tabToUse}-tab-button`);

        if (imgDiv && TabDiv) {
          const newImgDiv = imgDiv.cloneNode(true);
          const fn = path.substring(path.lastIndexOf("/") + 1).split("?")[0];
          let newId = `sdhub-imgdiv-${SDHubGalleryTabImageIndex}`;

          while (document.getElementById(newId)) {
            SDHubGalleryTabImageIndex++;
            newId = `sdhub-imgdiv-${SDHubGalleryTabImageIndex}`;
          }

          newImgDiv.id = newId;
          const img = newImgDiv.querySelector('img');

          if (img) {
            img.src = path;
            img.onload = () => {
              img.title = fn;
              loaded++;
              if (loaded === total) {
                console.log('all-loaded');
              }
            };

            fetch(path.split('?')[0])
              .then(response => response.blob())
              .then(blob => {
                const mimeType = blob.type;
                img.fileObject = new File([blob], `image.${mimeType.split('/')[1]}`, { type: mimeType });
              })
              .catch(error => console.error('Error fetching:', error));
          }

          TabDiv.prepend(newImgDiv);
          if (TabBtn) TabBtn.style.display = 'flex';
          SDHubGalleryTabImageIndex++;

          if (!selectedTab) {
            TabDiv.classList.add('active');
            TabDiv.style.display = 'flex';
            TabBtn.classList.add('selected');
            selectedTab = true;
          }
        }

        requestAnimationFrame(() => processImage(index + 1));
      };

      processImage(0);
    })
    .catch(console.error);
}

function SDHubGalleryCloneTab(id, name) {
  const TabRow = document.getElementById('sdhub-gallery-tab-button-row');
  const GalleryTab = document.getElementById('sdhub-gallery-tab');

  let exTabBtn = document.querySelector('.sdhub-gallery-tab-button:not(.selected)');
  let TabBtn = exTabBtn.cloneNode(true);
  TabBtn.id = `sdhub-gallery-${id}-tab-button`;
  TabBtn.textContent = name;
  TabBtn.style.display = 'flex';
  TabBtn.addEventListener('click', () => SDHubGallerySwitchTab(id));
  TabRow.append(TabBtn);

  let exTabDiv = document.querySelector('.sdhub-gallery-tab-div:not(.active)');
  let TabDiv = exTabDiv.cloneNode(false);
  TabDiv.id = `sdhub-gallery-${id}-tab-div`;
  TabDiv.style.display = 'none';
  GalleryTab.append(TabDiv);
  SDHubGalleryEventListener(TabDiv);

  if (!SDHubGalleryTabList.includes(id)) {
    SDHubGalleryTabList.push(id);
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

      const path = src.split('/file=')[1].split('?')[0];
      const key = `${whichGallery}-${path}`;

      if (!SDHubGalleryNewImageSrc.has(key)) {
        New = true;
        SDHubGalleryNewImageSrc.add(key);
      }
    });

    if (New) SDHubGalleryGetNewImage(whichGallery);
  });
}

function SDHubGalleryGetNewImage(whichGallery) {
  let imgDiv = document.querySelector('#sdhub-imgdiv-0');
  let loaded = 0;
  let selectedTab = false;

  document.querySelectorAll('[id^="sdhub-gallery-"][id$="-tab-div"]').forEach(tab => {
    if (tab.classList.contains('active') && tab.style.display === 'flex') selectedTab = true;
  });

  let img = document.querySelectorAll(`#${whichGallery} > .preview > .thumbnails img`);
  if (img.length === 0) return;

  const processImage = async (index) => {
    if (index >= img.length) return;

    const imgEL = img[index];
    let src = imgEL.getAttribute('src');
    if (!src || !src.includes('/file=')) return;

    let imgSrc = src.split('/file=')[1].split('?')[0];
    let path = `/sd-hub-gallery/image${imgSrc}`;
    let whichTab;

    if (whichGallery === 'extras_gallery') {
      whichTab = 'extras-images';
    } else {
      const base = whichGallery.split('_')[0];
      whichTab = imgSrc.includes('grid') 
        ? `${base}-grids` 
        : `${base}-images`;
    }

    const TabDiv = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
    const TabBtn = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);

    if (imgDiv && TabDiv) {
      const newImgDiv = imgDiv.cloneNode(true);
      const fn = path.substring(path.lastIndexOf("/") + 1).split("?")[0];
      let newId = `sdhub-imgdiv-${SDHubGalleryTabImageIndex}`;

      while (document.getElementById(newId)) {
        SDHubGalleryTabImageIndex++;
        newId = `sdhub-imgdiv-${SDHubGalleryTabImageIndex}`;
      }

      newImgDiv.id = newId;
      const newImg = newImgDiv.querySelector('img');

      if (newImg) {
        newImg.src = path;
        newImg.onload = () => {
          newImg.title = fn;
          loaded++;
          if (loaded === img.length) {
            console.log('all-loaded.');
          }

          fetch(path)
            .then(response => response.blob())
            .then(blob => {
              const mimeType = blob.type;
              newImg.fileObject = new File([blob], `image.${mimeType.split('/')[1]}`, { type: mimeType });
            })
            .catch(error => console.error('Error fetching:', error));
        };
      }

      TabDiv.prepend(newImgDiv);
      if (TabBtn) TabBtn.style.display = 'flex';
      SDHubGalleryTabImageIndex++;

      if (!selectedTab) {
        TabDiv.classList.add('active');
        TabDiv.style.display = 'flex';
        TabBtn.classList.add('selected');
        selectedTab = true;
      }
    }

    requestAnimationFrame(() => processImage(index + 1));
  };

  processImage(0);
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
  const tabDiv = imgEL.closest('.sdhub-gallery-tab-div');

  window.SDHubImagePath = imgEL.getAttribute('src');
  window.SDHubImageList = [...tabDiv.querySelectorAll('img')].map(img => img.getAttribute('src'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);

  GalleryCM.targetFile = imgEL.fileObject;

  Object.assign(GalleryCM.style, {
    transition: 'none',
    left: '',
    right: '',
    top: '',
    bottom: '',
    opacity: '',
    pointerEvents: 'none',
    transform: 'scale(0)',
    visibility: 'hidden',
  });

  GalleryCM.style.position = 'fixed';
  GalleryCM.style.visibility = 'visible';

  const menuWidth = GalleryCM.offsetWidth;
  const menuHeight = GalleryCM.offsetHeight;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  const cursorX = e.clientX;
  const cursorY = e.clientY;

  const spaceRight = viewportWidth - cursorX;
  const spaceBelow = viewportHeight - cursorY;

  let posX;
  let originX;
  if (spaceRight >= menuWidth) {
    posX = cursorX;
    originX = 'left';
  } else {
    posX = cursorX - menuWidth;
    originX = 'right';
  }

  let posY;
  let originY;
  if (spaceBelow >= menuHeight) {
    posY = cursorY;
    originY = 'top';
  } else {
    posY = cursorY - menuHeight;
    originY = 'bottom';
  }

  GalleryCM.style.position = 'fixed';
  GalleryCM.style.left = `${posX}px`;
  GalleryCM.style.top = `${posY}px`;

  const bounds = GalleryCM.getBoundingClientRect();

  if (bounds.right > viewportWidth) {
    GalleryCM.style.left = `${viewportWidth - menuWidth - 5}px`;
  }
  if (bounds.left < 0) {
    GalleryCM.style.left = '5px';
  }
  if (bounds.bottom > viewportHeight) {
    GalleryCM.style.top = `${viewportHeight - menuHeight - 5}px`;
  }
  if (bounds.top < 0) {
    GalleryCM.style.top = '5px';
  }

  GalleryCM.style.pointerEvents = 'auto';
  GalleryCM.style.transformOrigin = `${originY} ${originX}`;

  requestAnimationFrame(() => {
    Object.assign(GalleryCM.style, {
      transition: '',
      transform: 'scale(1)',
      opacity: '1',
    });

    setTimeout(() => SDHubGallerySubmenu(), 200);
  });
}

function SDHubGallerySubmenu() {
  const submenu = document.querySelector('.sdhub-cm-submenu');
  const ul = document.querySelector('.sdhub-cm-submenu > ul');
  const sendToButton = document.querySelector('.sdhub-cm-sendto');

  if (!submenu || !sendToButton) return;

  const menuWidth = submenu.offsetWidth;
  const menuHeight = submenu.offsetHeight;
  const buttonRect = sendToButton.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const spaceOnRight = windowWidth - buttonRect.right;
  const spaceBelow = windowHeight - buttonRect.bottom;

  submenu.style.left = 'auto';
  submenu.style.right = 'auto';

  ul.style.marginLeft = '0';
  ul.style.marginRight = '0';

  let X, Y;

  if (spaceOnRight >= menuWidth) {
    submenu.style.left = '100%';
    ul.style.marginLeft = '10px';
    X = 'left';
  } else {
    submenu.style.right = '100%';
    ul.style.marginRight = '10px';
    X = 'right';
  }

  if (spaceBelow < menuHeight) {
    submenu.style.top = `-${menuHeight - 30}px`;
    Y = 'bottom';
  } else {
    submenu.style.top = '0';
    Y = 'top';
  }

  submenu.style.transformOrigin = `${Y} ${X}`;
}

function SDHubGalleryKillContextMenu() {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');

  Object.assign(GalleryCM.style, {
    transition: 'none',
    opacity: '',
    pointerEvents: '',
    transform: '',
  });
}

function SDHubGalleryContextButton(v) {
  const imagePath = window.SDHubImagePath;

  switch (v) {
    case 'open':
      window.open(imagePath, '_blank');
      break;

    case 'download':
      const name = decodeURIComponent(imagePath.split('/').pop());
      const link = document.createElement('a');
      link.href = imagePath;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      break;

    case 'info':
      const imgEL = document.querySelector(`img[src="${imagePath}"]`);
      if (imgEL) SDHubGalleryImageInfo(imgEL, new Event('click'));
      break;

    case 'viewer':
      SDHubGalleryImageViewer('m');
      break;

    case 'delete':
      SDHubGalleryDeletion();
      break;
  }

  SDHubGalleryKillContextMenu();
}

function SDHubGalleryDeletion() {
  const imgEL = document.querySelector(`img[src="${window.SDHubImagePath}"]`);
  const path = decodeURIComponent(window.SDHubImagePath).replace(/^\/sd-hub-gallery\/image/, '');
  const name = decodeURIComponent(window.SDHubImagePath.split('/').pop());

  const Con = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  const Box = document.getElementById('SDHub-Gallery-Delete-Box');
  const Text = document.getElementById('SDHub-Gallery-Delete-Text');
  const Yes = document.getElementById('SDHub-Gallery-Delete-Yes');
  const No = document.getElementById('SDHub-Gallery-Delete-No');

  Con.style.display = 'flex';
  Con.focus();
  Text.textContent = `Delete ${name}?`;
  document.body.classList.add('no-scroll');

  Yes.onclick = () => {
    Box.style.opacity = '0';
    Box.style.transform = 'scale(1.5)';
    Spinner.style.opacity = '1';

    fetch('/sd-hub-gallery-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(err => { throw new Error(err); });
        }
        return response.json();
      })
      .then(data => {
        if (data.status === 'deleted') {
          const parentDiv = imgEL.closest('.sdhub-gallery-img-div');
          if (parentDiv) parentDiv.remove();
        } else {
          console.error("Deletion failed:", data);
        }
      })
      .catch(error => console.error('Error deleting image:', error))
      .finally(() => {
        setTimeout(() => {
          Con.style.opacity = '';
          Spinner.style.opacity = '';
          document.body.classList.remove('no-scroll');
        }, 1000);
        setTimeout(() => {
          Con.style.display = '';
          Box.style.opacity = '';
          Box.style.transform = '';
        }, 1100);
      });
  };

  No.onclick = () => {
    Con.style.opacity = '';
    Box.style.transform = 'scale(1.5)';
    document.body.classList.remove('no-scroll');
    setTimeout(() => (Con.style.display = '', Box.style.transform = ''), 200);
  };

  setTimeout(() => Con.style.opacity = '1', 100);
  setTimeout(() => Box.style.transform = 'scale(1)', 200);
}

function SDHubGallerySendImage(v) {
  const file = document.getElementById('SDHub-Gallery-ContextMenu').targetFile;
  const input = document.querySelector('#SDHubimgInfoImage input');

  SDHubGalleryImageDataCache.items.clear();
  SDHubGalleryImageDataCache.items.add(file);
  input.files = SDHubGalleryImageDataCache.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));

  const check = setInterval(() => {
    const imgInfoRawOutput = gradioApp().querySelector('#SDHubimgInfoGenInfo textarea');

    if (imgInfoRawOutput && imgInfoRawOutput.value.trim() !== '') {
      clearInterval(check);

      switch (v) {
        case 'txt':
          document.querySelector('#SDHubimgInfoSendButton > #txt2img_tab')?.click();
          break;
        case 'img':
          document.querySelector('#SDHubimgInfoSendButton > #img2img_tab')?.click();
          break;
        case 'inpaint':
          document.querySelector('#SDHubimgInfoSendButton > #inpaint_tab')?.click();
          break;
        case 'extras':
          document.querySelector('#SDHubimgInfoSendButton > #extras_tab')?.click();
          break;
      }
    }
  }, 100);

  SDHubGalleryKillContextMenu();
}

function SDHubGallerySendToUploader() {
  const area = document.querySelector('#sdhub-uploader-inputs textarea');
  const base = '/sd-hub-gallery/image';
  const path = decodeURIComponent(window.SDHubImagePath.slice(base.length));

  area.value += area.value ? `\n${path}` : path;
  updateInput(area);
}

function SDHubGalleryImageInfo(imgEL, e) {
  document.body.classList.add('no-scroll');
  const row = document.querySelector('#sdhub-gallery-image-info-row');
  const input = document.querySelector('#SDHubimgInfoImage input');
  const file = imgEL.fileObject;
  window.SDHubImagePath = imgEL.getAttribute('src');

  if (file) {
    row.style.display = 'flex';
    SDHubGalleryImageDataCache.items.clear();
    SDHubGalleryImageDataCache.items.add(file);
    input.files = SDHubGalleryImageDataCache.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(() => (row.style.opacity = '1'), 500);
  }
}

function SDHubImageInfoClearButton() {
  let row = document.getElementById('sdhub-gallery-image-info-row');
  let SendButton = document.getElementById('SDHubimgInfoSendButton');
  let Cloned = document.getElementById('sd-hub-gallery-image-info-clear-button');
  let ClearButton = document.querySelector('#SDHubimgInfoImage button[aria-label="Clear"]') ||
                    document.querySelector('#SDHubimgInfoImage button[aria-label="Remove Image"]');

  if (ClearButton && !Cloned) {
    let parent = ClearButton.parentElement;

    let btn = ClearButton.cloneNode(true);
    btn.id = 'sd-hub-gallery-image-info-clear-button';
    btn.title = 'Close Image Info';
    btn.style.display = 'flex';

    parent.prepend(btn);

    const closeRow = () => {
      row.style.opacity = '';
      document.body.classList.remove('no-scroll');
      setTimeout(() => (ClearButton.click(), (row.style.display = 'none')), 200);
    };

    btn.onclick = (e) => (e.stopPropagation(), closeRow());
    window.SDHubCloseImageInfoRow = closeRow;
  }
}

function SDHubCreateGallery(GalleryTab) {
  const TabRow = document.createElement('div');
  TabRow.id = 'sdhub-gallery-tab-button-row';

  const btnClass = ['lg', 'primary', 'gradio-button', 'svelte-cmf5ev', 'sdhub-gallery-tab-button'];

  SDHubGalleryTabList.forEach(whichTab => {
    let btnTitle = whichTab.includes('grids') 
      ? whichTab 
      : whichTab.split('-')[0].toLowerCase();

    const TabBtn = document.createElement('button');
    TabBtn.id = `sdhub-gallery-${whichTab}-tab-button`;
    TabBtn.classList.add(...btnClass);
    TabBtn.textContent = btnTitle;
    TabBtn.addEventListener('click', () => SDHubGallerySwitchTab(whichTab));

    const TabDiv = document.createElement('div');
    TabDiv.id = `sdhub-gallery-${whichTab}-tab-div`;
    TabDiv.classList.add('sdhub-gallery-tab-div');

    TabRow.append(TabBtn);
    GalleryTab.append(TabDiv);
    SDHubGalleryEventListener(TabDiv);
  });

  const imgDiv = document.createElement('div');
  imgDiv.id = 'sdhub-imgdiv-0';
  imgDiv.classList.add('sdhub-gallery-img-div');

  const imgCOn = document.createElement('div');
  imgCOn.id = 'sdhub-imgCon';

  const imgWrap = document.createElement('div');
  imgWrap.id = 'sdhub-gallery-img-wrapper';

  const img = document.createElement('img');
  img.id = 'sdhub-gallery-img';

  const ContextBtn = document.createElement('span');
  ContextBtn.id = 'sdhub-gallery-img-button';
  ContextBtn.innerHTML = SDHubGalleryImageButtonSVG;

  const ViewerBtn = document.createElement('span');
  ViewerBtn.id = 'sdhub-gallery-img-viewerbutton';
  ViewerBtn.title = 'image viewer';
  ViewerBtn.innerHTML = SDHubGalleryImageSVG;
  const ViewerBtnSVG = ViewerBtn.querySelector('svg');
  if (ViewerBtnSVG) ViewerBtnSVG.classList.remove('sdhub-gallery-cm-svg');

  const eFrame = document.createElement('div');
  eFrame.id = 'sdhub-gallery-empty-frame';

  imgWrap.append(img, ContextBtn, ViewerBtn, eFrame);
  imgCOn.append(imgWrap);
  imgDiv.append(imgCOn);
  GalleryTab.prepend(TabRow, imgDiv);

  SDHubGalleryLoadInitial()
  document.getElementById('SDHub-Gallery-ContextMenu').style.display = 'block';
}

function SDHubGalleryEventListener(TabDiv) {
  TabDiv.addEventListener('click', (e) => {
    const imgEL = e.target.closest('img');
    const viewerBtn = e.target.closest('#sdhub-gallery-img-viewerbutton');
  
    if (imgEL) SDHubGalleryImageInfo(imgEL, e);
  
    if (viewerBtn) {
      const img = viewerBtn.closest('#sdhub-gallery-img-wrapper')?.querySelector('img');
      if (img) SDHubGalleryOpenViewerFromButton(img);
    }
  });  

  TabDiv.addEventListener('mouseenter', (e) => {
    const Btn = e.target.closest('#sdhub-gallery-img-button');
    if (!Btn) return;

    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM.style.opacity === '1' && GalleryCM.dataset.targetBtn === Btn) return;

    SDHubGalleryCMHover = setTimeout(() => {
      if (document.querySelector('#sdhub-gallery-img-button:hover')) {
        const imgEL = Btn.closest('#sdhub-gallery-img-wrapper')?.querySelector('img');
        if (imgEL) {
          SDHubGalleryCMRightClick = false;
          GalleryCM.dataset.targetBtn = Btn;
          SDHubGalleryContextMenu(e, imgEL);
        }
      }
    }, 300);
  }, true);

  TabDiv.addEventListener('mouseleave', (e) => {
    clearTimeout(SDHubGalleryCMHover);
    const BtnHover = document.querySelector("#sdhub-gallery-img-button:hover");
    const CMHover = document.querySelector("#SDHub-Gallery-ContextMenu:hover");
    if (!BtnHover && !CMHover && !SDHubGalleryCMRightClick) SDHubGalleryKillContextMenu();
  }, true);

  TabDiv.addEventListener('contextmenu', (e) => {
    const imgEL = e.target.closest('img');
    if (!imgEL || !TabDiv.contains(imgEL)) {
      SDHubGalleryKillContextMenu();
      return;
    }
    e.preventDefault();
    SDHubGalleryCMRightClick = true;
    SDHubGalleryContextMenu(e, imgEL);
  });

  document.addEventListener('click', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    const SendButton = document.getElementById('SDHubimgInfoSendButton');

    if (GalleryCM) {
      const CMVisible = GalleryCM.style.opacity === '1';
      const ClickOutsideEL = !GalleryCM.contains(e.target);
      const Btn = e.target.closest('#sdhub-gallery-img-button');
      if (CMVisible && ClickOutsideEL && !Btn) {
        SDHubGalleryCMRightClick = false;
        SDHubGalleryKillContextMenu();
      }
    }

    if (SendButton && SendButton.contains(e.target)) {
      e.stopPropagation(); e.preventDefault();
      const btn = e.target.closest('button');
      if (btn) window.SDHubCloseImageInfoRow();
    }
  });

  document.addEventListener('contextmenu', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM && GalleryCM.contains(e.target)) e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    const row = document.getElementById('sdhub-gallery-image-info-row');
    if (e.key === 'Escape' && row && window.getComputedStyle(row).display === 'flex') {
      const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
      if (LightBox && window.getComputedStyle(LightBox).display === 'flex') return;
      else e.stopPropagation(); e.preventDefault(); window.SDHubCloseImageInfoRow();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const css = 'file=extensions/sd-hub/styleGallery.css';
  const time = (Date.now() / 1000).toFixed(6);
  const file = `${css}?${time}`;

  if (document.querySelector(`link[href^='${css}']`)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.setAttribute('property', 'stylesheet');
  link.href = file;

  document.body.insertBefore(link, document.body.querySelector('style'));

  const SDHubGallery = document.createElement('div');
  SDHubGallery.id = 'SDHubGallery';

  SDHubGallery.append(
    SDHubGalleryCreateContextMenu(),
    SDHubGalleryCreateLightBox(),
    SDHubGalleryCreateDeleteBox()
  );

  document.body.append(SDHubGallery);
});

function SDHubGalleryCreateContextMenu() {
  const GalleryCM = document.createElement('div');
  GalleryCM.id = 'SDHub-Gallery-ContextMenu';
  GalleryCM.classList.add('sdhub-gallery-contextmenu');
  GalleryCM.style.display = 'none';
  GalleryCM.innerHTML = `
    <ul>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('open')">
        <span>${SDHubGalleryOpenNewTabSVG} Open image in new tab</span>
      </li>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('download')">
        <span>${SDHubGalleryDLSVG} Download</span>
      </li>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('info')">
        <span>${SDHubGalleryImageInfoSVG} Image Info</span>
      </li>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('viewer')">
        <span>${SDHubGalleryImageSVG} Image Viewer</span>
      </li>
      <li class='sdhub-cm-li sdhub-cm-sendto'>
        <span>${SDHubGallerySendToSVG} Send To... ${SDHubGalleryARRSVG}</span>
        <div id="sdhub-cm-sendto-menu" class="sdhub-cm-submenu sdhub-gallery-contextmenu">
          <ul>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('txt')">txt2img</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('img')">img2img</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('extras')">extras</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('inpaint')">inpaint</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendToUploader()">uploader</li>
          </ul>
        </div>
      </li>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('delete')">
        <span>${SDHubGalleryDeleteSVG} Delete</span>
      </li>
    </ul>
  `;

  document.addEventListener('wheel', (e) => {
    if (GalleryCM.style.opacity === '1' && !GalleryCM.contains(e.target)) {
      SDHubGalleryCMRightClick = false;
      SDHubGalleryKillContextMenu();
    }
  }, { passive: false });

  return GalleryCM;
}

function SDHubGalleryCreateLightBox() {
  const LightBox = document.createElement('div');
  LightBox.id = 'SDHub-Gallery-Image-Viewer';
  LightBox.setAttribute('tabindex', '0');
  LightBox.style.display = 'none';

  const Control = document.createElement('div');
  Control.id = 'SDHub-Gallery-Image-Viewer-control';

  const NextBtn = document.createElement('span');
  NextBtn.id = 'SDHub-Gallery-Image-Viewer-Next-Button';
  NextBtn.classList.add('sdhub-gallery-image-viewer-button');
  NextBtn.innerHTML = SDHubGalleryNextButtonSVG;
  NextBtn.onclick = (e) => {
    e.stopPropagation();
    SDHubGalleryNextImage();
  };

  const PrevBtn = document.createElement('span');
  PrevBtn.id = 'SDHub-Gallery-Image-Viewer-Prev-Button';
  PrevBtn.classList.add('sdhub-gallery-image-viewer-button');
  PrevBtn.innerHTML = SDHubGalleryPrevButtonSVG;
  PrevBtn.onclick = (e) => {
    e.stopPropagation();
    SDHubGalleryPrevImage();
  };

  document.addEventListener('keydown', (e) => {
    const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
    const NextBtn = document.getElementById('SDHub-Gallery-Image-Viewer-Next-Button');
    const PrevBtn = document.getElementById('SDHub-Gallery-Image-Viewer-Prev-Button');

    const isFlex = (el) => el && getComputedStyle(el).display === 'flex';

    if (e.key === 'Escape' && isFlex(LightBox)) {
      window.SDHubGalleryImageViewerCloseZoom();
      return;
    }

    if (!(isFlex(LightBox) && isFlex(NextBtn) && isFlex(PrevBtn))) return;

    switch (e.key) {
      case 'ArrowLeft':
        SDHubGalleryPrevImage();
        break;
      case 'ArrowRight':
        SDHubGalleryNextImage();
        break;
    }
  });

  const CloseBtn = document.createElement('span');
  CloseBtn.id = 'SDHub-Gallery-Image-Viewer-Close-Button';
  CloseBtn.classList.add('sdhub-gallery-image-viewer-button');
  CloseBtn.innerHTML = SDHubGalleryCloseButtonSVG;

  CloseBtn.onclick = (e) => {
    e.stopPropagation();
    window.SDHubGalleryImageViewerCloseZoom();
  };

  Control.append(NextBtn, PrevBtn, CloseBtn);
  LightBox.append(Control);

  return LightBox;
}

function SDHubGalleryCreateDeleteBox() {
  const Con = document.createElement('div');
  Con.id = 'SDHub-Gallery-Delete-Container';
  Con.setAttribute('tabindex', '0');
  Con.style.display = 'none';

  const Spinner = document.createElement('div');
  Spinner.id = 'SDHub-Gallery-Delete-Spinner';
  Spinner.innerHTML = SDHubGallerySpinnerSVG;

  const Box = document.createElement('div');
  Box.id = 'SDHub-Gallery-Delete-Box';

  const Text = document.createElement('p');
  Text.id = 'SDHub-Gallery-Delete-Text';
  Text.textContent = '';

  const ButtonRow = document.createElement('div');
  ButtonRow.id = 'SDHub-Gallery-Delete-ButtonRow';

  const Yes = document.createElement('span');
  Yes.id = 'SDHub-Gallery-Delete-Yes';
  Yes.classList.add('sdhub-gallery-delete-button');
  Yes.textContent = 'Yes';

  const No = document.createElement('span');
  No.id = 'SDHub-Gallery-Delete-No';
  No.classList.add('sdhub-gallery-delete-button');
  No.textContent = 'No';

  ButtonRow.append(Yes, No);
  Box.append(Text, ButtonRow);
  Con.append(Box, Spinner);

  document.addEventListener('keydown', (e) => {
    const Con = document.getElementById('SDHub-Gallery-Delete-Container');

    if (Con && getComputedStyle(Con).display === 'flex') {
      if (e.key.toLowerCase() === 'y') Yes.click();
      if (e.key.toLowerCase() === 'n') No.click();
    }
  });

  return Con;
}

function SDHubGallerySwitchTab(whichTab) {
  document.querySelectorAll('[id^="sdhub-gallery-"][id$="-tab-div"]').forEach(Tab => {
    Tab.style.display = 'none';
    Tab.classList.remove('active');
  });

  document.querySelectorAll('[id^="sdhub-gallery-"][id$="-tab-button"]').forEach(Btn => {
    Btn.classList.remove('selected');
  });

  const Tab = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
  if (Tab) {
    Tab.style.display = 'flex';
    Tab.classList.add('active');
  }

  const Btn = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);
  if (Btn) {
    Btn.classList.add('selected');
  }
}
