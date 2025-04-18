let SDHubGalleryTabImageIndex = 1;
let SDHubGalleryCMRightClick = false;
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

onUiLoaded(SDHubCreateGallery);

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
    const res = await fetch(path);
    const blob = await res.blob();
    const name = path.split('/').pop().split('?')[0];
    return new File([blob], name, { type: blob.type });
  } catch (err) { console.error('Error in creating file:', err); return null; }
}

async function SDHubGalleryLoadInitial() {
  try {
    const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
    const data = await (await fetch(`${SDHubGalleryBase}/initial`)).json();

    if (!data.images?.length) return;

    let imgBox = document.getElementById('SDHub-Gallery-Image-Box-0');
    let selectedTab = false;
    const todayRegex = /^\d{4}-\d{2}-\d{2}$/;

    const processNextImage = async (index) => {
      if (index === data.images.length) {
        console.log('SD-Hub Gallery Loaded');
        SDHubGalleryTabImageCounters();
        requestAnimationFrame(() => (DelCon.style.display = DelCon.style.opacity = ''));
        return;
      }

      let { path } = data.images[index];
      let whichTab = SDHubGalleryTabList.find((tab) => path.includes(`/${tab}/`));
      let tabToUse = whichTab || 'extras-images';
      let pathParts = path.split('/');
      let dateIndex = pathParts.findIndex((part) => todayRegex.test(part));
      let parentFolder = dateIndex > 0 ? `${pathParts[dateIndex - 1]}-${pathParts[dateIndex]}` : '';

      if (!whichTab) {
        if (path.includes('?extras')) tabToUse = 'extras-images';
        else if (path.includes('?init')) tabToUse = 'init-images';
        else if (path.includes('?save')) tabToUse = 'manual-save';
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
        let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
        while (document.getElementById(newId)) {
          newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
        }

        newImgBox.id = newId;
        TabCon.prepend(newImgBox);
        SDHubGalleryImageButtonEvents(newImgBox);

        const img = newImgBox.querySelector('img');
        const name = path.split('/').pop().split('?')[0];
        const thumbnail = `${SDHubGalleryBase}/thumb/${name.replace(/\.[^/.]+$/, '.webp')}`;

        if (img) {
          requestAnimationFrame(() => (DelCon.style.display = 'flex', DelCon.style.opacity = '1'));
          img.dataset.image = path;
          img.src = thumbnail;
          img.title = name;
        }

        if (TabBtn) TabBtn.style.display = 'flex';
        if (!selectedTab) {
          TabCon.classList.add('active');
          TabCon.style.display = 'flex';
          counter.style.display = 'flex';
          TabBtn.classList.add('selected');
          selectedTab = true;
        }
      }

      processNextImage(index + 1);
    };

    processNextImage(0);

  } catch (err) {
    console.error('Error in initial-load:', err);
  }
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
  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Container']").forEach(tab => {
    const img = tab.querySelectorAll('img').length;
    const counter = document.getElementById(tab.id.replace('-Tab-Container', '-Tab-Image-Counter'));

    if (counter) {
      counter.textContent = img > 0 ? `${img} ${SDHubGetTranslation('item', img)}` : '';
      counter.style.visibility = img > 0 ? 'visible' : 'hidden';
    }
  });
}

function SDHubGalleryWatchNewImage() {
  let NewImage = new Set();
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

      if (!NewImage.has(key)) {
        New = true;
        NewImage.add(key);
      }
    });

    if (New) SDHubGalleryGetNewImage(whichGallery);
  });
}

async function SDHubGalleryGetNewImage(whichGallery) {
  try {
    let selectedTab = false;
    const imgBox = document.getElementById('SDHub-Gallery-Image-Box-0');
    const images = document.querySelectorAll(`#${whichGallery} > .preview > .thumbnails img`);
    const total = images.length;

    if (total === 0 || !imgBox) return;

    let imgNames = [];
    let imgPaths = [];

    const processNext = async (index) => {
      if (index === total) {
        SDHubGalleryTabImageCounters();
        if (imgPaths.length) SDHubGalleryImgChestUpload(imgPaths, imgNames);
        return;
      }

      const imgEL = images[index];
      const src = imgEL.getAttribute('src');
      if (!src || !src.includes('/file=')) return processNext(index + 1);

      const imgSrc = src.split('/file=')[1].split('?')[0];
      const name = imgSrc.split('/').pop().split('?')[0];
      const path = `${SDHubGalleryBase}/image${imgSrc}`;

      let whichTab = whichGallery === 'extras_gallery'
        ? 'extras-images' : imgSrc.includes('grid')
          ? `${whichGallery.split('_')[0]}-grids` : `${whichGallery.split('_')[0]}-images`;

      const TabCon = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`);
      const TabBtn = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Button`);
      const counter = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Image-Counter`);

      if (TabCon && imgBox) {
        const newimgBox = imgBox.cloneNode(true);
        let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
        while (document.getElementById(newId)) {
          newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
        }

        newimgBox.id = newId;
        TabCon.prepend(newimgBox);
        SDHubGalleryImageButtonEvents(newimgBox);

        const img = newimgBox.querySelector('img');
        if (img) {
          const res = await fetch(`${SDHubGalleryBase}/getthumb`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: imgSrc })
          });

          if (!res.ok) throw new Error('Failed thumbnail');

          const data = await res.json();
          img.dataset.image = path;
          img.src = data.status;
          img.title = name;

          imgNames.push(name);
          imgPaths.push(path);
        }

        if (TabBtn) TabBtn.style.display = 'flex';
        if (!selectedTab) {
          TabCon.classList.add('active');
          TabCon.style.display = 'flex';
          counter.style.display = 'flex';
          TabBtn.classList.add('selected');
          selectedTab = true;
        }
      }

      processNext(index + 1);
    };

    processNext(0);

  } catch (err) {
    console.error('Error in SDHubGalleryGetNewImage:', err);
  }
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
  const TabCon = imgEL.closest('.sdhub-gallery-tab-container');

  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageList = [...TabCon.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);

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

  posX = spaceRight >= menuWidth ? (originX = 'left', cursorX) : (originX = 'right', cursorX - menuWidth);
  posY = spaceBelow >= menuHeight ? (originY = 'top', cursorY) : (originY = 'bottom', cursorY - menuHeight);

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
    Object.assign(GalleryCM.style, { transition: '', transform: 'scale(1)', opacity: '1' });
    setTimeout(() => SDHubGallerySubmenu(), 200);
  });
}

function SDHubGallerySubmenu() {
  const submenu = document.querySelector('.sdhub-gallery-cm-submenu');
  const ul = document.querySelector('.sdhub-gallery-cm-submenu > ul');
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
  Object.assign(GalleryCM.style, { transition: 'none', opacity: '', pointerEvents: '', transform: '' });
}

function SDHubGalleryImageButtonEvents(imgBox) {
  const Btn = imgBox.querySelector('.sdhub-gallery-image-button-contextmenu');
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');

  Btn.addEventListener('mouseenter', (e) => {
    if (GalleryCM.style.opacity === '1') {
      SDHubGalleryCMRightClick ? SDHubGalleryKillContextMenu() : null;
      if (!SDHubGalleryCMRightClick) return;
    }

    const imgEL = imgBox.querySelector('img');
    SDHubGalleryCMRightClick = false;
    GalleryCM.dataset.targetBtn = Btn;
    SDHubGalleryContextMenu(e, imgEL);
  });

  GalleryCM.addEventListener('mouseleave', () => {
    if (!GalleryCM.matches(':hover') && !SDHubGalleryCMRightClick) SDHubGalleryKillContextMenu();
  });
}

async function SDHubGalleryContextButton(v) {
  const path = window.SDHubImagePath;
  const img = document.querySelector(`img[data-image='${path}']`);
  SDHubGalleryKillContextMenu();

  switch (v) {
    case 'open':
      window.open(path, '_blank');
      break;

    case 'download':
      const link = Object.assign(document.createElement('a'), { 
        href: path, 
        download: img?.title
      });
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      break;

    case 'copy':
      const file = await SDHubGalleryCreateImageFile(path);
      if (file) await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
      break;

    case 'info':
      if (img) SDHubGalleryImageInfo(img, new Event('click'));
      break;

    case 'viewer':
      SDHubGalleryImageViewer('m');
      break;

    case 'delete':
      SDHubGalleryDeletion();
      break;
  }
}

function SDHubGallerySendToUploader() {
  const area = document.querySelector('#sdhub-uploader-inputs textarea');
  const path = decodeURIComponent(window.SDHubImagePath.slice(`${SDHubGalleryBase}/image`.length));
  area.value += area.value ? `\n${path}` : path;
  updateInput(area);
  SDHubGalleryKillContextMenu();
}

async function SDHubGallerySendImage(v) {
  const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
  const input = document.querySelector('#SDHub-Gallery-Info-Image input');
  const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');

  SDHubGalleryKillContextMenu();
  window.SDHubCenterElement('Spinner');

  infoColumn.style.display = 'flex'; infoColumn.style.pointerEvents = 'none';
  DelCon.style.display = 'flex'; DelCon.style.opacity = '1'; Spinner.style.display = 'flex';

  await SDHubGalleryUpdateImageInput(input, window.SDHubImagePath);

  const wait = setInterval(() => {
    if (window.SDHubGalleryInfoRawOutput?.trim()) {
      clearInterval(wait);

      const SendButton = document.querySelector(`#SDHub-Gallery-Info-SendButton > #${v}_tab`);
      if (SendButton) {
        setTimeout(() => SendButton.click(), 1000);
        setTimeout(() => {
          infoColumn.style.display = ''; infoColumn.style.pointerEvents = '';
          DelCon.style.opacity = ''; DelCon.style.display = ''; Spinner.style.display = '';
        }, 1300);
      }
    }
  }, 100);
}

async function SDHubGalleryImageInfo(imgEL) {
  const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
  const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  DelCon.style.display = 'flex';
  window.SDHubCenterElement('Spinner');

  window.SDHubImagePath = imgEL.getAttribute('data-image');
  const input = document.querySelector('#SDHub-Gallery-Info-Image input');

  if (input) {
    requestAnimationFrame(() => {
      Spinner.style.display = 'flex'; DelCon.style.opacity = '1';
      infoColumn.style.display = 'flex'; infoColumn.style.pointerEvents = 'none';
    });

    await SDHubGalleryUpdateImageInput(input, window.SDHubImagePath);
    document.body.classList.add('no-scroll');

    requestAnimationFrame(() => {
      setTimeout(() => {
        DelCon.style.display = ''; DelCon.style.opacity = ''; Spinner.style.display = '';
        infoColumn.style.pointerEvents = ''; infoColumn.style.opacity = '1';
      }, 300);
    });
  }
}

function SDHubGalleryTabEventListener(TabCon) {
  TabCon.addEventListener('contextmenu', e => e.preventDefault());
  TabCon.ondrag = TabCon.ondragend = TabCon.ondragstart = e => (e.stopPropagation(), e.preventDefault());

  TabCon.addEventListener('click', (e) => {
    const imgEL = e.target.closest('img');
    const viewerBtn = e.target.closest('.sdhub-gallery-image-button-imageviewer');

    if (imgEL) SDHubGalleryImageInfo(imgEL);

    if (viewerBtn) {
      const img = viewerBtn.closest('.sdhub-gallery-image-container')?.querySelector('img');
      if (img) SDHubGalleryOpenViewerFromButton(img);
    }
  });

  TabCon.addEventListener('mousemove', (e) => {
    const isInsideCM = document.getElementById('SDHub-Gallery-ContextMenu')?.matches(':hover');
    const isInsideContainer = e.target.closest('.sdhub-gallery-image-container')?.matches(':hover');

    if (!isInsideCM && !isInsideContainer && !SDHubGalleryCMRightClick) {
      SDHubGalleryKillContextMenu();
    }
  });

  TabCon.addEventListener('contextmenu', (e) => {
    const imgEL = e.target.closest('img');
    if (!imgEL || !TabCon.contains(imgEL)) return SDHubGalleryKillContextMenu();
    e.preventDefault(), SDHubGalleryCMRightClick = true, SDHubGalleryContextMenu(e, imgEL);
  });
}

async function SDHubGalleryDeletion() {
  const imgEL = document.querySelector(`img[data-image='${window.SDHubImagePath}']`);
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
    Spinner.style.display = 'flex';
    Object.assign(DelBox.style, { opacity: '0', transform: 'scale(1.5)' });

    try {
      const res = await fetch(`${SDHubGalleryBase}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.status === 'deleted') imgEL.closest('.sdhub-gallery-image-box')?.remove();
      else console.error('Deletion failed:', data);
    } catch (err) {
      console.error('Error deleting image:', err);
    } finally {
      SDHubGalleryTabImageCounters();
      setTimeout(() => {
        DelCon.style.opacity = '';
        Spinner.style.display = '';
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

function SDHubCreateGallery() {
  const GalleryTab = document.getElementById('sdhub-gallery-tab');
  const SDHubGallery = document.getElementById('SDHubGallery');

  if (GalleryTab && SDHubGallery) {
    const sendButton = document.getElementById('SDHub-Gallery-Info-SendButton');
    sendButton?.querySelectorAll('#txt2img_tab, #img2img_tab').forEach(btn => {
      btn.onclick = () => SDHubGallerySendButton(btn.id.replace('_tab', ''));
    });

    const Panel = document.getElementById('SDHub-Gallery-Info-Output-Panel');
    const imgArea = document.createElement('div');
    imgArea.id = 'SDHub-Gallery-Info-img-area'
    imgArea.onclick = () => document.querySelector('#SDHub-Gallery-Info-Image img')?.click();
    Panel.prepend(imgArea);

    const input = document.querySelector('#SDHub-Gallery-Info-Image input');
    const imgFrame = document.createElement('div');
    imgFrame.id = 'SDHub-Gallery-Info-img-frame';
    input?.parentNode?.insertBefore(imgFrame, input);

    SDHubGallery.style.display = '';
    const DelCon = SDHubGallery.querySelector('#SDHub-Gallery-Delete-Container');
    const TabRow = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Button-Row');
    const TabWrap = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Wrapper');
    const imgBox = SDHubGallery.querySelector('#SDHub-Gallery-Image-Box-0');

    GalleryTab.prepend(DelCon, TabRow, TabWrap, imgBox);

    const imgchestColumn = document.getElementById('SDHub-Gallery-imgchest-Column');
    if (imgchestColumn) SDHubGalleryCreateimgChest(GalleryTab, TabRow, imgchestColumn);

    onAfterUiUpdate(SDHubGalleryWatchNewImage);
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

  document.body.appendChild(link);

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
  imgCon.classList.add('sdhub-gallery-image-container');

  const img = document.createElement('img');
  img.classList.add('sdhub-gallery-image');
  img.src = 'https://huggingface.co/gutris1/webui/resolve/main/misc/card-no-preview.png'

  const ContextBtn = document.createElement('span');
  ContextBtn.innerHTML = SDHubGalleryImageButtonSVG;
  ContextBtn.classList.add('sdhub-gallery-image-button-contextmenu', 'sdhub-gallery-image-button');

  const ViewerBtn = document.createElement('span');
  ViewerBtn.classList.add('sdhub-gallery-image-button-imageviewer', 'sdhub-gallery-image-button');
  ViewerBtn.title = SDHubGetTranslation('image_viewer');
  ViewerBtn.innerHTML = SDHubGalleryImageSVG;
  const ViewerBtnSVG = ViewerBtn.querySelector('svg');
  if (ViewerBtnSVG) ViewerBtnSVG.classList.remove('sdhub-gallery-cm-svg');

  const eFrame = document.createElement('div');
  eFrame.classList.add('sdhub-gallery-image-emptyframe');

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
      !e.target.closest('.sdhub-gallery-image-button-contextmenu')
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
    const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
    if (e.key === 'Escape' && infoColumn && window.getComputedStyle(infoColumn).display === 'flex') {
      const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
      if (LightBox?.style.display === 'flex') return;
      else e.stopPropagation(), e.preventDefault(), window.SDHubGalleryInfoClearImage();
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
  GalleryCM.classList.add('sdhub-gallery-cm-menu');
  GalleryCM.innerHTML = `
    <ul class='sdhub-gallery-cm-ul'>
      <li onclick='SDHubGalleryContextButton("open")'>
        <span>${SDHubGalleryOpenNewTabSVG} ${SDHubGetTranslation('open_new_tab')}</span>
      </li>
      <li onclick='SDHubGalleryContextButton("download")'>
        <span>${SDHubGalleryDLSVG} ${SDHubGetTranslation('download')}</span>
      </li>
      <li onclick='SDHubGalleryContextButton("copy")'>
        <span>${SDHubGalleryCopySVG} ${SDHubGetTranslation('copy')}</span>
      </li>
      <li onclick='SDHubGalleryContextButton("info")'>
        <span>${SDHubGalleryImageInfoSVG} ${SDHubGetTranslation('image_info')}</span>
      </li>
      <li onclick='SDHubGalleryContextButton("viewer")'>
        <span>${SDHubGalleryImageSVG} ${SDHubGetTranslation('image_viewer')}</span>
      </li>
      <li class='sdhub-cm-sendto'>
        <span>${SDHubGallerySendToSVG} ${SDHubGetTranslation('send_to')} ${SDHubGalleryARRSVG}</span>
        <div id='SDHub-Gallery-ContextMenu-SubMenu' class='sdhub-gallery-cm-menu sdhub-gallery-cm-submenu'>
          <ul class='sdhub-gallery-cm-ul'>
            <li onclick='SDHubGallerySendImage("txt2img")'>txt2img</li>
            <li onclick='SDHubGallerySendImage("img2img")'>img2img</li>
            <li onclick='SDHubGallerySendImage("extras")'>extras</li>
            <li onclick='SDHubGallerySendImage("inpaint")'>inpaint</li>
            <li onclick='SDHubGallerySendToUploader()'>${SDHubGetTranslation('uploader')}</li>
          </ul>
        </div>
      </li>
      <li onclick='SDHubGalleryContextButton("delete")'>
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
  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Container']").forEach(Tab => {
    Tab.style.display = 'none';
    Tab.classList.remove('active');

    const counter = document.getElementById(Tab.id.replace('-Tab-Container', '-Tab-Image-Counter'));
    if (counter) counter.style.display = 'none';
  });

  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Button']").forEach(Btn => {
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

  const checkboxInput = document.querySelector('#SDHub-Gallery-imgchest-Checkbox input');
  const checkboxSpan = document.querySelector('#SDHub-Gallery-imgchest-Checkbox span');
  if (checkboxSpan) checkboxSpan.textContent = SDHubGetTranslation('click_to_enable');

  document.querySelectorAll('#SDHub-Gallery-imgchest-Info').forEach(el => {
    if (el.textContent.includes('Auto Upload to')) {
      el.innerHTML = `${SDHubGetTranslation('auto_upload_to')}
        <a class='sdhub-gallery-imgchest-info' href='https://imgchest.com' target='_blank'>
          imgchest.com
        </a>`;
    }
  });

  ['#SDHub-Gallery-imgchest-Privacy', '#SDHub-Gallery-imgchest-NSFW'].forEach(id =>
    document.querySelectorAll(`${id} label > span`).forEach(s => s.textContent = SDHubGetTranslation(s.textContent.toLowerCase()))
  );

  const apiInput = document.querySelector('#SDHub-Gallery-imgchest-API input');
  apiInput?.setAttribute('placeholder', SDHubGetTranslation('imgchest_api_key'));
  apiInput?.addEventListener('mousedown', () => {
    fromColumn = window.getComputedStyle(imgchestColumn).display === 'flex';
  });

  ['Save', 'Load'].forEach(key => {
    const btn = document.getElementById(`SDHub-Gallery-imgchest-${key}-Button`);
    if (btn) {
      btn.title = SDHubGetTranslation(`${key.toLowerCase()}_setting`);
      btn.textContent = SDHubGetTranslation(key.toLowerCase());
    }
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

  document.addEventListener('change', () => {
    checkboxSpan.style.color = checkboxInput.checked ? 'var(--background-fill-primary)' : '';
    checkboxSpan.textContent = SDHubGetTranslation(checkboxInput.checked ? 'enabled' : 'click_to_enable');
    imgchestButton.style.background = checkboxInput.checked ? 'var(--primary-400)' : 'var(--background-fill-secondary)';
    imgchestButton.style.boxShadow = checkboxInput.checked ? '0 0 10px 1px var(--primary-400)' : '';
    imgchestButton.style.border = checkboxInput.checked ? '1px solid var(--primary-400)' : '1px solid var(--background-fill-secondary)';
  });

  fetch(`${SDHubGalleryBase}/imgChest`)
    .then(r => r.json())
    .then(d => {
      const clickRadio = (id, v) => document.querySelector(`${id} label[data-testid='${v}-radio-label']`)?.click();
      clickRadio('#SDHub-Gallery-imgchest-Privacy', d.privacy);
      clickRadio('#SDHub-Gallery-imgchest-NSFW', d.nsfw);
      if (apiInput) apiInput.value = d.api, updateInput(apiInput);
    })
    .catch(e => console.error('Error loading imgchest settings:', e));
}

async function SDHubGalleryImgChestUpload(paths, names) {
  if (!gradioApp().querySelector('#SDHub-Gallery-imgchest-Checkbox input')?.checked) return;

  const apikey = gradioApp().querySelector('#SDHub-Gallery-imgchest-API input')?.value.trim();
  if (!apikey) return;

  const getSettings = (id) => gradioApp().querySelector(`${id} > div > label.selected`)?.getAttribute('data-testid')?.replace('-radio-label', '').toLowerCase() || '';
  const [privacy, nsfw] = ['#SDHub-Gallery-imgchest-Privacy', '#SDHub-Gallery-imgchest-NSFW'].map(getSettings);

  const sorted = paths.map((path, i) => ({ path, name: names[i] })).sort((a, b) => b.name.includes('grid-') - a.name.includes('grid-'));
  const files = await Promise.all(sorted.map(({ path }) => SDHubGalleryCreateImageFile(path)));

  const data = new FormData();
  files.forEach(file => file && data.append('images[]', file));
  data.append('title', sorted.length > 1 && sorted.some(item => item.name.includes('grid-')) ? sorted[1].name : sorted[0].name);
  data.append('privacy', privacy || 'hidden');
  data.append('nsfw', nsfw || 'true');

  try {
    const result = await fetch('https://api.imgchest.com/v1/post', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apikey}` },
      body: data,
    }).then(res => res.json());

    console.log('Uploaded:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
