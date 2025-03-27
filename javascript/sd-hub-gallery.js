let SDHubGalleryTabImageIndex = 1;
let SDHubGalleryCMHover = null;
let SDHubGalleryCMRightClick = false;
let SDHubGalleryNewImageSrc = new Set();
let SDHubGalleryBase = '/sd-hub-gallery';
let SDHubCanvas, SDHubCTX;

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

async function SDHubResizeImage(blob, size = 512) {
  try {
    const img = await createImageBitmap(blob);
    const ar = img.width / img.height;

    SDHubCanvas.width = img.width > img.height ? size : Math.round(size * ar);
    SDHubCanvas.height = img.width > img.height ? Math.round(size / ar) : size;
    SDHubCTX.clearRect(0, 0, SDHubCanvas.width, SDHubCanvas.height);
    SDHubCTX.drawImage(img, 0, 0, SDHubCanvas.width, SDHubCanvas.height);

    return new Promise((resolve) => {
      SDHubCanvas.toBlob((thumb) => resolve(thumb), 'image/jpeg', 0.7);
    });
  } catch (error) { console.error('Error in resizing:', error); }
}

async function SDHubGalleryLoadInitial() {
  try {
    const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
    const res = await fetch(`${SDHubGalleryBase}/initial`);
    const data = await res.json();

    if (!data.images?.length) return;

    let imgBox = document.getElementById("SDHub-Gallery-Image-Box-0");
    let loaded = 0;
    let total = data.images.length;
    let selectedTab = false;
    const todayRegex = /^\d{4}-\d{2}-\d{2}$/;
    const imgBoxes = [];

    document.querySelectorAll('[id^="SDHub-Gallery-"][id$="-Tab-Container"]').forEach((tab) => {
      if (tab.classList.contains("active") && tab.style.display === "flex") {
        selectedTab = true;
      }
    });

    for (let index = 0; index < total; index++) {
      let { path } = data.images[index];
      let whichTab = SDHubGalleryTabList.find((tab) => path.includes(`/${tab}/`));
      let tabToUse = whichTab || "extras-images";
      let pathParts = path.split("/");
      let dateIndex = pathParts.findIndex((part) => todayRegex.test(part));
      let parentFolder = dateIndex > 0 ? `${pathParts[dateIndex - 1]}-${pathParts[dateIndex]}` : "";

      if (!whichTab) {
        if (path.includes("?extras")) tabToUse = "extras-images";
        else if (path.includes("?init")) tabToUse = "init-images";
        else if (path.includes("?save")) tabToUse = "manual-save";
        else if (parentFolder) {
          tabToUse = parentFolder;
          let tabName = `${pathParts[dateIndex - 1]} ${pathParts[dateIndex]}`;
          if (!document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Container`)) {
            SDHubGalleryCloneTab(tabToUse, tabName);
          }
        }
      }

      const TabCon = document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Container`);
      const TabBtn = document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Button`);
      const counter = document.getElementById(`SDHub-Gallery-${tabToUse}-Tab-Image-Counter`);

      if (imgBox && TabCon) {
        const newImgBox = imgBox.cloneNode(true);
        let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex}`;

        while (document.getElementById(newId)) {
          SDHubGalleryTabImageIndex++;
          newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex}`;
        }

        newImgBox.id = newId;
        imgBoxes.push({ newImgBox, path, TabCon, TabBtn, counter });
        SDHubGalleryTabImageIndex++;
      }
    }

    imgBoxes.forEach(({ newImgBox, TabCon }) => {
      TabCon.prepend(newImgBox);
    });

    for (const { newImgBox, path, TabCon, TabBtn, counter } of imgBoxes) {
      const img = newImgBox.querySelector("img");
      const name = path.substring(path.lastIndexOf("/") + 1).split("?")[0];

      if (img) {
        try {
          requestAnimationFrame(() => {
            DelCon.style.display = 'flex';
            DelCon.style.opacity = '1';
          });

          img.dataset.image = path;
          const blob = await fetch(path.split('?')[0]).then((res) => res.blob());
          const thumb = await SDHubResizeImage(blob);
          img.fileObject = new File([blob], name, { type: blob.type });
          img.src = URL.createObjectURL(thumb);
          img.title = name;

          img.onload = () => {
            loaded++;
            if (loaded === total) {
              console.log('SD-Hub Gallery Loaded');
              SDHubGalleryTabImageCounters();
              requestAnimationFrame(() => {
                DelCon.style.opacity = '';
                DelCon.style.display = '';
              });
            }
          };

        } catch (error) { console.error("Error in initial imgbox:", error); }
      }

      if (TabBtn) TabBtn.style.display = "flex";
      if (!selectedTab) {
        TabCon.classList.add("active");
        TabCon.style.display = "flex";
        counter.style.display = "flex";
        TabBtn.classList.add("selected");
        selectedTab = true;
      }
    }

  } catch (error) { console.error("Error in initial-load:", error); }
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

async function SDHubGalleryGetNewImage(whichGallery) {
  let imgBox = document.getElementById("SDHub-Gallery-Image-Box-0");
  let selectedTab = false;
  let files = [];
  let fileNames = [];
  let imgBoxes = [];
  let loaded = 0;

  document
    .querySelectorAll('[id^="SDHub-Gallery-"][id$="-Tab-Container"]')
    .forEach((tab) => {
      if (tab.classList.contains("active") && tab.style.display === "flex") {
        selectedTab = true;
      }
    });

  let img = document.querySelectorAll(`#${whichGallery} > .preview > .thumbnails img`);
  let total = img.length;
  if (total === 0) return;

  for (let index = 0; index < total; index++) {
    const imgEL = img[index];
    let src = imgEL.getAttribute("src");
    if (!src || !src.includes("/file=")) continue;

    let imgSrc = src.split("/file=")[1].split("?")[0];
    let path = `${SDHubGalleryBase}/image${imgSrc}`;
    let whichTab =
      whichGallery === "extras_gallery"
        ? "extras-images"
        : imgSrc.includes("grid")
        ? `${whichGallery.split("_")[0]}-grids`
        : `${whichGallery.split("_")[0]}-images`;

    const TabCon = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`);
    const TabBtn = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Button`);
    const counter = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Image-Counter`);

    if (imgBox && TabCon) {
      const newImgBox = imgBox.cloneNode(true);
      let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex}`;

      while (document.getElementById(newId)) {
        SDHubGalleryTabImageIndex++;
        newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex}`;
      }

      newImgBox.id = newId;
      imgBoxes.push({ newImgBox, path, TabCon, TabBtn, counter });
      SDHubGalleryTabImageIndex++;
    }
  }

  imgBoxes.forEach(({ newImgBox, TabCon }) => {
    TabCon.prepend(newImgBox);
  });

  for (const { newImgBox, path, TabCon, TabBtn, counter } of imgBoxes) {
    const newImg = newImgBox.querySelector("img");
    const name = path.substring(path.lastIndexOf("/") + 1).split("?")[0];

    if (newImg) {
      fileNames.push(name);
      try {
        const res = await fetch(path);
        const blob = await res.blob();
        const thumb = await SDHubResizeImage(blob);

        newImg.dataset.image = path;
        newImg.fileObject = new File([blob], name, { type: blob.type });
        newImg.src = URL.createObjectURL(thumb);
        newImg.title = name;
        files.push(newImg.fileObject);

        newImg.onload = () => {
          loaded++;
          if (loaded === total) SDHubGalleryTabImageCounters();
        };

        if (files.length === total) {
          SDHubGalleryImgChestUpload(files, fileNames);
          files = [];
          fileNames = [];
        }

      } catch (error) { console.error("Error in new imgbox:", error); }
    }

    if (TabBtn) TabBtn.style.display = "flex";
    if (!selectedTab) {
      TabCon.classList.add("active");
      TabCon.style.display = "flex";
      counter.style.display = "flex";
      TabBtn.classList.add("selected");
      selectedTab = true;
    }
  }
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
  const TabCon = imgEL.closest('.sdhub-gallery-tab-container');

  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageList = [...TabCon.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);
  window.SDHubImageFile = imgEL.fileObject;

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
      const imgEL = document.querySelector(`img[data-image="${imagePath}"]`);
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

function SDHubGallerySendToUploader() {
  const area = document.querySelector('#sdhub-uploader-inputs textarea');
  const base = `${SDHubGalleryBase}/image`;
  const path = decodeURIComponent(window.SDHubImagePath.slice(base.length));
  area.value += area.value ? `\n${path}` : path;
  updateInput(area);
  SDHubGalleryKillContextMenu();
}

async function SDHubGallerySendImage(v) {
  const row = document.getElementById('sdhub-gallery-image-info-row');
  const input = document.querySelector('#SDHubimgInfoImage input');
  const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  window.SDHubCenterElement('Spinner');

  row.style.display = 'flex'; row.style.pointerEvents = 'none';
  DelCon.style.display = 'flex'; DelCon.style.opacity = '1';
  Spinner.style.visibility = 'visible';

  await SDHubGalleryPasteImage(input, window.SDHubImageFile);

  const wait = setInterval(() => {
    if (window.SDHubimgRawOutput?.trim()) {
      clearInterval(wait);

      const SendButton = document.querySelector(`#SDHubimgInfoSendButton > #${v}_tab`);
      if (SendButton) {
        setTimeout(() => SendButton.click(), 1000);
        setTimeout(() => {
          row.style.display = ''; row.style.pointerEvents = '';
          DelCon.style.opacity = ''; DelCon.style.display = '';
          Spinner.style.visibility = '';
        }, 1300);
      }
    }
  }, 100);

  SDHubGalleryKillContextMenu();
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
      setTimeout(() => (ClearButton.click(), (row.style.display = '')), 200);
    };

    btn.onclick = (e) => (e.stopPropagation(), closeRow());
    window.SDHubCloseImageInfoRow = closeRow;
  }
}

async function SDHubGalleryImageInfo(imgEL) {
  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageFile = imgEL.fileObject;
  const row = document.querySelector('#sdhub-gallery-image-info-row');
  const input = document.querySelector('#SDHubimgInfoImage input');

  if (input) {
    row.style.display = 'flex'; row.style.pointerEvents = 'none';
    await SDHubGalleryPasteImage(input, window.SDHubImageFile);

    document.body.classList.add('no-scroll');
    setTimeout(() => (row.style.pointerEvents = '', row.style.opacity = '1'), 300);
  }
}

async function SDHubGalleryPasteImage(input, file) {
  const data = new DataTransfer();
  data.items.add(file);
  const pasteImg = new ClipboardEvent('paste', { clipboardData: data, bubbles: true });
  navigator.clipboard.writeText('');
  input.dispatchEvent(pasteImg);
}

function SDHubGalleryTabEventListener(TabCon) {
  TabCon.addEventListener('contextmenu', e => e.preventDefault());

  TabCon.ondrag = TabCon.ondragend = TabCon.ondragstart = (e) => {
    e.stopPropagation(); e.preventDefault();
  };

  TabCon.addEventListener('click', (e) => {
    const imgEL = e.target.closest('img');
    const viewerBtn = e.target.closest('#SDHub-Gallery-Image-Viewer-Button');

    if (imgEL) SDHubGalleryImageInfo(imgEL);

    if (viewerBtn) {
      const img = viewerBtn.closest('#SDHub-Gallery-Image-Container')?.querySelector('img');
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
        const imgEL = Btn.closest('#SDHub-Gallery-Image-Container')?.querySelector('img');
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

function SDHubGalleryDeletion() {
  const imgEL = document.querySelector(`img[data-image="${window.SDHubImagePath}"]`);
  const path = decodeURIComponent(window.SDHubImagePath).replace(new RegExp(`^${SDHubGalleryBase}/image`), '');
  const name = decodeURIComponent(window.SDHubImagePath.split('/').pop());

  const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  const DelBox = document.getElementById('SDHub-Gallery-Delete-Box');
  const Text = document.getElementById('SDHub-Gallery-Delete-Text');
  const Yes = document.getElementById('SDHub-Gallery-Delete-Yes');
  const No = document.getElementById('SDHub-Gallery-Delete-No');

  DelCon.style.display = 'flex';
  Text.textContent = `${SDHubGetTranslation('delete')} ${name}?`;
  document.body.classList.add('no-scroll');

  window.SDHubCenterElement('DelBox');
  window.SDHubCenterElement('Spinner');

  Yes.onclick = async () => {
    Spinner.style.visibility = 'visible';
    Object.assign(DelBox.style, { opacity: '0', transform: 'scale(1.5)' });

    try {
      const response = await fetch(`${SDHubGalleryBase}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      if (data.status === 'deleted') imgEL.closest('.sdhub-gallery-image-box')?.remove();
      else console.error("Deletion failed:", data);

    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      SDHubGalleryTabImageCounters();
      setTimeout(() => {
        DelCon.style.opacity = '';
        Spinner.style.visibility = '';
        document.body.classList.remove('no-scroll');
      }, 1000);
      setTimeout(() => {
        DelCon.style.display = '';
        DelBox.style.opacity = '';
        DelBox.style.transform = '';
      }, 1100);
    }
  };

  DelCon.onclick = No.onclick = () => {
    document.body.classList.remove('no-scroll');
    DelCon.style.opacity = '';
    DelBox.style.transform = 'scale(1.5)';
    setTimeout(() => (DelCon.style.display = '', DelBox.style.transform = ''), 200);
  };

  requestAnimationFrame(() => (DelCon.style.opacity = '1', DelBox.style.transform = 'scale(1)'));
}

function SDHubCreateGallery(GalleryTab) {
  const sendButton = document.getElementById('SDHubimgInfoSendButton');
  sendButton?.querySelectorAll('#txt2img_tab, #img2img_tab').forEach(btn => {
    btn.onclick = () => SDHubGallerySendButton(btn.id.replace('_tab', ''));
  });

  const SDHubGallery = document.getElementById('SDHubGallery');
  if (SDHubGallery) {
    SDHubGallery.style.display = '';
    const DelCon = SDHubGallery.querySelector('#SDHub-Gallery-Delete-Container');
    const TabRow = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Button-Row');
    const TabWrap = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Wrapper');
    const imgBox = SDHubGallery.querySelector('#SDHub-Gallery-Image-Box-0');

    GalleryTab.prepend(DelCon, TabRow, TabWrap, imgBox);

    const imgchestColumn = document.getElementById('SDHub-Gallery-imgchest-Column');
    if (imgchestColumn) SDHubGalleryCreateimgChest(GalleryTab, TabRow, imgchestColumn);
  }
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

  SDHubCanvas = document.createElement('canvas');
  SDHubCTX = SDHubCanvas.getContext('2d');

  const SDHubGallery = document.createElement('div');
  SDHubGallery.id = 'SDHubGallery';
  SDHubGallery.style.display = 'none';

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

  const imgCon = document.createElement('div');
  imgCon.id = 'SDHub-Gallery-Image-Container';

  const img = document.createElement('img');
  img.id = 'SDHub-Gallery-Image';
  img.src = 'https://huggingface.co/gutris1/webui/resolve/main/misc/card-no-preview.png'

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

  imgCon.append(img, ContextBtn, ViewerBtn, eFrame);
  imgBox.append(imgCon);
  TabWrap.prepend(TabCounterCon);

  SDHubGallery.append(
    SDHubGalleryCreateContextMenu(),
    SDHubGalleryCreateLightBox(),
    SDHubGalleryCreateDeleteBox(),
    TabRow, TabWrap, imgBox
  );

  document.body.append(SDHubGallery);

  document.addEventListener('click', (e) => {
    const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
    if (
      GalleryCM?.style.opacity === '1' &&
      !GalleryCM.contains(e.target) &&
      !e.target.closest('#SDHub-Gallery-Image-Context-Button')
    ) {
      SDHubGalleryCMRightClick = false;
      SDHubGalleryKillContextMenu();
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

  window.SDHubCenterElement = (flag) => {
    const tab = document.getElementById('sdhub-gallery-tab');
    if (!tab || tab.style.display !== 'block') return;

    const V = -200;
    const W = window.innerHeight;
    const T = window.pageYOffset || document.documentElement.scrollTop;

    let element = null;
    if (flag === 'DelBox') {
      element = document.getElementById('SDHub-Gallery-Delete-Box');
    } else if (flag === 'Spinner') {
      element = document.getElementById('SDHub-Gallery-Delete-Spinner');
    }

    if (element) {
      const H = element.offsetHeight || 0;
      element.style.top = `${T + (W - H) / 2 + V}px`;
    }
  };

  ['resize', 'scroll'].forEach(event => window.addEventListener(event, () => {
    window.SDHubCenterElement('DelBox');
    window.SDHubCenterElement('Spinner');
  }));

  SDHubGalleryLoadInitial();
}

function SDHubGalleryCreateContextMenu() {
  const GalleryCM = document.createElement('div');
  GalleryCM.id = 'SDHub-Gallery-ContextMenu';
  GalleryCM.classList.add('sdhub-gallery-contextmenu');
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
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('txt2img')">txt2img</li>
            <li class='sdhub-cm-li' onclick="SDHubGallerySendImage('img2img')">img2img</li>
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

function SDHubGalleryCreateDeleteBox() {
  const DelCon = document.createElement('div');
  DelCon.id = 'SDHub-Gallery-Delete-Container';

  const Spinner = document.createElement('div');
  Spinner.id = 'SDHub-Gallery-Delete-Spinner';
  Spinner.innerHTML = SDHubGallerySpinnerSVG;

  const DelBox = document.createElement('div');
  DelBox.id = 'SDHub-Gallery-Delete-Box';

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

  DelBox.append(Text, ButtonRow);
  DelCon.append(DelBox, Spinner);

  document.addEventListener('keydown', ({ key }) => {
    if (DelBox.style.transform === 'scale(1)') {
      ({ y: Yes, n: No, Escape: No }[key]?.click());
    }
  });

  return DelCon;
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

function SDHubGalleryImgChestUpload(files, names) {
  const url = "https://api.imgchest.com/v1/post";
  const fn = names.length > 0 ? names[names.length - 1] : "image";

  const checkbox = gradioApp().querySelector("#SDHub-Gallery-imgchest-Checkbox input");
  if (!checkbox?.checked) return;

  const apikey = gradioApp().querySelector("#SDHub-Gallery-imgchest-API input");
  if (!apikey?.value.trim()) return;

  function getSettings(id) {
    const selected = gradioApp().querySelector(`${id} > div > label.selected`);
    return selected ? selected.getAttribute("data-testid").replace("-radio-label", "").toLowerCase() : "";
  }

  const privacy = getSettings("#SDHub-Gallery-imgchest-Privacy") || "hidden";
  const nsfw = getSettings("#SDHub-Gallery-imgchest-NSFW") || "true";

  const data = new FormData();
  files.forEach((img) => data.append("images[]", img));
  data.append("title", fn);
  data.append("privacy", privacy);
  data.append("nsfw", nsfw);

  return fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apikey.value.trim()}` },
    body: data,
  })
    .then((upload) => upload.json())
    .then((result) => {
      console.log("Uploaded:", result);
      return result;
    })
    .catch((error) => console.error("Upload failed:", error));
}
