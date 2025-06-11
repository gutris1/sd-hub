let SDHubGalleryBase = '/sd-hub-gallery';
let SDHubGalleryTabImageIndex = 1;
let SDHubGalleryCMRightClick = false;
let SDHubGalleryNewImageSrc = new Set();
let SDHubGalleryPageLimit = 100;
let SDHubGalleryPageLocks = {};

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

function SDHubGalleryCreateImagePages(wrapper, imageBoxes) {
  let navBox = document.getElementById('SDHub-Gallery-Page-Nav-Box'); navBox.style.display = 'flex';
  let existingPages = wrapper.querySelectorAll('.sdhub-gallery-pages');
  let totalPages = existingPages.length;
  let page = existingPages[totalPages - 1];
  let imagesInLastPage = page ? page.querySelectorAll('.sdhub-gallery-image-box').length : 0;

  for (const imgBox of imageBoxes) {
    if (!page || imagesInLastPage >= SDHubGalleryPageLimit) {
      page = document.createElement('div');
      page.className = 'sdhub-gallery-pages';
      page.dataset.page = totalPages++;
      page.addEventListener('scroll', window.SDHubGalleryArrowScrolling);
      wrapper.append(page);
      imagesInLastPage = 0;
    }

    page.prepend(imgBox);
    imagesInLastPage++;
  }

  if (totalPages === 1) (page.classList.add('selected-page'), page.style.opacity = '1');

  return totalPages;
}

function SDHubGallerySwitchPage(tabName, direction = null, targetIndex = null) {
  if (SDHubGalleryPageLocks[tabName]) return;
  let selected = 'selected-page';

  const TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`);
  const wrapper = TabCon.querySelector('.sdhub-gallery-page-wrapper');
  const pages = Array.from(wrapper.children);
  if (pages.length === 0) return;

  let pageIndex = pages.findIndex(p => p.classList.contains(selected));
  if (pageIndex === -1) pageIndex = 0;

  const newIndex = targetIndex !== null
    ? targetIndex : direction === 'left'
      ? Math.min(pageIndex + 1, pages.length - 1) : direction === 'right'
        ? Math.max(pageIndex - 1, 0) : pageIndex;

  if (newIndex === pageIndex) return;

  const currentPage = pages[pageIndex];
  const newPage = pages[newIndex];
  SDHubGalleryPageLocks[tabName] = true;

  requestAnimationFrame(() => {
    currentPage.style.opacity = '';
    currentPage.classList.remove(selected);
    newPage.classList.add(selected);

    requestAnimationFrame(() => {
      newPage.style.opacity = '1';
      SDHubGalleryPageLocks[tabName] = false;
      setTimeout(() => window.SDHubGalleryArrowScrolling(), 0);
    });
  });

  const pageNav = TabCon.querySelector('.sdhub-gallery-page-nav');
  const rightNavButton = pageNav?.querySelector('.sdhub-gallery-page-right-button');
  const leftNavButton = pageNav?.querySelector('.sdhub-gallery-page-left-button');
  const pageIndicator = pageNav?.querySelector('.sdhub-gallery-page-indicator');

  if (rightNavButton) rightNavButton.classList.toggle('btn-on', newIndex > 0);
  if (leftNavButton) leftNavButton.classList.toggle('btn-on', newIndex < pages.length - 1);
  if (pageIndicator) pageIndicator.textContent = `${newIndex + 1} / ${pages.length}`;
}

function SDHubGallerySwitchTab(whichTab) {
  const Btn = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Button`);
  if (Btn?.classList.contains('selected')) return;

  const Tab = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`);
  const counter = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Image-Counter`);

  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Container']").forEach(tab => {
    tab.style.display = 'none';
    tab.classList.remove('active');
    const count = document.getElementById(tab.id.replace('-Tab-Container', '-Tab-Image-Counter'));
    if (count) count.style.display = 'none';
  });

  document.querySelectorAll("[id^='SDHub-Gallery-'][id$='-Tab-Button']").forEach(btn => {
    btn.classList.remove('selected');
  });

  if (Tab) {
    Tab.style.display = 'flex';
    Tab.classList.add('active');
    if (counter) counter.style.display = 'flex';
  }

  if (Btn) Btn.classList.add('selected');

  const page = Tab?.querySelector('.sdhub-gallery-pages.selected-page');
  if (page) {
    page.style.transition = 'none';
    page.style.opacity = '';

    requestAnimationFrame(() => {
      page.style.transition = '';
      page.style.opacity = '1';
    });
  }

  setTimeout(() => window.SDHubGalleryArrowScrolling(), 0);
}

function SDHubGalleryTabEvents(TabCon) {
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

  TabCon.addEventListener('contextmenu', (e) => {
    const imgEL = e.target.closest('img');
    if (!imgEL || !TabCon.contains(imgEL)) return SDHubGalleryKillContextMenu();
    e.preventDefault(), SDHubGalleryCMRightClick = true, SDHubGalleryContextMenu(e, imgEL);
  });

  TabCon.addEventListener('mousemove', (e) => {
    const isInsideCM = document.getElementById('SDHub-Gallery-ContextMenu')?.matches(':hover');
    const isInsideContainer = e.target.closest('.sdhub-gallery-image-container')?.matches(':hover');
    if (!isInsideCM && !isInsideContainer && !SDHubGalleryCMRightClick) setTimeout(() => SDHubGalleryKillContextMenu(), 100);
  });
}

async function SDHubGalleryLoadInitial(retry = 1000) {
  try {
    const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
    const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');

    DelCon.style.display = Spinner.style.display = 'flex';
    DelCon.style.position = Spinner.style.position = 'relative';
    DelCon.style.opacity = '1';

    const res = await fetch(`${SDHubGalleryBase}/initial`);
    const data = await res.json();

    if (data.status === 'waiting') {
      setTimeout(() => SDHubGalleryLoadInitial(retry), retry);
      return;
    }

    if (!data.images?.length) {
      DelCon.style.opacity = DelCon.style.display = DelCon.style.position = Spinner.style.display = Spinner.style.position = '';
      return;
    }

    const imgBox = document.getElementById('SDHub-Gallery-Image-Box-0');
    const todayRegex = /^\d{4}-\d{2}-\d{2}$/;
    const tabMap = new Map();
    let selectedTab = false;

    for (let i = data.images.length - 1; i >= 0; i--) {
      let { path } = data.images[i];
      let tabToUse = SDHubGalleryTabList.find((tab) => path.includes(`/${tab}/`)) || 'extras-images';
      if (tabToUse === 'extras-images') {
        if (path.includes('?init')) tabToUse = 'init-images';
        else if (path.includes('?save')) tabToUse = 'manual-save';
        else {
          const pathParts = path.split('/');
          const dateIndex = pathParts.findIndex((part) => todayRegex.test(part));
          const parentFolder = dateIndex > 0 ? `${pathParts[dateIndex - 1]}-${pathParts[dateIndex]}` : '';
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

    for (const [tabName, images] of tabMap.entries()) {
      const TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`);
      const wrapper = TabCon.querySelector('.sdhub-gallery-page-wrapper');
      const TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row');
      const TabBtn = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Button`);
      const Counter = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Image-Counter`);

      const imageBoxes = images.map(({ path }) => {
        const newImgBox = imgBox.cloneNode(true);
        let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
        while (document.getElementById(newId)) newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
        newImgBox.id = newId;
        SDHubGalleryImageButtonEvents(newImgBox);

        const img = newImgBox.querySelector('img');
        const name = path.split('/').pop().split('?')[0];
        const thumb = `${SDHubGalleryBase}/thumb/${name.replace(/\.[^/.]+$/, '.jpeg')}`;
        const nameBox = newImgBox.querySelector('.sdhub-gallery-image-name');

        if (nameBox) nameBox.textContent = name;
        if (img) {
          img.loading = 'lazy';
          img.dataset.image = path;
          img.title = name;

          const loadThumb = new Image();
          loadThumb.src = thumb;
          loadThumb.onload = () => img.src = thumb;
        }

        return newImgBox;
      });

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

    DelCon.style.opacity = DelCon.style.display = DelCon.style.position = Spinner.style.display = Spinner.style.position = '';
    SDHubGalleryTabImageCounters();
    console.log('SD-Hub Gallery Loaded');
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
  TabCon.addEventListener('scroll', window.SDHubGalleryArrowScrolling);
  TabWrap.append(TabCon);

  let exCounter = document.querySelector('.sdhub-gallery-tab-image-counter');
  let counter = exCounter.cloneNode(true);
  counter.id = `SDHub-Gallery-${id}-Tab-Image-Counter`;
  counter.style.display = 'none';
  TabCounter.append(counter);

  SDHubGalleryTabEvents(TabCon);
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
  let imgBox = document.getElementById('SDHub-Gallery-Image-Box-0');
  let imgNames = [];
  let imgPaths = [];
  let loaded = 0;
  let selectedTab = false;

  const tabImageMap = new Map();

  let newImg = Array.from(document.querySelectorAll(`#${whichGallery} > .preview > .thumbnails img`)).sort((a, b) => {
    const gridImg = a.getAttribute('src')?.includes('grid-') ? 1 : 0;
    const gridNot = b.getAttribute('src')?.includes('grid-') ? 1 : 0;
    return gridImg - gridNot;
  });

  for (let index = 0; index < newImg.length; index++) {
    const imgEL = newImg[index];
    let src = imgEL.getAttribute('src');
    if (!src || !src.includes('/file=')) continue;

    let imgSrc = src.split('/file=')[1].split('?')[0];
    let whichTab = whichGallery === 'extras_gallery'
      ? 'extras-images' : imgSrc.includes('grid-')
        ? `${whichGallery.split('_')[0]}-grids` : `${whichGallery.split('_')[0]}-images`;

    const TabCon = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Container`);
    if (!TabCon || !imgBox) continue;

    const newImgBox = imgBox.cloneNode(true);
    let newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
    while (document.getElementById(newId)) newId = `SDHub-Gallery-Image-Box-${SDHubGalleryTabImageIndex++}`;
    newImgBox.id = newId;
    SDHubGalleryImageButtonEvents(newImgBox);

    if (!tabImageMap.has(whichTab)) tabImageMap.set(whichTab, []);
    tabImageMap.get(whichTab).push({ newImgBox, imgSrc });
  }

  for (const [tabName, images] of tabImageMap.entries()) {
    const TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`);
    const wrapper = TabCon.querySelector('.sdhub-gallery-page-wrapper');
    const TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row');
    const TabBtn = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Button`);
    const Counter = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Image-Counter`);
    const imageBoxes = [];

    for (const { newImgBox, imgSrc } of images) {
      let img = newImgBox.querySelector('img');
      let path = `${SDHubGalleryBase}/image=${imgSrc}`;
      let name = path.split('/').pop().split('?')[0];
      let nameBox = newImgBox.querySelector('.sdhub-gallery-image-name');
      if (nameBox) nameBox.textContent = name;

      const res = await fetch(`${SDHubGalleryBase}/getthumb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: imgSrc })
      });

      if (!res.ok) { console.error('Thumbnail failed:', res.statusText); continue; }
      const data = await res.json();

      if (img) {
        img.loading = 'lazy';
        img.dataset.image = path;
        img.title = name;

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
    if (!selectedTab && !document.querySelector('.sdhub-gallery-tab-container.active')) {
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
      await fetch(`${SDHubGalleryBase}/newimage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: imgPaths })
      });
    } catch (err) {
      console.error('Failed to notify /newimage:', err);
    }
  }

  SDHubGalleryTabImageCounters();
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
  const page = imgEL.closest('.sdhub-gallery-pages.selected-page');

  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageList = [...page.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);

  Object.assign(GalleryCM.style, {
    transition: 'none', left: '', right: '', top: '', bottom: '', opacity: '',
    pointerEvents: 'none', transform: 'scale(0)', visibility: 'hidden',
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
  SDHubGalleryCMRightClick = false;
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');
  Object.assign(GalleryCM.style, { opacity: '', transition: 'none', pointerEvents: '', transform: '' });
}

function SDHubGalleryImageButtonEvents(imgBox) {
  const contextBtn = imgBox.querySelector('.sdhub-gallery-image-button-contextmenu');
  const GalleryCM = document.getElementById('SDHub-Gallery-ContextMenu');

  let hover = null;

  contextBtn.addEventListener('mouseenter', (e) => {
    if (!SDHubGalleryCMRightClick && GalleryCM.style.opacity === '1' && GalleryCM.dataset.box === imgBox.id) return;

    hover = setTimeout(() => {
      const imgEL = imgBox.querySelector('img');
      SDHubGalleryCMRightClick = false;
      GalleryCM.dataset.box = imgBox.id;
      SDHubGalleryContextMenu(e, imgEL);
    }, 300);
  });

  contextBtn.addEventListener('mouseleave', () => {
    clearTimeout(hover);
    hover = null;
  });
}

function SDHubGalleryContextMenuImage() {
  SDHubGalleryKillContextMenu();

  const path = window.SDHubImagePath;
  const img = document.querySelector(`img[data-image='${path}']`);
  if (!img) return { img: null, path };

  img.classList.add('sdhub-gallery-img-pulse');
  setTimeout(() => img.classList.remove('sdhub-gallery-img-pulse'), 2000);

  return { img, path };
}

async function SDHubGalleryContextMenuButton(v) {
  const { img, path } = SDHubGalleryContextMenuImage();

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

async function SDHubGallerySendImage(v) {
  const { img, path } = SDHubGalleryContextMenuImage();

  if (v === 'uploader') {
    const area = document.querySelector('#SDHub-Uploader-Input textarea');
    const imgPath = decodeURIComponent(path.slice(`${SDHubGalleryBase}/image=`.length));
    area.value += area.value ? `\n${imgPath}` : imgPath;
    updateInput(area);
    return;
  }

  const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
  const input = document.querySelector('#SDHub-Gallery-Info-Image input');
  const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');

  window.SDHubCenterElement('Spinner');

  infoColumn.style.display = DelCon.style.display = Spinner.style.display = 'flex';
  infoColumn.style.pointerEvents = 'none';
  DelCon.style.opacity = '1';

  await SDHubGalleryUpdateImageInput(input, path);

  const wait = setInterval(() => {
    if (window.SDHubGalleryInfoRawOutput?.trim()) {
      clearInterval(wait);

      const SendButton = document.querySelector(`#SDHub-Gallery-Info-SendButton > #${v}_tab`);
      if (SendButton) {
        setTimeout(() => SendButton.click(), 1000);
        setTimeout(() => {
          infoColumn.style.display = infoColumn.style.pointerEvents = '';
          DelCon.style.opacity = DelCon.style.display = Spinner.style.display = '';
        }, 1300);
      }
    }
  }, 100);
}

async function SDHubGalleryImageInfo(imgEL) {
  const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
  const imgPanel = document.getElementById('SDHub-Gallery-Info-Image');
  const input = imgPanel.querySelector('input');

  const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');

  DelCon.style.display = 'flex';
  window.SDHubCenterElement('Spinner');
  window.SDHubImagePath = imgEL.getAttribute('data-image');

  if (input) {
    requestAnimationFrame(() => {
      Spinner.style.display = infoColumn.style.display = 'flex';
      DelCon.style.opacity = '1'; infoColumn.style.pointerEvents = 'none';
    });

    document.body.classList.add(SDHubBnS);
    await SDHubGalleryUpdateImageInput(input, window.SDHubImagePath);

    const display = () => setTimeout(() => {
      infoColumn.style.opacity = '1';
      infoColumn.style.pointerEvents = '';
      setTimeout(() => DelCon.style.display = DelCon.style.opacity = Spinner.style.display = '', 400);
      setTimeout(() => window.SDHubGalleryImageInfoArrowScrolling(), 0);
    }, 100);

    (function check() {
      const img = imgPanel.querySelector('img');
      img ? requestAnimationFrame(display) : requestAnimationFrame(check);
    })();
  }
}

async function SDHubGalleryDeletion() {
  const imgEL = document.querySelector(`img[data-image='${window.SDHubImagePath}']`);
  const path = decodeURIComponent(window.SDHubImagePath).replace(new RegExp(`^${SDHubGalleryBase}/image=`), '');
  const name = decodeURIComponent(window.SDHubImagePath.split('/').pop());

  const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  const DelBox = document.getElementById('SDHub-Gallery-Delete-Box');
  const Text = document.getElementById('SDHub-Gallery-Delete-Text');
  const Yes = document.getElementById('SDHub-Gallery-Delete-Yes');
  const No = document.getElementById('SDHub-Gallery-Delete-No');

  DelCon.style.display = 'flex';
  Text.textContent = `${SDHubGetTranslation('delete')} ${name}?`;
  document.body.classList.add(SDHubBnS);

  window.SDHubCenterElement('DelBox');
  window.SDHubCenterElement('Spinner');

  Yes.onclick = async () => {
    Spinner.style.display = 'flex';
    DelBox.style.opacity = '0';
    DelBox.style.transform = 'scale(1.5)';

    try {
      const thumb = `${SDHubGalleryBase}/thumb/${name.replace(/\.[^/.]+$/, '.jpeg')}`;
      const res = await fetch(`${SDHubGalleryBase}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, thumb }),
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
        DelCon.style.opacity = Spinner.style.display = '';
        document.body.classList.remove(SDHubBnS);
      }, 1000);
      setTimeout(() => {
        DelCon.style.display = DelBox.style.opacity = DelBox.style.transform = '';
        Yes.onclick = null;
      }, 1100);
    }
  };

  No.onclick = () => {
    document.body.classList.remove(SDHubBnS);
    DelCon.style.opacity = '';
    DelBox.style.transform = 'scale(1.5)';
    setTimeout(() => (DelCon.style.display = DelBox.style.transform = '', No.onclick = null), 200);
  };

  requestAnimationFrame(() => (DelCon.style.opacity = '1', DelBox.style.transform = 'scale(1)'));
}

function SDHubCreateGallery() {
  const GalleryTab = document.getElementById('SDHub-Gallery-Tab');
  const SDHubGallery = document.getElementById('SDHubGallery');

  if (GalleryTab && SDHubGallery) {
    SDHubGallery.style.display = '';
    const DelCon = SDHubGallery.querySelector('#SDHub-Gallery-Delete-Container');
    const TabRow = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Button-Row');
    const TabWrap = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Wrapper');
    const imgBox = SDHubGallery.querySelector('#SDHub-Gallery-Image-Box-0');
    const Setting = SDHubGallery.querySelector('#SDHub-Gallery-Setting');
    const SettingButton = SDHubGallery.querySelector('#SDHub-Gallery-Setting-Button');

    const SetSet = Setting.querySelector('#SDHub-Gallery-Setting-Setting');
    const repo = document.querySelector('#SDHub-Repo > a');
    SetSet && repo && SetSet.append(repo.cloneNode(true));

    GalleryTab.prepend(SettingButton, Setting, DelCon, TabRow, TabWrap, imgBox);

    const imgchestColumn = document.getElementById('SDHub-Gallery-imgchest-Column');
    if (imgchestColumn) SDHubGalleryCreateimgChest(GalleryTab, imgchestColumn);

    const sendButton = document.getElementById('SDHub-Gallery-Info-SendButton');
    sendButton?.querySelectorAll('#txt2img_tab, #img2img_tab').forEach(btn => {
      btn.onclick = () => SDHubGallerySendButton(btn.id.replace('_tab', ''));
    });

    const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
    infoColumn.append(SDHubGallery.querySelector('#SDHub-Gallery-Image-Info-Arrow'));
    infoColumn.addEventListener('scroll', window.SDHubGalleryImageInfoArrowScrolling);

    const imgCon = document.querySelector('#SDHub-Gallery-Info-Image > .image-container');
    const imgFrame = document.createElement('div');
    imgFrame.id = 'SDHub-Gallery-Info-img-frame';

    const clearButton = document.createElement('div');
    clearButton.id = 'SDHub-Gallery-Info-Clear-Button';
    clearButton.innerHTML = SDHubGalleryCloseButtonSVG;

    const clearImage = () => {
      const btn = document.querySelector('#SDHub-Gallery-Info-Image > div > div > div > button:nth-child(2)') ||
                  document.querySelector('.gradio-container-4-40-0 #SDHub-Gallery-Info-Image > div > div > button');

      infoColumn.style.opacity = '';
      document.body.classList.remove(SDHubBnS);
      setTimeout(() => (btn.click(), (infoColumn.style.display = ''), window.SDHubGalleryInfoRawOutput = ''), 200);
    };

    window.SDHubGalleryInfoClearImage = clearImage;
    clearButton.onclick = () => window.SDHubGalleryInfoClearImage();
    imgCon.append(clearButton, imgFrame);

    const Panel = document.getElementById('SDHub-Gallery-Info-Output-Panel');
    const imgArea = document.createElement('div');
    imgArea.id = 'SDHub-Gallery-Info-img-area'
    imgArea.onclick = () => document.querySelector('#SDHub-Gallery-Info-Image img')?.click();
    Panel.prepend(imgArea);
    Panel.addEventListener('scroll', window.SDHubGalleryImageInfoArrowScrolling);

    ['drop', 'dragover'].forEach(t => document.addEventListener(t, e => {
      const E = e.target.id === imgArea.id || e.target.classList?.contains('sdhub-gallery-info-output-content');
      E && (e.preventDefault(), e.stopPropagation());
    }));

    const HTMLPanel = document.getElementById('SDHub-Gallery-Info-HTML');
    HTMLPanel.classList.add('prose');

    SDHubGalleryLoadSettings();
    onAfterUiUpdate(SDHubGalleryWatchNewImage);
  }
}

function SDHubGalleryDOMLoaded() {
  const file = `${window.SDHubFilePath}styleGallery.css?${(Date.now() / 1000).toFixed(6)}`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.setAttribute('property', 'stylesheet');
  link.href = file;
  document.body.appendChild(link);

  const SDHubGallery = document.createElement('div');
  SDHubGallery.id = 'SDHubGallery';
  SDHubGallery.style.display = 'none';

  const Setting = document.createElement('div');
  Setting.id = 'SDHub-Gallery-Setting';
  Setting.setAttribute('tabindex', '0');

  const SettingButton = document.createElement('div');
  SettingButton.id = 'SDHub-Gallery-Setting-Button';
  SettingButton.innerHTML = SDHubGallerySettingSVG;
  SettingButton.title = SDHubGetTranslation('setting_title');

  const TabRow = document.createElement('div');
  TabRow.id = 'SDHub-Gallery-Tab-Button-Row';

  const TabWrap = document.createElement('div');
  TabWrap.id = 'SDHub-Gallery-Tab-Wrapper';

  const TabScroll = document.createElement('div');
  TabScroll.id = 'SDHub-Gallery-Tab-Scroll';
  TabScroll.innerHTML = SDHubGalleryTabScrollSVG;

  const ImageInfoArrow = document.createElement('div');
  ImageInfoArrow.id = 'SDHub-Gallery-Image-Info-Arrow';
  ImageInfoArrow.innerHTML = SDHubGalleryTabScrollSVG;

  const TabCounterCon = document.createElement('div');
  TabCounterCon.id = 'SDHub-Gallery-Tab-Counter-Container';

  const pageNavBox = document.createElement('div');
  pageNavBox.id = 'SDHub-Gallery-Page-Nav-Box';

  SDHubGalleryTabList.forEach(whichTab => {
    let btnTitle = whichTab.includes('-grids') ? whichTab : whichTab.split('-')[0].toLowerCase();

    const TabBtn = document.createElement('button');
    TabBtn.id = `SDHub-Gallery-${whichTab}-Tab-Button`;
    TabBtn.classList.add('lg', 'primary', 'gradio-button', 'svelte-cmf5ev', 'sdhub-gallery-tab-button');
    TabBtn.textContent = btnTitle;
    TabBtn.addEventListener('click', () => SDHubGallerySwitchTab(whichTab));

    const TabCon = document.createElement('div');
    TabCon.id = `SDHub-Gallery-${whichTab}-Tab-Container`;
    TabCon.className = 'sdhub-gallery-tab-container';

    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'sdhub-gallery-page-wrapper';
    TabCon.appendChild(pageWrapper);

    const pageNav = document.createElement('div');
    pageNav.className = 'sdhub-gallery-page-nav';

    const rightNavButton = document.createElement('button');
    rightNavButton.className = 'sdhub-gallery-page-right-button';
    rightNavButton.innerHTML = SDHubGalleryRightArrowSVG;
    rightNavButton.onclick = () => SDHubGallerySwitchPage(whichTab, 'right');

    const leftNavButton = document.createElement('button');
    leftNavButton.className = 'sdhub-gallery-page-left-button';
    leftNavButton.innerHTML = SDHubGalleryLeftArrowSVG;
    leftNavButton.onclick = () => SDHubGallerySwitchPage(whichTab, 'left');

    const pageIndicator = document.createElement('span');
    pageIndicator.className = 'sdhub-gallery-page-indicator';
    pageIndicator.textContent = '1 / 1';

    pageNav.append(leftNavButton, pageIndicator, rightNavButton);
    TabCon.appendChild(pageNav);

    const counter = document.createElement('div');
    counter.id = `SDHub-Gallery-${whichTab}-Tab-Image-Counter`;
    counter.className = 'sdhub-gallery-tab-image-counter';

    TabRow.append(TabBtn);
    TabCounterCon.append(counter);
    TabWrap.append(TabCon);
    SDHubGalleryTabEvents(TabCon);
  });

  const imgBox = document.createElement('div');
  imgBox.id = 'SDHub-Gallery-Image-Box-0';
  imgBox.className = 'sdhub-gallery-image-box';

  const imgCon = document.createElement('div');
  imgCon.className = 'sdhub-gallery-image-container';

  const img = document.createElement('img');
  img.className = 'sdhub-gallery-image';
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

  const imgName = document.createElement('div');
  imgName.className = 'sdhub-gallery-image-name';

  const eFrame = document.createElement('div');
  eFrame.className = 'sdhub-gallery-image-emptyframe';

  imgCon.append(img, ContextBtn, ViewerBtn, imgName, eFrame);
  imgBox.append(imgCon);
  pageNavBox.append(TabCounterCon);
  TabWrap.prepend(TabScroll, pageNavBox);

  SDHubGallery.append(
    SDHubGalleryCreateContextMenu(),
    SDHubGalleryCreateLightBox(),
    SDHubGalleryCreateDeleteBox(),
    SettingButton, Setting, TabRow, TabWrap, imgBox, ImageInfoArrow
  );

  document.body.append(SDHubGallery);
  SDHubGalleryCreateSetting(SettingButton, Setting);

  document.addEventListener('keydown', e => {
    const HubTab = document.getElementById('tab_SDHub'),
          infoColumn = document.getElementById('SDHub-Gallery-Info-Column'),
          lightbox = document.getElementById('SDHub-Gallery-Image-Viewer'),
          DelCon = document.getElementById('SDHub-Gallery-Delete-Container');

    if (HubTab?.style.display !== 'block') return;

    if (['Escape', 'ArrowUp', 'ArrowDown'].includes(e.key) && infoColumn?.style.display === 'flex' && lightbox?.style.display !== 'flex') {
      if (e.key === 'Escape') {
        const img = infoColumn.querySelector('#SDHub-Gallery-Info-Image img');
        if (img) { e.preventDefault(); window.SDHubGalleryInfoClearImage(); }
      }
      const scroll = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? infoColumn.scrollHeight : null;
      if (scroll !== null) { e.preventDefault(); infoColumn.scrollTo({ top: scroll, behavior: 'smooth' }); }
    }

    if (['ArrowLeft', 'ArrowRight'].includes(e.key) && infoColumn?.style.display !== 'flex' && lightbox?.style.display !== 'flex' &&
        Setting?.style.display !== 'flex' && DelCon?.style.display !== 'flex') {
      const wrap = document.getElementById('SDHub-Gallery-Tab-Wrapper'),
            btn = wrap?.querySelector(e.key === 'ArrowRight' ? '.sdhub-gallery-page-right-button.btn-on' : '.sdhub-gallery-page-left-button.btn-on');
      btn?.click();
    }
  });

  window.SDHubCenterElement = (target) => {
    const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
    if (DelCon?.style.display !== 'flex') return;

    const V = window.matchMedia('(max-width: 600px)').matches ? -400 : -200;
    const W = window.innerHeight;
    const T = window.pageYOffset || document.documentElement.scrollTop;

    let thing = null;
    if (target === 'DelBox') {
      thing = document.getElementById('SDHub-Gallery-Delete-Box');
    } else if (target === 'Spinner') {
      thing = document.getElementById('SDHub-Gallery-Delete-Spinner');
    }

    if (thing) {
      const H = thing.offsetHeight || 0;
      thing.style.top = `${T + (W - H) / 2 + V}px`;
    }
  };

  ['resize', 'scroll'].forEach(e => window.addEventListener(e, () => {
    window.SDHubCenterElement('DelBox');
    window.SDHubCenterElement('Spinner');
  }));

  SDHubGalleryArrowScroll(TabScroll);
  SDHubGalleryImageInfoArrowScroll(ImageInfoArrow);
}

function SDHubGalleryArrowScroll(TabScroll) {
  let svg = TabScroll.querySelector('svg');
  let locked = false;

  window.SDHubGalleryArrowScrolling = () => {
    const GalleryTab = document.getElementById('SDHub-Gallery-Tab');
    const TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper');
    const ActiveTab = TabWrap?.querySelector('.sdhub-gallery-tab-container.active');
    const Tab = ActiveTab?.querySelector('.sdhub-gallery-pages.selected-page');

    if (!Tab) return TabScroll.style.transform = '';
    if (locked || GalleryTab.style.display !== 'block') return;

    const { scrollTop, scrollHeight, clientHeight } = Tab;
    const overflow = scrollHeight > clientHeight + 1;
    const down = scrollTop + clientHeight >= scrollHeight - 5;

    TabScroll.style.transform = overflow ? 'scale(1)' : '';
    if (overflow) svg.style.transform = down ? 'rotate(180deg)' : 'rotate(0deg)';
  };

  TabScroll.addEventListener('click', () => {
    const TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper');
    const ActiveTab = TabWrap?.querySelector('.sdhub-gallery-tab-container.active');
    const Tab = ActiveTab?.querySelector('.sdhub-gallery-pages.selected-page');
    if (!Tab) return;

    locked = true;

    const bottomTab = Tab.scrollTop + Tab.clientHeight >= Tab.scrollHeight - 5;
    const topTab = bottomTab ? 0 : Tab.scrollHeight;
    svg.style.transform = svg.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
    Tab.scrollTo({ top: topTab, behavior: 'smooth' });

    const body = document.body.getBoundingClientRect();
    const page = window.scrollY || document.documentElement.scrollTop;
    const pos = bottomTab ? page + body.top : page + body.bottom - window.innerHeight;
    window.scrollTo({ top: pos, behavior: 'smooth' });

    setTimeout(() => {
      const check = setInterval(() => {
        const stop = bottomTab ? Tab.scrollTop <= 5 : Tab.scrollTop + Tab.clientHeight >= Tab.scrollHeight - 5;
        if (stop) { clearInterval(check); locked = false; window.SDHubGalleryArrowScrolling(); }
      }, 50);
    }, 100);
  });

  const ArrowScrollButton = () => {
    const GalleryTab = document.getElementById('SDHub-Gallery-Tab');
    const TabWrap = document.getElementById('SDHub-Gallery-Tab-Wrapper');
    const ActiveTab = TabWrap?.querySelector('.sdhub-gallery-tab-container.active');
    const Tab = ActiveTab?.querySelector('.sdhub-gallery-pages.selected-page');
    if (!Tab || GalleryTab.style.display !== 'block') return;
    if (!locked) window.SDHubGalleryArrowScrolling();
  };

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, ArrowScrollButton));
}

function SDHubGalleryImageInfoArrowScroll(arrow) {
  let clicked = false;

  const whichEL = () => {
    const column = document.getElementById('SDHub-Gallery-Info-Column');
    const panel = document.getElementById('SDHub-Gallery-Info-Output-Panel');
    return (panel && panel.scrollHeight > panel.clientHeight) ? panel : column;
  };

  arrow.onclick = () => {
    clicked = true;
    arrow.style.transform = '';
    const el = whichEL();
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setTimeout(() => clicked = false, 500);
  };

  window.SDHubGalleryImageInfoArrowScrolling = () => {
    if (clicked) return;
    const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
    const el = whichEL();
    if (!el) return;
    if (getComputedStyle(infoColumn).display !== 'flex') return arrow.style.transform = '';
    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight > clientHeight + 1;
    const bottom = scrollTop + clientHeight >= scrollHeight - 5;
    arrow.style.transform = overflow && !bottom ? 'scale(1)' : '';
  };

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, window.SDHubGalleryImageInfoArrowScrolling));
}

function SDHubGalleryCreateContextMenu() {
  const GalleryCM = document.createElement('div');
  GalleryCM.id = 'SDHub-Gallery-ContextMenu';
  GalleryCM.className = 'sdhub-gallery-cm-menu';
  const submenuArrowSVG = SDHubGalleryARRSVG.replace('<svg', '<svg class="sdhub-gallery-cm-svg submenu-arrow"');
  GalleryCM.innerHTML = `
    <ul class='sdhub-gallery-cm-ul'>
      <li onclick='SDHubGalleryContextMenuButton("open")'>
        <span>${SDHubGalleryOpenNewTabSVG} ${SDHubGetTranslation('open_new_tab')}</span>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("download")'>
        <span>${SDHubGalleryDLSVG} ${SDHubGetTranslation('download')}</span>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("copy")'>
        <span>${SDHubGalleryCopySVG} ${SDHubGetTranslation('copy')}</span>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("info")'>
        <span>${SDHubGalleryImageInfoSVG} ${SDHubGetTranslation('image_info')}</span>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("viewer")'>
        <span>${SDHubGalleryImageSVG} ${SDHubGetTranslation('image_viewer')}</span>
      </li>
      <li class='sdhub-cm-sendto'>
        <span>${SDHubGallerySendToSVG} ${SDHubGetTranslation('send_to')} ${submenuArrowSVG}</span>
        <div id='SDHub-Gallery-ContextMenu-SubMenu' class='sdhub-gallery-cm-menu sdhub-gallery-cm-submenu'>
          <ul class='sdhub-gallery-cm-ul'>
            <li onclick='SDHubGallerySendImage("txt2img")'>txt2img</li>
            <li onclick='SDHubGallerySendImage("img2img")'>img2img</li>
            <li onclick='SDHubGallerySendImage("extras")'>extras</li>
            <li onclick='SDHubGallerySendImage("inpaint")'>inpaint</li>
            <li onclick='SDHubGallerySendImage("uploader")'>${SDHubGetTranslation('uploader')}</li>
          </ul>
        </div>
      </li>
      <li onclick='SDHubGalleryContextMenuButton("delete")'>
        <span>${SDHubGalleryDeleteSVG} ${SDHubGetTranslation('delete')}</span>
      </li>
    </ul>
  `;

  document.addEventListener('wheel', (e) => {
    if (GalleryCM.style.opacity === '1' && !GalleryCM.contains(e.target)) SDHubGalleryKillContextMenu();
  }, { passive: false });

  document.addEventListener('click', (e) => {
    let btn = '.sdhub-gallery-image-button-contextmenu';
    if (GalleryCM?.style.opacity === '1' && !GalleryCM.contains(e.target) && !e.target.closest(btn)) SDHubGalleryKillContextMenu();
  });

  document.addEventListener('contextmenu', (e) => {
    if (GalleryCM?.contains(e.target)) e.preventDefault();
  });

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
  NextBtn.className = 'sdhub-gallery-image-viewer-button';
  NextBtn.innerHTML = SDHubGalleryRightArrowSVG;
  NextBtn.onclick = (e) => (e.stopPropagation(), SDHubGalleryNextImage());

  const PrevBtn = document.createElement('span');
  PrevBtn.id = 'SDHub-Gallery-Image-Viewer-Prev-Button';
  PrevBtn.className = 'sdhub-gallery-image-viewer-button';
  PrevBtn.innerHTML = SDHubGalleryLeftArrowSVG;
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
  CloseBtn.className = 'sdhub-gallery-image-viewer-button';
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
  Spinner.querySelector('svg')?.classList.add('sdhub-gallery-spinner');

  const DelBox = document.createElement('div');
  DelBox.id = 'SDHub-Gallery-Delete-Box';

  const Text = document.createElement('p');
  Text.id = 'SDHub-Gallery-Delete-Text';
  Text.textContent = '';

  const ButtonRow = document.createElement('div');
  ButtonRow.id = 'SDHub-Gallery-Delete-ButtonRow';

  const Yes = document.createElement('span');
  Yes.id = 'SDHub-Gallery-Delete-Yes';
  Yes.className = 'sdhub-gallery-delete-button';
  Yes.textContent = SDHubGetTranslation('yes');

  const No = document.createElement('span');
  No.id = 'SDHub-Gallery-Delete-No';
  No.className = 'sdhub-gallery-delete-button';
  No.textContent = SDHubGetTranslation('no');

  const lang = navigator.language || navigator.languages[0] || 'en';
  ButtonRow.append(...(lang.startsWith('ja') || lang.startsWith('zh') ? [No, Yes] : [Yes, No]));

  DelBox.append(Text, ButtonRow);
  DelCon.append(DelBox, Spinner);

  document.addEventListener('keydown', ({ key }) => {
    if (DelBox.style.transform === 'scale(1)') ({ y: Yes, n: No, Escape: No }[key]?.click());
  });

  return DelCon;
}

async function SDHubGalleryCreateimgChest(GalleryTab, imgchestColumn) {
  let fromColumn = false;

  const imgchestButton = document.createElement('div');
  imgchestButton.id = 'SDHub-Gallery-imgchest-Button';
  imgchestButton.style.display = 'flex';
  imgchestButton.innerHTML = SDHubGalleryimgchestSVG;
  imgchestButton.prepend(imgchestColumn);
  GalleryTab.prepend(imgchestButton);

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

  const api = document.querySelector('#SDHub-Gallery-imgchest-API input');
  api?.setAttribute('placeholder', SDHubGetTranslation('imgchest_api_key'));
  api?.addEventListener('mousedown', () => { fromColumn = window.getComputedStyle(imgchestColumn).display === 'flex'; });

  ['Save', 'Load'].forEach(key => {
    const btn = document.getElementById(`SDHub-Gallery-imgchest-${key}-Button`);
    if (btn) {
      btn.title = SDHubGetTranslation(`${key.toLowerCase()}_setting`);
      btn.textContent = SDHubGetTranslation(key.toLowerCase());
    }
  });

  document.addEventListener('mouseup', () => {
    if (window.getComputedStyle(imgchestColumn).display === 'flex') setTimeout(() => fromColumn = false, 0);
  });

  document.addEventListener('change', () => {
    checkboxSpan.style.color = checkboxInput.checked ? 'var(--background-fill-primary)' : '';
    checkboxSpan.textContent = SDHubGetTranslation(checkboxInput.checked ? 'enabled' : 'click_to_enable');
    imgchestButton.style.background = checkboxInput.checked ? 'var(--primary-400)' : '';
    imgchestButton.style.boxShadow = checkboxInput.checked ? '0 0 10px 1px var(--primary-400)' : '';
    imgchestButton.style.border = checkboxInput.checked ? '1px solid var(--primary-400)' : '';
  });

  await fetch(`${SDHubGalleryBase}/imgChest`)
    .then(r => r.json())
    .then(d => {
      const Radio = (id, v) => document.querySelector(`${id} label[data-testid='${v}-radio-label']`)?.click();
      Radio('#SDHub-Gallery-imgchest-Privacy', d['privacy']);
      Radio('#SDHub-Gallery-imgchest-NSFW', d['nsfw']);
      if (api) (api.value = d['api-key'], updateInput(api));
    })
    .catch(e => console.error('Error loading imgchest settings:', e));

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
}

async function SDHubGalleryImgChestUpload(paths, names) {
  if (!document.querySelector('#SDHub-Gallery-imgchest-Checkbox input')?.checked) return;

  const api = document.querySelector('#SDHub-Gallery-imgchest-API input')?.value.trim(); if (!api) return;
  const whichone = (id) => document.querySelector(`${id} > div > label.selected`)?.getAttribute('data-testid')?.replace('-radio-label', '').toLowerCase() || '';
  const [privacy, nsfw] = ['#SDHub-Gallery-imgchest-Privacy', '#SDHub-Gallery-imgchest-NSFW'].map(whichone);

  const sorted = paths.map((path, i) => ({ path, name: names[i] })).sort((a, b) => b.name.includes('grid-') - a.name.includes('grid-'));
  const files = await Promise.all(sorted.map(({ path }) => SDHubGalleryCreateImageFile(path)));

  const data = new FormData();
  files.forEach(file => file && data.append('images[]', file));
  data.append('title', sorted.length > 1 && sorted.some(item => item.name.includes('grid-')) ? sorted[1].name : sorted[0].name);
  data.append('privacy', privacy || 'hidden');
  data.append('nsfw', nsfw || 'true');

  try {
    const result = await fetch('https://api.imgchest.com/v1/post', {
      method: 'POST', headers: { Authorization: `Bearer ${api}` }, body: data,
    }).then(res => res.json());

    console.log('Uploaded:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}