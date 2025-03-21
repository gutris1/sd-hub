let SDHubGalleryImageDataCache = new DataTransfer();
let SDHubGalleryFetchTimeout = null;
let SDHubGalleryLastFetch = 0;
let SDHubGalleryTabImageIndex = 1;
let SDHubGalleryCMHover = null;
let SDHubGalleryCMRightClick = false;
let SDHubGalleryNewImageSrc = new Set();
let SDHubGalleryBase = '/sd-hub-gallery';

const SDHubGalleryTabList = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids',
  'init-images',
  'manual-save'
];

onUiLoaded(function () {
  let GalleryTab = document.getElementById('sdhub-gallery-tab');
  if (GalleryTab) SDHubCreateGallery(GalleryTab);
});

onAfterUiUpdate(SDHubGalleryWatchNewImage);

function SDHubGalleryLoadInitial() {
  fetch(`${SDHubGalleryBase}/initial`)
    .then(response => response.json())
    .then(data => {
      if (!data.images?.length) return;

      let imgBox = document.getElementById('SDHub-Gallery-Image-Box-0');
      let loaded = 0;
      let total = data.images.length;
      let selectedTab = false;
      const today = /^\d{4}-\d{2}-\d{2}$/;

      document.querySelectorAll('[id^="SDHub-Gallery-"][id$="-Tab-Container"]').forEach(tab => {
        if (tab.classList.contains('active') && tab.style.display === 'flex') selectedTab = true;
      });

      const processImage = async (index) => {
        if (index >= total) return;

        let { path } = data.images[index];
        let whichTab = SDHubGalleryTabList.find((tab) => path.includes(`/${tab}/`));

        let tabToUse = whichTab || 'extras-images';
        let pathParts = path.split('/');
        let dateIndex = pathParts.findIndex(part => today.test(part));
        let parentFolder = dateIndex > 0 ? `${pathParts[dateIndex - 1]}-${pathParts[dateIndex]}` : '';

        if (!whichTab) {
          if (path.includes('?extras')) tabToUse = 'extras-images';
          else if (path.includes('?init')) tabToUse = 'init-images';
          else if (path.includes('?save')) tabToUse = 'manual-save';
          else if (parentFolder) {
            tabToUse = parentFolder;
            let tabName = `${pathParts[dateIndex - 1]} ${pathParts[dateIndex]}`;
            if (!document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Container`)) SDHubGalleryCloneTab(tabToUse, tabName);
          }
        }

        const TabCon = document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Container`);
        const TabBtn = document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Button`);
        const counter = document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Image-Counter`);

        if (imgBox && TabCon) {
          const newimgBox = imgBox.cloneNode(true);
          const fn = path.substring(path.lastIndexOf("/") + 1).split("?")[0];
          let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex}`;

          while (document.getElementById(newId)) {
            SDHubGalleryTabImageIndex++;
            newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex}`;
          }

          newimgBox.id = newId;
          const img = newimgBox.querySelector('img');

          if (img) {
            img.src = path;
            img.title = fn;

            img.onload = () => {
              loaded++;
              img.parentElement.style.backgroundImage = 'none';
              if (loaded === total) {
                console.log('all-loaded');
                SDHubGalleryTabImageCounters();
              }
            };

            fetch(path.split('?')[0])
              .then(response => response.blob())
              .then(blob => {
                const mimeType = blob.type;
                img.fileObject = new File([blob], fn, { type: mimeType });
              })
              .catch(error => console.error('Error fetching:', error));
          }

          TabCon.prepend(newimgBox);
          if (TabBtn) TabBtn.style.display = 'flex';
          SDHubGalleryTabImageIndex++;

          if (!selectedTab) {
            TabCon.classList.add('active');
            TabCon.style.display = 'flex';
            counter.style.display = 'flex';
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
  const TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row');
  const TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper');
  const TabCounter = document.getElementById('SDHub-Gallery-Tab-Counter-Container');

  let exTabBtn = document.querySelector('.sdhub-gallery-tab-button:not(.selected)');
  let TabBtn = exTabBtn.cloneNode(true);
  TabBtn.id = `SDHub-Gallery-${id}-Tab-Button`;
  TabBtn.textContent = name;
  TabBtn.style.display = 'flex';
  TabBtn.addEventListener('click', () => SDHubGallerySwitchTab(id));
  TabRow.append(TabBtn);

  let exTabCon = document.querySelector('.sdhub-gallery-tab-container:not(.active)');
  let TabCon = exTabCon.cloneNode(false);
  TabCon.id = `SDHub-Gallery-${id}-Tab-Container`;
  TabCon.style.display = 'none';
  TabWrap.append(TabCon);

  let exCounter = document.querySelector('.sdhub-gallery-tab-image-counter');
  let counter = exCounter.cloneNode(true);
  counter.id = `SDHub-Gallery-${id}-Tab-Image-Counter`;
  counter.style.display = 'none';
  TabCounter.append(counter);

  SDHubGalleryTabEventListener(TabCon);
  if (!SDHubGalleryTabList.includes(id)) SDHubGalleryTabList.push(id);
}

function SDHubGalleryTabImageCounters() {
  document.querySelectorAll('[id^="SDHub-Gallery-"][id$="-Tab-Container"]').forEach(tab => {
    const img = tab.querySelectorAll('img').length;
    const counter = document.getElementById(tab.id.replace('-Tab-Container', '-Tab-Image-Counter'));

    if (counter) {
      counter.textContent = img > 0 ? `${img} ${SDHubGetTranslation('item', img)}` : '';
      counter.style.visibility = img > 0 ? 'visible' : 'hidden';
    }
  });
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
  let imgBox = document.getElementById("SDHub-Gallery-Image-Box-0");
  let loaded = 0;
  let selectedTab = false;
  let files = [];
  let fileNames = [];

  document
    .querySelectorAll('[id^="SDHub-Gallery-"][id$="-Tab-Container"]')
    .forEach((tab) => {
      if (tab.classList.contains("active") && tab.style.display === "flex") selectedTab = true;
    });

  let img = document.querySelectorAll(`#${whichGallery} > .preview > .thumbnails img`);
  let total = img.length;
  if (total === 0) return;

  const processImage = async (index) => {
    if (index >= total) return;

    const imgEL = img[index];
    let src = imgEL.getAttribute("src");
    if (!src || !src.includes("/file=")) {
      requestAnimationFrame(() => processImage(index + 1));
      return;
    }

    let imgSrc = src.split("/file=")[1].split("?")[0];
    let path = `${SDHubGalleryBase}/image${imgSrc}`;
    let whichTab;

    if (whichGallery === "extras_gallery") {
      whichTab = "extras-images";
    } else {
      const base = whichGallery.split("_")[0];
      whichTab = imgSrc.includes("grid") ? `${base}-grids` : `${base}-images`;
    }

    const TabCon = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`);
    const TabBtn = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Button`);
    const counter = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Image-Counter`);

    if (imgBox && TabCon) {
      const newimgBox = imgBox.cloneNode(true);
      const fn = path.substring(path.lastIndexOf("/") + 1).split("?")[0];
      let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex}`;

      while (document.getElementById(newId)) {
        SDHubGalleryTabImageIndex++;
        newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex}`;
      }

      newimgBox.id = newId;
      const newImg = newimgBox.querySelector("img");

      if (newImg) {
        newImg.src = path;
        newImg.title = fn;
        fileNames.push(fn);

        newImg.onload = () => {
          loaded++;
          newImg.parentElement.style.backgroundImage = 'none';
          if (loaded === total) {
            console.log('all-loaded');
            SDHubGalleryTabImageCounters();
          }
        };

        fetch(path)
          .then(response => response.blob())
          .then(blob => {
            const mimeType = blob.type;
            newImg.fileObject = new File([blob], fn, { type: mimeType });
            files.push(newImg.fileObject);

            if (files.length === total) {
              SDHubGalleryImgChest(files, fileNames);
              files = [];
              fileNames = [];
            }
          })
          .catch(error => console.error("Error fetching:", error));
      }

      TabCon.prepend(newimgBox);
      if (TabBtn) TabBtn.style.display = "flex";
      SDHubGalleryTabImageIndex++;

      if (!selectedTab) {
        TabCon.classList.add("active");
        TabCon.style.display = "flex";
        counter.style.display = "flex";
        TabBtn.classList.add("selected");
        selectedTab = true;
      }
    }

    requestAnimationFrame(() => processImage(index + 1));
  };

  processImage(0);
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
  const TabCon = imgEL.closest('.sdhub-gallery-tab-container');

  window.SDHubImagePath = imgEL.getAttribute('src');
  window.SDHubImageList = [...TabCon.querySelectorAll('img')].map(img => img.getAttribute('src'));
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
  const cursorX = e.clientX;
  const cursorY = e.clientY;
  const spaceRight = viewportWidth - cursorX;
  const spaceBelow = viewportHeight - cursorY;

  let posX, originX, posY, originY;

  posX = spaceRight >= menuWidth
    ? (originX = 'left', cursorX)
    : (originX = 'right', cursorX - menuWidth);

  posY = spaceBelow >= menuHeight
    ? (originY = 'top', cursorY)
    : (originY = 'bottom', cursorY - menuHeight);

  GalleryCM.style.position = 'fixed';
  GalleryCM.style.left = `${posX}px`;
  GalleryCM.style.top = `${posY}px`;

  const bounds = GalleryCM.getBoundingClientRect();

  bounds.right > viewportWidth && (GalleryCM.style.left = `${viewportWidth - menuWidth - 5}px`),
  bounds.left < 0 && (GalleryCM.style.left = '5px'),
  bounds.bottom > viewportHeight && (GalleryCM.style.top = `${viewportHeight - menuHeight - 5}px`),
  bounds.top < 0 && (GalleryCM.style.top = '5px');  

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

  X = spaceOnRight >= menuWidth 
    ? (submenu.style.left = '100%', ul.style.marginLeft = '10px', 'left') 
    : (submenu.style.right = '100%', ul.style.marginRight = '10px', 'right');

  Y = spaceBelow < menuHeight
    ? (submenu.style.top = `-${menuHeight - 30}px`, 'bottom')
    : (submenu.style.top = '0', 'top');

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

function SDHubGallerySendImage(v) {
  const file = document.getElementById('SDHub-Gallery-ContextMenu').targetFile;
  const input = document.querySelector('#SDHubimgInfoImage input');

  const Con = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  Con.style.display = 'flex';

  SDHubGalleryImageDataCache.items.clear();
  SDHubGalleryImageDataCache.items.add(file);
  input.files = SDHubGalleryImageDataCache.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));

  const check = setInterval(() => {
    const imgInfoRawOutput = gradioApp().querySelector('#SDHubimgInfoGenInfo textarea');
    Con.style.opacity = '1';
    Spinner.style.visibility = 'visible';

    if (imgInfoRawOutput && imgInfoRawOutput.value.trim() !== '') {
      clearInterval(check);

      let SendButton;
      switch (v) {
        case 'txt':
          SendButton = document.querySelector('#SDHubimgInfoSendButton > #txt2img_tab');
          break;
        case 'img':
          SendButton = document.querySelector('#SDHubimgInfoSendButton > #img2img_tab');
          break;
        case 'inpaint':
          SendButton = document.querySelector('#SDHubimgInfoSendButton > #inpaint_tab');
          break;
        case 'extras':
          SendButton = document.querySelector('#SDHubimgInfoSendButton > #extras_tab');
          break;
      }

      if (SendButton) {
        SendButton.click();
        setTimeout(() => [
          Con.style.opacity, Con.style.display, Spinner.style.visibility
        ] = ['', '', ''], 200);
      }
    }
  }, 100);

  SDHubGalleryKillContextMenu();
}

function SDHubGallerySendToUploader() {
  const area = document.querySelector('#sdhub-uploader-inputs textarea');
  const base = `${SDHubGalleryBase}/image`;
  const path = decodeURIComponent(window.SDHubImagePath.slice(base.length));

  area.value += area.value ? `\n${path}` : path;
  updateInput(area);
  SDHubGalleryKillContextMenu();
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
    setTimeout(() => (row.style.opacity = '1'), 300);
  }
}

function SDHubImageInfoClearButton() {
  let row = document.getElementById('sdhub-gallery-image-info-row');
  let Cloned = document.getElementById('sd-hub-gallery-image-info-clear-button');
  let ClearButton = document.querySelector('#SDHubimgInfoImage > div > div > div > button:nth-child(2)') || 
                    document.querySelector('.gradio-container-4-40-0 #SDHubimgInfoImage > div > div > button');

  if (ClearButton && !Cloned) {
    let parent = ClearButton.parentElement;
    ClearButton.style.display = 'none';

    let btn = ClearButton.cloneNode(true);
    btn.id = 'sd-hub-gallery-image-info-clear-button';
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
  TabRow.id = 'SDHub-Gallery-Tab-Button-Row';

  const TabWrap = document.createElement('div');
  TabWrap.id = 'SDHub-Gallery-Tab-Wrapper';

  const TabCounterCon = document.createElement('div');
  TabCounterCon.id = 'SDHub-Gallery-Tab-Counter-Container';

  const btnClass = ['lg', 'primary', 'gradio-button', 'svelte-cmf5ev', 'sdhub-gallery-tab-button'];

  SDHubGalleryTabList.forEach(whichTab => {
    let btnTitle = whichTab.includes('grids') 
      ? whichTab 
      : whichTab.split('-')[0].toLowerCase();

    const TabBtn = document.createElement('button');
    TabBtn.id = `SDHub-Gallery-${whichTab}-Tab-Button`;
    TabBtn.classList.add(...btnClass);
    TabBtn.textContent = btnTitle;
    TabBtn.addEventListener('click', () => SDHubGallerySwitchTab(whichTab));

    const TabCon = document.createElement('div');
    TabCon.id = `SDHub-Gallery-${whichTab}-Tab-Container`;
    TabCon.classList.add('sdhub-gallery-tab-container');

    const counter = document.createElement('div');
    counter.id = `SDHub-Gallery-${whichTab}-Tab-Image-Counter`;
    counter.classList.add('sdhub-gallery-tab-image-counter');

    TabRow.append(TabBtn);
    TabCounterCon.append(counter);
    TabWrap.append(TabCon);
    SDHubGalleryTabEventListener(TabCon);
  });

  const imgBox = document.createElement('div');
  imgBox.id = 'SDHub-Gallery-Image-Box-0';
  imgBox.classList.add('sdhub-gallery-image-box');

  const imgCOn = document.createElement('div');
  imgCOn.id = 'SDHub-Gallery-Image-Container';

  const imgWrap = document.createElement('div');
  imgWrap.id = 'SDHub-Gallery-Image-Wrapper';

  const img = document.createElement('img');
  img.id = 'SDHub-Gallery-Image';

  const ContextBtn = document.createElement('span');
  ContextBtn.id = 'SDHub-Gallery-Image-Context-Button';
  ContextBtn.innerHTML = SDHubGalleryImageButtonSVG;
  ContextBtn.classList.add('sdhub-gallery-image-button');

  const ViewerBtn = document.createElement('span');
  ViewerBtn.id = 'SDHub-Gallery-Image-Viewer-Button';
  ViewerBtn.classList.add('sdhub-gallery-image-button');
  ViewerBtn.title = SDHubGetTranslation('image_viewer');
  ViewerBtn.innerHTML = SDHubGalleryImageSVG;
  const ViewerBtnSVG = ViewerBtn.querySelector('svg');
  if (ViewerBtnSVG) ViewerBtnSVG.classList.remove('sdhub-gallery-cm-svg');

  const eFrame = document.createElement('div');
  eFrame.id = 'SDHub-Gallery-Empty-Frame';

  imgWrap.append(img, ContextBtn, ViewerBtn, eFrame);
  imgCOn.append(imgWrap);
  imgBox.append(imgCOn);
  TabWrap.prepend(TabCounterCon);
  GalleryTab.prepend(SDHubGalleryCreateDeleteBox(), TabRow, TabWrap, imgBox);

  const imgchestColumn = document.getElementById('SDHub-Gallery-imgchest-Column');
  if (imgchestColumn) SDHubGalleryCreateimgChest(GalleryTab, TabRow, imgchestColumn);

  SDHubGalleryLoadInitial()
  document.getElementById('SDHub-Gallery-ContextMenu').style.display = 'block';
}

function SDHubGalleryTabEventListener(TabCon) {
  TabCon.addEventListener('contextmenu', e => e.preventDefault());

  TabCon.ondrag = TabCon.ondragend = TabCon.ondragstart = (e) => {
    e.stopPropagation(); e.preventDefault();
  };

  TabCon.addEventListener('click', (e) => {
    const imgEL = e.target.closest('img');
    const viewerBtn = e.target.closest('#SDHub-Gallery-Image-Viewer-Button');

    if (imgEL) SDHubGalleryImageInfo(imgEL, e);

    if (viewerBtn) {
      const img = viewerBtn.closest('#SDHub-Gallery-Image-Wrapper')?.querySelector('img');
      if (img) SDHubGalleryOpenViewerFromButton(img);
    }
  });

  TabCon.addEventListener('mouseenter', (e) => {
    const Btn = e.target.closest('#SDHub-Gallery-Image-Context-Button');
    if (!Btn) return;

    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM.style.opacity === '1' && GalleryCM.dataset.targetBtn === Btn) return;

    SDHubGalleryCMHover = setTimeout(() => {
      if (document.querySelector('#SDHub-Gallery-Image-Context-Button:hover')) {
        const imgEL = Btn.closest('#SDHub-Gallery-Image-Wrapper')?.querySelector('img');
        if (imgEL) {
          SDHubGalleryCMRightClick = false;
          GalleryCM.dataset.targetBtn = Btn;
          SDHubGalleryContextMenu(e, imgEL);
        }
      }
    }, 300);
  }, true);

  TabCon.addEventListener('mouseleave', (e) => {
    clearTimeout(SDHubGalleryCMHover);
    const BtnHover = document.querySelector("#SDHub-Gallery-Image-Context-Button:hover");
    const CMHover = document.querySelector("#SDHub-Gallery-ContextMenu:hover");
    if (!BtnHover && !CMHover && !SDHubGalleryCMRightClick) SDHubGalleryKillContextMenu();
  }, true);

  TabCon.addEventListener('contextmenu', (e) => {
    const imgEL = e.target.closest('img');
    if (!imgEL || !TabCon.contains(imgEL)) {
      SDHubGalleryKillContextMenu();
      return;
    }
    e.preventDefault();
    SDHubGalleryCMRightClick = true;
    SDHubGalleryContextMenu(e, imgEL);
  });
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

  const Yes = document.createElement('span');
  Yes.id = 'SDHub-Gallery-Delete-Yes';
  Yes.classList.add('sdhub-gallery-delete-button');
  Yes.textContent = SDHubGetTranslation('yes');

  const No = document.createElement('span');
  No.id = 'SDHub-Gallery-Delete-No';
  No.classList.add('sdhub-gallery-delete-button');
  No.textContent = SDHubGetTranslation('no');

  const lang = navigator.language || navigator.languages[0] || 'en';
  ButtonRow.append(...(lang.startsWith('ja') || lang.startsWith('zh') ? [No, Yes] : [Yes, No]));

  Box.append(Text, ButtonRow);
  Con.append(Box, Spinner);

  document.addEventListener('keydown', ({ key }) => {
    const Box = document.getElementById('SDHub-Gallery-Delete-Box');
    if (Box?.style.transform === 'scale(1)') ({ y: Yes, n: No, Escape: No }[key]?.click());
  });  

  return Con;
}

function SDHubGalleryDeletion() {
  const imgEL = document.querySelector(`img[src="${window.SDHubImagePath}"]`);
  const path = decodeURIComponent(window.SDHubImagePath).replace(new RegExp(`^${SDHubGalleryBase}/image`), '');
  const name = decodeURIComponent(window.SDHubImagePath.split('/').pop());

  const Con = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  const Box = document.getElementById('SDHub-Gallery-Delete-Box');
  const Text = document.getElementById('SDHub-Gallery-Delete-Text');
  const Yes = document.getElementById('SDHub-Gallery-Delete-Yes');
  const No = document.getElementById('SDHub-Gallery-Delete-No');

  Con.style.display = 'flex';
  Text.textContent = `${SDHubGetTranslation('delete')} ${name}?`;

  Yes.onclick = () => {
    Spinner.style.visibility = 'visible';
    Box.style.opacity = '0';
    Box.style.transform = 'scale(1.5)';

    fetch(`${SDHubGalleryBase}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
      .then(response => {
        if (!response.ok) return response.text().then(err => { throw new Error(err); });
        return response.json();
      })
      .then(data => {
        if (data.status === 'deleted') {
          const parentDiv = imgEL.closest('.sdhub-gallery-image-box');
          if (parentDiv) parentDiv.remove();
        } else console.error("Deletion failed:", data);
      })
      .catch(error => console.error('Error deleting image:', error))
      .finally(() => {
        SDHubGalleryTabImageCounters();
        setTimeout(() => {
          Con.style.opacity = '';
          Spinner.style.visibility = '';
        }, 1000);
        setTimeout(() => {
          Con.style.display = '';
          Box.style.opacity = '';
          Box.style.transform = '';
        }, 1100);
      });
  };

  Con.onclick = No.onclick = () => {
    Con.style.opacity = '';
    Box.style.transform = 'scale(1.5)';
    setTimeout(() => (Con.style.display = '', Box.style.transform = ''), 200);
  };

  setTimeout(() => Con.style.opacity = '1', 100);
  setTimeout(() => Box.style.transform = 'scale(1)', 200);
}

function SDHubGalleryCreateimgChest(GalleryTab, TabRow, imgchestColumn) {
  let fromColumn = false;

  const imgchestButton = document.createElement('div');
  imgchestButton.id = 'SDHub-Gallery-imgchest-Button';
  imgchestButton.style.display = 'flex';
  imgchestButton.innerHTML = SDHubGalleryimgchestSVG;
  imgchestButton.prepend(imgchestColumn);
  GalleryTab.prepend(imgchestButton);
  TabRow.style.marginLeft = '40px';

  ['Save', 'Load'].forEach(key => {
    const btn = document.getElementById(`SDHub-Gallery-imgchest-${key}-Button`);
    btn && (btn.title = `${key} Setting`, btn.textContent = SDHubGetTranslation(key.toLowerCase()));
  });

  const apiInput = document.querySelector('#SDHub-Gallery-imgchest-API input');
  apiInput?.setAttribute('placeholder', SDHubGetTranslation('imgchest_api_key'));
  apiInput?.addEventListener('mousedown', () => {
    fromColumn = window.getComputedStyle(imgchestColumn).display === 'flex';
  });

  document.addEventListener('mouseup', () => {
    if (window.getComputedStyle(imgchestColumn).display === 'flex') setTimeout(() => (fromColumn = false), 0);
  });

  document.addEventListener('click', (e) => {
    if (imgchestButton && imgchestColumn) {
      if (imgchestButton.contains(e.target) && window.getComputedStyle(imgchestColumn).display === 'none') {
        imgchestColumn.style.display = 'flex';
        requestAnimationFrame(() => {
          imgchestColumn.style.opacity = '1';
          imgchestColumn.style.transform = 'scale(1)';
        });
      } else if (!imgchestColumn.contains(e.target) && !fromColumn) {
        imgchestColumn.style.display = '';
        imgchestColumn.style.opacity = '';
        imgchestColumn.style.transform = '';
        fromColumn = false;
      }
    }
  });

  document.querySelectorAll('#SDHub-Gallery-imgchest-Info').forEach(el => {
    if (el.textContent.includes('Auto Upload to')) {
      el.innerHTML = `${SDHubGetTranslation('auto_upload_to')}
        <a class="sdhub-gallery-imgchest-info" href="https://imgchest.com" target="_blank">
          imgchest.com
        </a>`;
    }
  });

  const checkboxSpan = document.querySelector('#SDHub-Gallery-imgchest-Checkbox span');
  if (checkboxSpan) checkboxSpan.textContent = SDHubGetTranslation('click_to_enable');

  ['#SDHub-Gallery-imgchest-Privacy', '#SDHub-Gallery-imgchest-NSFW'].forEach(id =>
    document.querySelectorAll(`${id} label > span`).forEach(s => s.textContent = SDHubGetTranslation(s.textContent.toLowerCase()))
  );

  fetch(`${SDHubGalleryBase}/imgChest`)
    .then(r => r.json())
    .then(d => {
      const clickRadio = (id, v) => document.querySelector(`${id} label[data-testid="${v}-radio-label"]`)?.click();
      clickRadio('#SDHub-Gallery-imgchest-Privacy', d.privacy);
      clickRadio('#SDHub-Gallery-imgchest-NSFW', d.nsfw);
      if (apiInput) apiInput.value = d.api, updateInput(apiInput);
    })
    .catch(e => console.error('Error loading imgchest settings:', e));
}

function SDHubGalleryDOMLoaded() {
  const css = `${window.SDHubFilePath}styleGallery.css`;
  const time = (Date.now() / 1000).toFixed(6);
  const file = `${css}?${time}`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.setAttribute('property', 'stylesheet');
  link.href = file;

  document.body.insertBefore(link, document.body.querySelector('style'));

  const SDHubGallery = document.createElement('div');
  SDHubGallery.id = 'SDHubGallery';

  SDHubGallery.append(
    SDHubGalleryCreateContextMenu(),
    SDHubGalleryCreateLightBox()
  );

  document.body.append(SDHubGallery);

  document.addEventListener('click', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    const SendButton = document.getElementById('SDHubimgInfoSendButton');

    if (
      GalleryCM?.style.opacity === '1' &&
      !GalleryCM.contains(e.target) &&
      !e.target.closest('#SDHub-Gallery-Image-Context-Button')
    ) {
      SDHubGalleryCMRightClick = false;
      SDHubGalleryKillContextMenu();
    }

    if (SendButton?.contains(e.target)) {
      e.stopPropagation();
      e.preventDefault();
      if (e.target.closest('button')) window.SDHubCloseImageInfoRow();
    }
  });

  document.addEventListener('contextmenu', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (GalleryCM?.contains(e.target)) e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    const row = document.getElementById('sdhub-gallery-image-info-row');
    if (e.key === 'Escape' && row && window.getComputedStyle(row).display === 'flex') {
      const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
      if (LightBox && window.getComputedStyle(LightBox).display === 'flex') return;
      else e.stopPropagation(); e.preventDefault(); window.SDHubCloseImageInfoRow();
    }
  });

  document.addEventListener('change', () => {
    const checkboxInput = document.querySelector('#SDHub-Gallery-imgchest-Checkbox input');
    const checkboxSpan = document.querySelector('#SDHub-Gallery-imgchest-Checkbox span');

    if (checkboxInput && checkboxSpan) {
      checkboxSpan.style.color = checkboxInput.checked ? 'var(--background-fill-primary)' : '';
      checkboxSpan.textContent = SDHubGetTranslation(checkboxInput.checked ? 'enabled' : 'click_to_enable');
    }
  });
}

function SDHubGalleryCreateContextMenu() {
  const GalleryCM = document.createElement('div');
  GalleryCM.id = 'SDHub-Gallery-ContextMenu';
  GalleryCM.classList.add('sdhub-gallery-contextmenu');
  GalleryCM.style.display = 'none';
  GalleryCM.innerHTML = `
    <ul>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('open')">
        <span>${SDHubGalleryOpenNewTabSVG} ${SDHubGetTranslation('open_new_tab')}</span>
      </li>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('download')">
        <span>${SDHubGalleryDLSVG} ${SDHubGetTranslation('download')}</span>
      </li>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('info')">
        <span>${SDHubGalleryImageInfoSVG} ${SDHubGetTranslation('image_info')}</span>
      </li>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('viewer')">
        <span>${SDHubGalleryImageSVG} ${SDHubGetTranslation('image_viewer')}</span>
      </li>
      <li class='sdhub-cm-li sdhub-cm-sendto'>
        <span>${SDHubGallerySendToSVG} ${SDHubGetTranslation('send_to')} ${SDHubGalleryARRSVG}</span>
        <div id="sdhub-cm-sendto-menu" class="sdhub-cm-submenu sdhub-gallery-contextmenu">
          <ul>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('txt')">txt2img</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('img')">img2img</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('extras')">extras</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('inpaint')">inpaint</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendToUploader()">${SDHubGetTranslation('uploader')}</li>
          </ul>
        </div>
      </li>
      <li class='sdhub-cm-li' onclick="SDHubGalleryContextButton('delete')">
        <span>${SDHubGalleryDeleteSVG} ${SDHubGetTranslation('delete')}</span>
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
  Control.id = 'SDHub-Gallery-Image-Viewer-Control';

  const NextBtn = document.createElement('span');
  NextBtn.id = 'SDHub-Gallery-Image-Viewer-Next-Button';
  NextBtn.classList.add('sdhub-gallery-image-viewer-button');
  NextBtn.innerHTML = SDHubGalleryNextButtonSVG;
  NextBtn.onclick = (e) => (e.stopPropagation(), SDHubGalleryNextImage());

  const PrevBtn = document.createElement('span');
  PrevBtn.id = 'SDHub-Gallery-Image-Viewer-Prev-Button';
  PrevBtn.classList.add('sdhub-gallery-image-viewer-button');
  PrevBtn.innerHTML = SDHubGalleryPrevButtonSVG;
  PrevBtn.onclick = (e) => (e.stopPropagation(), SDHubGalleryPrevImage());

  const Wrapper = document.createElement('div');
  Wrapper.id = 'SDHub-Gallery-Image-Viewer-Wrapper';

  document.addEventListener('keydown', (e) => {
    const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
    const NextBtn = document.getElementById('SDHub-Gallery-Image-Viewer-Next-Button');
    const PrevBtn = document.getElementById('SDHub-Gallery-Image-Viewer-Prev-Button');

    const isFlex = (el) => el && getComputedStyle(el)?.display === 'flex';

    if (!isFlex(LightBox)) return;

    switch (e.key) {
      case 'Escape':
        window.SDHubGalleryImageViewerCloseZoom();
        break;
      case 'ArrowLeft':
        if (isFlex(PrevBtn)) SDHubGalleryPrevImage();
        break;
      case 'ArrowRight':
        if (isFlex(NextBtn)) SDHubGalleryNextImage();
        break;
    }
  });

  const CloseBtn = document.createElement('span');
  CloseBtn.id = 'SDHub-Gallery-Image-Viewer-Close-Button';
  CloseBtn.classList.add('sdhub-gallery-image-viewer-button');
  CloseBtn.innerHTML = SDHubGalleryCloseButtonSVG;
  CloseBtn.onclick = (e) => (e.stopPropagation(), window.SDHubGalleryImageViewerCloseZoom());

  Control.append(NextBtn, PrevBtn, CloseBtn);
  LightBox.append(Control, Wrapper);

  return LightBox;
}

function SDHubGallerySwitchTab(whichTab) {
  document.querySelectorAll('[id^="SDHub-Gallery-"][id$="-Tab-Container"]').forEach(Tab => {
    Tab.style.display = 'none';
    Tab.classList.remove('active');

    const counter = document.getElementById(Tab.id.replace('-Tab-Container', '-Tab-Image-Counter'));
    if (counter) counter.style.display = 'none';
  });

  document.querySelectorAll('[id^="SDHub-Gallery-"][id$="-Tab-Button"]').forEach(Btn => {
    Btn.classList.remove('selected');
  });

  const Tab = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`);
  if (Tab) {
    Tab.style.display = 'flex';
    Tab.classList.add('active');

    const counter = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Image-Counter`);
    if (counter) counter.style.display = 'flex';
  }

  const Btn = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Button`);
  if (Btn) Btn.classList.add('selected');
}

async function SDHubGalleryImgChest(files, names) {
  const url = 'https://api.imgchest.com/v1/post';
  const fn = names.length > 0 ? names[names.length - 1] : 'image';

  const checkbox = gradioApp().querySelector('#SDHub-Gallery-imgchest-Checkbox input');
  if (!checkbox?.checked) return;

  const apikey = gradioApp().querySelector('#SDHub-Gallery-imgchest-API input');
  if (!apikey?.value.trim()) return;

  function getSettings(id) {
    const selected = gradioApp().querySelector(`${id} > div > label.selected`);
    return selected ? selected.getAttribute('data-testid').replace('-radio-label', '').toLowerCase() : '';
  }

  const privacy = getSettings('#SDHub-Gallery-imgchest-Privacy') || 'hidden';
  const nsfw = getSettings('#SDHub-Gallery-imgchest-NSFW') || 'true';

  const data = new FormData();
  files.forEach(img => data.append('images[]', img));
  data.append('title', fn);
  data.append('privacy', privacy);
  data.append('nsfw', nsfw);

  try {
    const upload = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apikey.value.trim()}` },
      body: data
    });

    const result = await upload.json();
    console.log('Uploaded:', result);
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
