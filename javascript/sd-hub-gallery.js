let SDHubGalleryImageDataCache = new DataTransfer();
let SDHubGalleryFetchTimeout = null;
let SDHubGalleryLastFetch = 0;
let SDHubGalleryTabImageIndex = 1;
let SDHubGalleryCMHover = null;
let SDHubGalleryCMRightClick = false;

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
  SDHubGalleryDebouncingFetch();
});

onUiTabChange(function() {
  let MainTab = gradioApp().querySelector('#tabs > .tab-nav > button.selected');
  if (MainTab && (MainTab.textContent.trim() === 'HUB')) {
    SDHubGalleryFetchList('/sd-hub-gallery-list');
  }
});

function SDHubGalleryFetchImage(images) {
  let imgDiv = document.querySelector('#sdhub-imgdiv-0');
  let loadedThumbnails = 0;
  let totalThumbnails = images.length;
  let updatedTabs = new Set();

  const processThumbnail = async (index) => {
    if (index >= totalThumbnails) return;

    const { path, thumb } = images[index];
    const whichTab = SDHubGalleryTabList.find((tab) => path.includes(`/${tab}/`));

    if (whichTab) {
      const TabDiv = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
      const TabBtn = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);

      if (imgDiv && TabDiv) {
        TabDiv.style.filter = 'brightness(0.8) blur(10px)';
        updatedTabs.add(TabDiv);

        const newImgDiv = imgDiv.cloneNode(true);
        let newId = `sdhub-imgdiv-${SDHubGalleryTabImageIndex}`;

        while (document.getElementById(newId)) {
          SDHubGalleryTabImageIndex++;
          newId = `sdhub-imgdiv-${SDHubGalleryTabImageIndex}`;
        }

        newImgDiv.id = newId;
        const img = newImgDiv.querySelector('img');

        if (img) {
          img.src = thumb;
          img.onload = () => {
            loadedThumbnails++;
            if (loadedThumbnails === totalThumbnails) {
              console.log('all-loaded');
              updatedTabs.forEach((tab) => (tab.style.filter = 'none'));
            }
          };

          fetch(path)
            .then(response => response.blob())
            .then(blob => {
              const mimeType = blob.type;
              img.fileObject = new File([blob], `image.${mimeType.split('/')[1]}`, { type: mimeType });
              img.setAttribute('data-path', path);
            })
            .catch(error => console.error('Error fetching:', error));
        }

        TabDiv.prepend(newImgDiv);
        if (TabBtn) TabBtn.style.display = 'flex';
        SDHubGalleryTabImageIndex++;
      }
    }

    requestAnimationFrame(() => processThumbnail(index + 1));
  };

  processThumbnail(0);

  for (let i = 0; i < SDHubGalleryTabList.length; i++) {
    let TabBtn = document.getElementById(`sdhub-gallery-${SDHubGalleryTabList[i]}-tab-button`);
    let TabDiv = document.getElementById(`sdhub-gallery-${SDHubGalleryTabList[i]}-tab-div`);
    if (TabBtn && TabDiv) {
      TabBtn.classList.add('selected');
      TabDiv.classList.add('active');
      TabDiv.style.display = 'flex';
      break;
    }
  }
}

function SDHubGalleryFetchList(r) {
  fetch(r)
    .then(response => response.json())
    .then(data => data.images?.length && SDHubGalleryFetchImage(data.images))
    .catch(console.error);
}

function SDHubGalleryDebouncingFetch() {
  const now = Date.now();
  const oneMnt = 60 * 1000;

  if (SDHubGalleryFetchTimeout) {
    return;
  }

  if (now - SDHubGalleryLastFetch < oneMnt) {
    const remainingTime = oneMnt - (now - SDHubGalleryLastFetch);
    SDHubGalleryFetchTimeout = setTimeout(() => {
      SDHubGalleryFetchList('/sd-hub-gallery-list');
      SDHubGalleryLastFetch = Date.now();
      SDHubGalleryFetchTimeout = null;
    }, remainingTime);
    return;
  }

  SDHubGalleryFetchList('/sd-hub-gallery-list');
  SDHubGalleryLastFetch = now;
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

  const Btn = document.createElement('button');
  Btn.id = 'sdhub-gallery-img-button';
  Btn.innerHTML = SDHubGalleryImageButtonSVG;

  const eFrame = document.createElement('div');
  eFrame.id = 'sdhub-gallery-empty-frame';

  imgWrap.append(img, Btn, eFrame);
  imgCOn.append(imgWrap);
  imgDiv.append(imgCOn);
  GalleryTab.prepend(TabRow, imgDiv);

  SDHubGalleryFetchList('/sd-hub-gallery-initial');
  document.getElementById('SDHub-Gallery-ContextMenu').style.display = 'block';
}

function SDHubGalleryEventListener(TabDiv) {
  TabDiv.addEventListener('click', (e) => {
    const imgEL = e.target.closest('img');
    if (!imgEL || !TabDiv.contains(imgEL)) return;
    SDHubGalleryImageInfo(imgEL, e);
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
    const CMVisible = GalleryCM.style.opacity === '1';
    const ClickOutsideEL = !GalleryCM.contains(e.target);
    const Btn = e.target.closest('#sdhub-gallery-img-button');
    if (CMVisible && ClickOutsideEL && !Btn) SDHubGalleryCMRightClick = false; SDHubGalleryKillContextMenu();
  });

  document.addEventListener('contextmenu', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM && GalleryCM.contains(e.target)) e.preventDefault();
  });
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
  const tabDiv = imgEL.closest('.sdhub-gallery-tab-div');

  window.SDHubImagePath = imgEL.getAttribute('data-path');
  window.SDHubImageList = [...tabDiv.querySelectorAll('img')].map(img => img.getAttribute('data-path'));
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

    case 'download': {
      const name = decodeURIComponent(imagePath.split('/').pop());
      const link = document.createElement('a');
      link.href = imagePath;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      break;
    }

    case 'info': {
      const imgEL = document.querySelector(`img[data-path="${imagePath}"]`);
      if (imgEL) SDHubGalleryImageInfo(imgEL, new Event('click'));
      break;
    }

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
  const imgEL = document.querySelector(`img[data-path="${window.SDHubImagePath}"]`);
  const path = decodeURIComponent(window.SDHubImagePath).replace(/^\/sd-hub-gallery\/image/, '');
  const thumb = decodeURIComponent(imgEL.src).replace(/^.*\/sd-hub-gallery\/thumb/, '').replace(/^\//, '');
  const name = decodeURIComponent(window.SDHubImagePath.split('/').pop());

  const Con = document.getElementById('SDHub-Gallery-Delete-Container');
  Con.style.display = 'flex';
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  const Box = document.getElementById('SDHub-Gallery-Delete-Box');
  const Text = document.getElementById('SDHub-Gallery-Delete-Text');
  Text.textContent = `Delete ${name}?`;

  const Yes = document.getElementById('SDHub-Gallery-Delete-Yes');
  const No = document.getElementById('SDHub-Gallery-Delete-No');

  Yes.onclick = () => {
    Box.style.transform = '';
    Spinner.style.opacity = '1';

    fetch('/sd-hub-gallery-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, thumb }),
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
        }, 1000);
        setTimeout(() => Con.style.display = '', 1100);
      });
  };

  No.onclick = () => {
    Box.style.transform = '';
    Con.style.opacity = '';
    setTimeout(() => Con.style.display = '', 200);
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
  window.SDHubImagePath = imgEL.getAttribute('data-path');

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
  let row = document.querySelector('#sdhub-gallery-image-info-row');
  let SendButton = document.querySelector('#SDHubimgInfoSendButton');
  let Cloned = document.querySelector('#sd-hub-gallery-image-info-clear-button');
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
      setTimeout(() => {
        ClearButton.click();
        row.style.display = 'none';
        document.removeEventListener('keydown', RowKeydown);
        document.removeEventListener('click', SendButtonClick);
      }, 200);
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeRow();
    });

    const RowKeydown = (e) => {
      if (e.key === 'Escape' && row && window.getComputedStyle(row).display === 'flex') {
        const LightBox = document.querySelector('#SDHub-Gallery-Image-Viewer');
        if (LightBox && window.getComputedStyle(LightBox).display === 'flex') return;
        else e.stopPropagation(); e.preventDefault(); closeRow();
      }
    };

    const SendButtonClick = (e) => {
      if (SendButton && SendButton.contains(e.target)) {
        e.stopPropagation();
        e.preventDefault();
        let btn = e.target.closest('button');
        if (btn) {
          closeRow();
        }
      }
    };

    document.addEventListener('keydown', RowKeydown);
    document.addEventListener('click', SendButtonClick);
  }
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

  const NextBtn = document.createElement('button');
  NextBtn.id = 'SDHub-Gallery-Image-Viewer-Next-Button';
  NextBtn.classList.add('sdhub-gallery-image-viewer-button');
  NextBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
      width="32px" height="32px" viewBox="0 0 24 24">
      <path
        d="M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1
        1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886z"/>
    </svg>
  `;
  NextBtn.onclick = (e) => {
    e.stopPropagation();
    SDHubGalleryNextImage();
  };

  const PrevBtn = document.createElement('button');
  PrevBtn.id = 'SDHub-Gallery-Image-Viewer-Prev-Button';
  PrevBtn.classList.add('sdhub-gallery-image-viewer-button');
  PrevBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
      width="32px" height="32px" viewBox="0 0 24 24">
      <path
        d="m4.431 12.822 13 9A1 1 0 0 0 19 21V3a1
        1 0 0 0-1.569-.823l-13 9a1.003 1.003 0 0 0 0 1.645z"/>
    </svg>
  `;
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

  const CloseBtn = document.createElement('button');
  CloseBtn.id = 'SDHub-Gallery-Image-Viewer-Close-Button';
  CloseBtn.classList.add('sdhub-gallery-image-viewer-button');
  CloseBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
      width="32px" height="32px" viewBox="0 0 512 512">
      <path fill="currentColor" d="M330.443 256l136.765-136.765c14.058-14.058 14.058-36.85
        0-50.908l-23.535-23.535c-14.058-14.058-36.85-14.058-50.908 0L256 181.557L119.235
        44.792c-14.058-14.058-36.85-14.058-50.908 0L44.792 68.327c-14.058 14.058-14.058
        36.85 0 50.908L181.557 256L44.792 392.765c-14.058 14.058-14.058 36.85 0 50.908l23.535
        23.535c14.058 14.058 36.85 14.058 50.908 0L256 330.443l136.765 136.765c14.058 14.058
        36.85 14.058 50.908 0l23.535-23.535c14.058-14.058 14.058-36.85 0-50.908L330.443 256z"/>
    </svg>
  `;

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

  const Yes = document.createElement('button');
  Yes.id = 'SDHub-Gallery-Delete-Yes';
  Yes.classList.add('sdhub-gallery-delete-button');
  Yes.textContent = 'Yes';

  const No = document.createElement('button');
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

var SDHubGalleryImageButtonSVG = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
    width='30px' height='30px'>
    <path d='M4 6H20M4 12H20M4 18H20' stroke='currentColor' stroke-width='2'
      stroke-linecap='round' stroke-linejoin='round'/>
  </svg>
`;

var SDHubGalleryDLSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns='http://www.w3.org/2000/svg'
    width='32' height='32' viewBox='0 0 32 32'>
    <path fill='currentColor' stroke='currentColor' stroke-width='1.8'
      d='M26 24v4H6v-4H4v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4zm0-10
      l-1.41-1.41L17 20.17V2h-2v18.17l-7.59-7.58L6 14l10 10l10-10z'/>
  </svg>
`;

var SDHubGalleryARRSVG = `
  <svg class='sdhub-gallery-cm-svg submenu-arrow' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="arcs">
    <path d="M9 18l6-6-6-6"/>
  </svg>
`;

var SDHubGalleryImageSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="transparent"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.85)">
    <rect x="0.802" y="0.846" width="22.352" height="22.352" rx="2" ry="2"/>
    <circle cx="7.632" cy="7.676" r="1.862"/>
    <polyline points="23.154 15.747 16.946 9.539 3.285 23.198"/>
  </svg>
`;

var SDHubGalleryImageInfoSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
    <path d="M7 9H17M7 13H17M21 20L17.6757 18.3378C17.4237 18.2118 17.2977 18.1488 17.1656 18.1044C17.0484
      18.065 16.9277 18.0365 16.8052 18.0193C16.6672 18 16.5263 18 16.2446 18H6.2C5.07989 18 4.51984 18 4.09202
      17.782C3.71569 17.5903 3.40973 17.2843 3.21799 16.908C3 16.4802 3 15.9201 3 14.8V7.2C3 6.07989 3 5.51984
      3.21799 5.09202C3.40973 4.71569 3.71569 4.40973 4.09202 4.21799C4.51984 4 5.0799 4 6.2 4H17.8C18.9201 4
      19.4802 4 19.908 4.21799C20.2843 4.40973 20.5903 4.71569 20.782 5.09202C21 5.51984 21 6.0799 21 7.2V20Z"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

var SDHubGalleryOpenNewTabSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none" >
    <path d="M20 4L12 12M20 4V8.5M20 4H15.5M19 12.5V16.8C19 17.9201 19 18.4802 18.782 18.908C18.5903 19.2843 18.2843 19.5903
      17.908 19.782C17.4802 20 16.9201 20 15.8 20H7.2C6.0799 20 5.51984 20 5.09202 19.782C4.71569 19.5903 4.40973 19.2843 4.21799
      18.908C4 18.4802 4 17.9201 4 16.8V8.2C4 7.0799 4 6.51984 4.21799 6.09202C4.40973 5.71569 4.71569 5.40973 5.09202 5.21799C5.51984
      5 6.07989 5 7.2 5H11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

var SDHubGallerySendToSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="32px" height="32px" viewBox="0 0 16 16" transform="scale(0.8)">
    <path d="M0 0h4v4H0V0zm0 6h4v4H0V6zm0 6h4v4H0v-4zM6 0h4v4H6V0zm0 6h4v4H6V6zm0 6h4v4H6v-4zm6-12h4v4h-4V0zm0 6h4v4h-4V6zm0 6h4v4h-4v-4z" fill-rule="evenodd"/>
  </svg>
`;

var SDHubGalleryDeleteSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
    <path d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132
      14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013
      8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854
      19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354
      20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

var SDHubGallerySpinnerSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100" height="100">
    <g>
      <animateTransform
        attributeType="XML"
        attributeName="transform"
        type="rotate"
        values="360 24 24;0 24 24"
        dur="1s"
        repeatCount="indefinite"/>
      <path fill="currentColor"
        d="M8,24c0-8.8,7.2-16,16-16c1,0,2,0.1,3,0.3l0.7-3.9C26.5,4.1,25.3,4,24,4C12.9,4,4,13,4,24
        c0,4.8,1.7,9.5,4.8,13.1l3-2.6C9.5,31.6,8,28,8,24z"/>
      <path fill="currentColor"
        d="M39.5,11.3l-3.1,2.5C38.6,16.6,40,20.1,40,24c0,8.8-7.2,16-16,16c-1,0-2-0.1-3-0.3l-0.7,3.8
        c1.3,0.2,2.5,0.3,3.7,0.3c11.1,0,20-8.9,20-20C44,19.4,42.4,14.8,39.5,11.3z"/>
      <polygon fill="currentColor" points="31,7 44,8.7 33.3,19"/>
      <polygon fill="currentColor" points="17,41 4,39.3 14.7,29"/>
    </g>
  </svg>
`;
