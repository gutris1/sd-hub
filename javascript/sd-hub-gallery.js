let dataCache = new DataTransfer();
let fetchTimeout = null;
let lastFetch = 0;
let DivIndex = 1;
let Hover = null;
let RightClick = false;

const Tabname = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids'
];

function SDHubGalleryFetchImage(images) {
  let imgDiv = document.querySelector('#sdhub-imgdiv-0');
  let loadedThumbnails = 0;
  let totalThumbnails = images.length;
  let updatedTabs = new Set();

  const processThumbnail = async (index) => {
    if (index >= totalThumbnails) return;

    const { path, thumb } = images[index];
    const whichTab = Tabname.find((tab) => path.includes(`/${tab}/`));

    if (whichTab) {
      const TabDiv = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
      const TabBtn = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);

      if (imgDiv && TabDiv) {
        TabDiv.style.filter = 'brightness(0.8) blur(10px)';
        updatedTabs.add(TabDiv);

        const newImgDiv = imgDiv.cloneNode(true);
        let newId = `sdhub-imgdiv-${DivIndex}`;

        while (document.getElementById(newId)) {
          DivIndex++;
          newId = `sdhub-imgdiv-${DivIndex}`;
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
        DivIndex++;
      }
    }

    requestAnimationFrame(() => processThumbnail(index + 1));
  };

  processThumbnail(0);

  for (let i = 0; i < Tabname.length; i++) {
    let TabBtn = document.getElementById(`sdhub-gallery-${Tabname[i]}-tab-button`);
    let TabDiv = document.getElementById(`sdhub-gallery-${Tabname[i]}-tab-div`);
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

function debouncingFetch() {
  const now = Date.now();
  const oneMnt = 60 * 1000;

  if (fetchTimeout) {
    return;
  }

  if (now - lastFetch < oneMnt) {
    const remainingTime = oneMnt - (now - lastFetch);
    fetchTimeout = setTimeout(() => {
      SDHubGalleryFetchList('/sd-hub-gallery-list');
      lastFetch = Date.now();
      fetchTimeout = null;
    }, remainingTime);
    return;
  }

  SDHubGalleryFetchList('/sd-hub-gallery-list');
  lastFetch = now;
}

onAfterUiUpdate(function() {
  debouncingFetch();
});

onUiTabChange(function() {
  let MainTab = gradioApp().querySelector('#tabs > .tab-nav > button.selected');
  if (MainTab && (MainTab.textContent.trim() === 'HUB')) {
    SDHubGalleryFetchList('/sd-hub-gallery-list');
  }
});

onUiLoaded(function () {
  let GalleryTab = document.querySelector('#sdhub-gallery-tab');
  if (GalleryTab) SDHubCreateGallery(GalleryTab);
});

var DLSVG = `
  <svg xmlns='http://www.w3.org/2000/svg'
    width='32' height='32' viewBox='0 0 32 32'>
    <path fill='currentColor' stroke='currentColor' stroke-width='1.8'
      d='M26 24v4H6v-4H4v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4zm0-10
      l-1.41-1.41L17 20.17V2h-2v18.17l-7.59-7.58L6 14l10 10l10-10z'/>
  </svg>
`;

var ARRSVG = `
  <svg class='ARRSVG' xmlns='http://www.w3.org/2000/svg' fill='currentColor'
    width='32px' height='32px' viewBox='0 0 24 24'>
    <path
      d='M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1
      1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886z'/>
  </svg>
`;

var ContextSVG = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
    width='30px' height='30px'>
    <path d='M4 6H20M4 12H20M4 18H20' stroke='currentColor' stroke-width='2'
      stroke-linecap='round' stroke-linejoin='round'/>
  </svg>
`;

var StaticImg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24"
    fill="transparent" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round">
    <rect x="0.802" y="0.846" width="22.352" height="22.352" rx="2" ry="2" style=""/>
    <circle cx="7.632" cy="7.676" r="1.862" style=""/>
    <polyline points="23.154 15.747 16.946 9.539 3.285 23.198" style=""/>
  </svg>
`;

function SDHubCreateGallery(GalleryTab) {
  const TabRow = document.createElement('div');
  TabRow.id = 'sdhub-gallery-tab-button-row';

  const btnClass = ['lg', 'primary', 'gradio-button', 'svelte-cmf5ev', 'sdhub-gallery-tab-button'];

  Tabname.forEach(whichTab => {
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
  Btn.innerHTML = ContextSVG;

  const eFrame = document.createElement('div');
  eFrame.id = 'sdhub-gallery-empty-frame';

  imgWrap.append(img, Btn, eFrame);
  imgCOn.append(imgWrap);
  imgDiv.append(imgCOn);
  GalleryTab.prepend(TabRow, imgDiv);

  SDHubGalleryFetchList('/sd-hub-gallery-initial');
}

function SDHubGalleryEventListener(TabDiv) {
  TabDiv.addEventListener('click', (e) => {
    const imgEL = e.target.closest('img');
    imgEL && SDHubGalleryImageInfo(imgEL, e);
  });

  TabDiv.addEventListener('mouseenter', (e) => {
    const Btn = e.target.closest('#sdhub-gallery-img-button');
    if (!Btn) return;

    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM.style.opacity === '1' && GalleryCM.dataset.targetBtn === Btn) return;

    Hover = setTimeout(() => {
      if (document.querySelector('#sdhub-gallery-img-button:hover')) {
        const imgEL = Btn.closest('#sdhub-gallery-img-wrapper')?.querySelector('img');
        if (imgEL) {
          RightClick = false;
          GalleryCM.dataset.targetBtn = Btn;
          SDHubGalleryContextMenu(e, imgEL);
        }
      }
    }, 300);
  }, true);

  TabDiv.addEventListener('mouseleave', (e) => {
    clearTimeout(Hover);
    const BtnHover = document.querySelector("#sdhub-gallery-img-button:hover");
    const CMHover = document.querySelector("#SDHub-Gallery-ContextMenu:hover");
    if (!BtnHover && !CMHover && !RightClick) SDHubGalleryKillContextMenu();
  }, true);

  TabDiv.addEventListener('contextmenu', (e) => {
    const imgEL = e.target.closest('img');
    imgEL
      ? (e.preventDefault(), RightClick = true, SDHubGalleryContextMenu(e, imgEL))
      : SDHubGalleryKillContextMenu();
  });

  document.addEventListener('click', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    const CMVisible = GalleryCM.style.opacity === '1';
    const ClickOutsideEL = !GalleryCM.contains(e.target);
    const Btn = e.target.closest('#sdhub-gallery-img-button');
    if (CMVisible && ClickOutsideEL && !Btn) RightClick = false; SDHubGalleryKillContextMenu();
  });

  document.addEventListener('contextmenu', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM && GalleryCM.contains(e.target)) e.preventDefault();
  });
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
  window.SDHubImagePath = imgEL.getAttribute('data-path');

  GalleryCM.targetFile = imgEL.fileObject;

  GalleryCM.style.transition = 'none';
  GalleryCM.style.left = '';
  GalleryCM.style.right = '';
  GalleryCM.style.opacity = '';
  GalleryCM.style.pointerEvents = 'none';
  GalleryCM.style.transform = 'scale(0)';

  const menuWidth = GalleryCM.offsetWidth;
  const menuHeight = GalleryCM.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const spaceOnRight = windowWidth - e.pageX;
  const spaceBelow = windowHeight - e.pageY;

  let X, Y;

  if (spaceOnRight >= menuWidth) {
    GalleryCM.style.left = `${e.pageX}px`;
    X = 'left';
  } else {
    GalleryCM.style.right = `${spaceOnRight}px`;
    X = 'right';
  }

  const top =
    e.pageY + menuHeight > windowHeight 
      ? e.pageY - menuHeight
      : e.pageY;

  if (top < e.pageY) {
    Y = 'bottom';
  } else {
    Y = 'top';
  }

  GalleryCM.style.top = `${top}px`;
  GalleryCM.style.pointerEvents = 'auto';
  GalleryCM.style.transformOrigin = `${Y} ${X}`;

  requestAnimationFrame(() => {
    GalleryCM.style.transition = '';
    GalleryCM.style.transform = 'scale(1)';
    GalleryCM.style.opacity = '1';
    setTimeout(() => {
      SDHubGallerySubmenu();
    }, 200);
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
  GalleryCM.style.transition = 'none';
  GalleryCM.style.transform = '';
  GalleryCM.style.opacity = '';
  GalleryCM.style.pointerEvents = '';
}

function SDHubGalleryDownloadImage() {
  const imagePath = window.SDHubImagePath;
  const filename = imagePath.substring(imagePath.lastIndexOf('/') + 1) || 'image.png';
  const link = document.createElement('a');
  link.href = imagePath;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  SDHubGalleryKillContextMenu();
}

function SDHubGalleryOpenImageInNewTab() {
  const imagePath = window.SDHubImagePath;
  window.open(imagePath, '_blank');
  SDHubGalleryKillContextMenu();
}

function SDHubGalleryDeleteImage() {
  const imagePath = window.SDHubImagePath;
  console.log('removed...', imagePath);
  SDHubGalleryKillContextMenu();
}

function SDHubGalleryViewerImage() {
  const imagePath = window.SDHubImagePath;
  SDHubGalleryImageViewer(imagePath);
  SDHubGalleryKillContextMenu();
}

function SDHubGallerySendImage(v) {
  const file = document.getElementById('SDHub-Gallery-ContextMenu').targetFile;
  const imgInput = document.querySelector('#SDHubimgInfoImage input');

  dataCache.items.clear();
  dataCache.items.add(file);
  imgInput.files = dataCache.files;
  imgInput.dispatchEvent(new Event('change', { bubbles: true }));

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
}

function SDHubGalleryImageInfo(imgEL, e) {
  document.body.classList.add('no-scroll');
  const row = document.querySelector('#sdhub-gallery-image-info-row');
  const input = document.querySelector('#SDHubimgInfoImage input');
  const file = imgEL.fileObject;
  window.SDHubImagePath = imgEL.getAttribute('data-path');

  if (file) {
    row.style.display = 'flex';
    dataCache.items.clear();
    dataCache.items.add(file);
    input.files = dataCache.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(() => (row.style.opacity = '1'), 100);
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

  const GalleryCM = document.createElement('div');
  GalleryCM.id = 'SDHub-Gallery-ContextMenu';
  GalleryCM.classList.add('sdhub-gallery-contextmenu');
  GalleryCM.innerHTML = `
    <ul>
      <li onclick='SDHubGalleryOpenImageInNewTab()'>
        <span class='sdhub-cm-OpenImageInNewTab'>${ContextSVG} Open image in new tab</span>
      </li>
      <li onclick='SDHubGalleryDownloadImage()'>
        <span class='sdhub-cm-OpenImageInNewTab'>${DLSVG} Download</span>
      </li>
      <li class='sdhub-cm-sendto'>
        <span class='sdhub-cm-OpenImageInNewTab'>${ContextSVG} Send To... ${ARRSVG}</span>
        <div id='sdhub-cm-sendto-menu' class='sdhub-cm-submenu sdhub-gallery-contextmenu'>
          <ul>
            <li onclick="SDHubGallerySendImage('txt')">txt2img</li>
            <li onclick="SDHubGallerySendImage('img')">img2img</li>
            <li onclick="SDHubGallerySendImage('extras')">extras</li>
            <li onclick="SDHubGallerySendImage('inpaint')">inpaint</li>
          </ul>
        </div>
      </li>
      <li onclick='SDHubGalleryViewerImage()'>
        <span class='sdhub-cm-OpenImageInNewTab'>${StaticImg} Image Viewer</span>
      </li>
      <li onclick='SDHubGalleryDeleteImage()'>
        <span class='sdhub-cm-OpenImageInNewTab'>${DLSVG} Delete</span>
      </li>
    </ul>
  `;

  const LightBox = document.createElement('div');
  LightBox.id = 'SDHub-Gallery-Image-Viewer';
  LightBox.setAttribute('tabindex', '0');

  const Control = document.createElement('div');
  Control.id = 'SDHub-Gallery-Image-Viewer-control';

  LightBox.append(Control);
  document.body.append(LightBox, GalleryCM);
});

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
