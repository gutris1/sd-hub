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

  const TabCon = document.getElementById(`SDHub-Gallery-${tabName}-Tab-Container`);
  const wrapper = TabCon.querySelector('.sdhub-gallery-page-wrapper');
  const pages = Array.from(wrapper.children);
  if (pages.length === 0) return;

  let pageIndex = pages.findIndex(p => p.classList.contains('selected-page'));
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
    currentPage.classList.remove('selected-page');
    currentPage.style.opacity = '';
    newPage.classList.add('selected-page');
  });

  setTimeout(() => newPage.style.opacity = '1', 50);

  setTimeout(() => {
    SDHubGalleryPageLocks[tabName] = false;
    setTimeout(() => window.SDHubGalleryArrowScrolling(), 0);
  }, 150);

  const pageNav = TabCon.querySelector('.sdhub-gallery-page-nav');
  const rightNavButton = pageNav?.querySelector('.sdhub-gallery-page-right-button');
  const leftNavButton = pageNav?.querySelector('.sdhub-gallery-page-left-button');
  const pageIndicator = pageNav?.querySelector('.sdhub-gallery-page-indicator');

  if (rightNavButton) rightNavButton.classList.toggle('btn-on', newIndex > 0);
  if (leftNavButton) leftNavButton.classList.toggle('btn-on', newIndex < pages.length - 1);
  if (pageIndicator) pageIndicator.textContent = `${newIndex + 1} / ${pages.length}`;
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
  const Btn = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Button`);
  const counter = document.getElementById(`SDHub-Gallery-${whichTab}-Tab-Image-Counter`);
  const page = Tab.querySelector('.sdhub-gallery-pages.selected-page');

  if (Tab) {
    Tab.style.display = 'flex';
    Tab.classList.add('active');

    if (counter) counter.style.display = 'flex';
    if (Btn) Btn.classList.add('selected');

    if (page) {
      page.style.transition = 'none';
      page.style.opacity = '';
      setTimeout(() => {
        page.style.transition = '';
        page.style.opacity = '1';
      }, 50);
    }

    setTimeout(() => window.SDHubGalleryArrowScrolling(), 0);
  }
}

function SDHubGalleryChangeSettings(thumbnailShape, thumbnailPosition, thumbnailLayout, thumbnailSize, imageInfoLayout) {
  const square = 'SDHub-Gallery-Thumbnail-Shape-Square';
  const uniform = 'SDHub-Gallery-Thumbnail-Layout-Uniform';
  const thumbPos = 'SDHub-Gallery-Thumbnail-Position-';
  const pos = `${thumbPos}${thumbnailPosition}`;
  const sideByside = 'SDHub-Gallery-Image-Info-SideBySide';
  const thumbSize = 'SDHub-Gallery-Thumbnail-Size-Changed';

  const imageInfoCSS = `
    #SDHub-Gallery-Info-Column {
      flex-grow: 10 !important;
      align-items: flex-start !important;
      flex-direction: row !important;
      flex-wrap: wrap !important;
      height: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    #SDHub-Gallery-Info-Column > .form{
      height: 100% !important;
      gap: 0 !important;
    }

    #SDHub-Gallery-Info-Image-Column {
      flex-direction: column !important;
      width: 100% !important;
      height: 100% !important;
      padding: 10px 0 10px 10px !important;
    }

    #SDHub-Gallery-Info-Image {
      flex: 1 1 0% !important;
      position: relative !important;
      height: 100% !important;
      min-height: min(160px, 100%) !important;
      width: 100% !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 1rem !important;
      box-shadow: 0 0 7px 1px #000 !important;
    }

    #SDHub-Gallery-Info-Image img {
      position: unset !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: cover !important;
      object-position: top !important;
      border-top-right-radius: 1.5rem !important;
    }

    #SDHub-Gallery-Info-Clear-Button {
      position: absolute !important;
      top: 0 !important;
      right: 0 !important;
    }

    #SDHub-Gallery-Info-img-frame {
      position: absolute !important;
      filter: unset !important;
      box-shadow: inset 0 0 5px 1px #000 !important;
      border-radius: 1rem !important;
    }

    #SDHub-Gallery-Info-SendButton {
      grid-template-columns: 1fr 1fr !important;
      left: unset !important;
      bottom: 0 !important;
      padding: 0 10px 15px 10px !important;
      border-radius: 1rem;
      width: 100% !important;
      align-self: center !important;
      gap: 2px !important;
    }

    #SDHub-Gallery-Info-SendButton button {
      border-radius: 0 !important;
      box-shadow: 0 0 5px 1px #000 !important;
    }

    #SDHub-Gallery-Info-SendButton > :nth-child(1) {
      border-top-left-radius: 1rem !important;
    }

    #SDHub-Gallery-Info-SendButton > :nth-child(2) {
      border-top-right-radius: 1rem !important;
    }

    #SDHub-Gallery-Info-SendButton > :nth-child(3) {
      border-bottom-left-radius: 1rem !important;
    }

    #SDHub-Gallery-Info-SendButton > :nth-child(4) {
      border-bottom-right-radius: 1rem !important;
    }

    #SDHub-Gallery-Info-Output-Panel {
      flex: 7 1 0% !important;
      position: relative !important;
      height: max-content !important;
      max-height: 100% !important;
      padding: 10px !important;
      pointer-events: auto !important;
      overflow-y: auto !important;
      will-change: transform;
    }

    @media (max-width: 600px) {
      #SDHub-Gallery-Info-Column {
        overflow-y: auto !important;
        will-change: transform;
      }

      #SDHub-Gallery-Info-Image-Column {
        padding: 10px !important;
      }

      #SDHub-Gallery-Info-SendButton {
        padding: 15px !important;
      }

      #SDHub-Gallery-Info-Output-Panel {
        max-height: max-content !important;
        overflow: visible !important;
      }
    }

    #SDHub-Gallery-Info-img-area {
      display: none !important;
    }

    #SDHub-Gallery-Info-HTML {
      height: max-content !important;
      margin: 0 !important;
      padding: 0 !important;
      position: relative !important;
    }

    #SDHub-Gallery-Info-Output-Panel .sdhub-gallery-info-output-title {
      background: var(--input-background-fill);
      filter: unset !important;
    }

    #SDHub-Gallery-Info-Output-Panel .sdhub-gallery-info-output-wrapper {
      background: var(--input-background-fill) !important;
      filter: unset !important;
    }
  `;

  document.querySelectorAll(`style[id^="${thumbPos}"]`).forEach(el => {
    if (el.id !== pos) el.remove();
  });

  if (thumbnailShape === 'Square') {
    const squareCSS = `
      #sdhub-gallery-tab .sdhub-gallery-image {
        height: var(--sdhub-gallery-img-size) !important;
        width: var(--sdhub-gallery-img-size) !important;
        object-fit: cover !important;
      }
    `;

    const posCSS = `
      #sdhub-gallery-tab .sdhub-gallery-image {
        object-position: ${thumbnailPosition.toLowerCase()} !important;
      }
    `;

    if (!document.getElementById(square)) {
      document.body.appendChild(Object.assign(document.createElement('style'), {
        id: square, textContent: squareCSS
      }));
    }

    if (!document.getElementById(pos)) {
      document.body.appendChild(Object.assign(document.createElement('style'), {
        id: pos, textContent: posCSS
      }));
    }

    document.getElementById(uniform)?.remove();
  } else {
    document.getElementById(square)?.remove();

    if (thumbnailLayout === 'Uniform') {
      const uniformCSS = `
        .sdhub-gallery-image-box {
          height: var(--sdhub-gallery-img-size) !important;
          width: var(--sdhub-gallery-img-size) !important;
          flex-basis: unset !important;
        }
      `;

      if (!document.getElementById(uniform)) {
        document.body.appendChild(Object.assign(document.createElement('style'), {
          id: uniform, textContent: uniformCSS
        }));
      }
    } else {
      document.getElementById(uniform)?.remove();
    }
  }

  if (thumbnailSize) {
    const thumbSizeCSS = `
      :root {
        --sdhub-gallery-img-size: ${parseInt(thumbnailSize, 10)}px !important;
      }
    `;

    const old = document.getElementById(thumbSize);
    const now = Object.assign(document.createElement('style'), { id: thumbSize, textContent: thumbSizeCSS });
    document.body.appendChild(now);
    if (old) old.remove();
  }

  if (imageInfoLayout === 'Side by Side') {
    if (!document.getElementById(sideByside)) {
      document.body.appendChild(Object.assign(document.createElement('style'), {
        id: sideByside, textContent: imageInfoCSS
      }));
    }
  } else {
    document.getElementById(sideByside)?.remove();
  }

  setTimeout(() => {
    window.SDHubGalleryArrowScrolling();
    window.SDHubGalleryChangeThumbnailPosition();
  }, 0);
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

      if (TabBtn) TabBtn.style.display = 'flex';
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

    if (TabBtn) TabBtn.style.display = 'flex';
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
    const area = document.querySelector('#sdhub-uploader-inputs textarea');
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
  const DelCon = document.getElementById('SDHub-Gallery-Delete-Container');
  const Spinner = document.getElementById('SDHub-Gallery-Delete-Spinner');
  DelCon.style.display = 'flex';
  window.SDHubCenterElement('Spinner');

  window.SDHubImagePath = imgEL.getAttribute('data-image');
  const input = document.querySelector('#SDHub-Gallery-Info-Image input');

  if (input) {
    requestAnimationFrame(() => {
      Spinner.style.display = infoColumn.style.display = 'flex';
      DelCon.style.opacity = '1'; infoColumn.style.pointerEvents = 'none';
    });

    await SDHubGalleryUpdateImageInput(input, window.SDHubImagePath);
    document.body.classList.add('no-scroll');

    const display = () => setTimeout(() => {
      infoColumn.style.opacity = '1';
      infoColumn.style.pointerEvents = DelCon.style.display = DelCon.style.opacity = Spinner.style.display = '';
      setTimeout(() => window.SDHubGalleryImageInfoArrowScrolling(), 0);
    }, 100);

    (function check(){document.querySelector('#SDHub-Gallery-Info-Image img')?requestAnimationFrame(display):requestAnimationFrame(check)})();
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
  document.body.classList.add('no-scroll');

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
        document.body.classList.remove('no-scroll');
      }, 1000);
      setTimeout(() => {
        DelCon.style.display = DelBox.style.opacity = DelBox.style.transform = '';
        Yes.onclick = null;
      }, 1100);
    }
  };

  No.onclick = () => {
    document.body.classList.remove('no-scroll');
    DelCon.style.opacity = '';
    DelBox.style.transform = 'scale(1.5)';
    setTimeout(() => (DelCon.style.display = DelBox.style.transform = '', No.onclick = null), 200);
  };

  requestAnimationFrame(() => (DelCon.style.opacity = '1', DelBox.style.transform = 'scale(1)'));
}

async function SDHubGalleryLoadSetting() {
  const r = await fetch(`${SDHubGalleryBase}/loadsetting`);
  const v = await r.json();

  SDHubGalleryPageLimit = parseInt(v['images-per-page'], 10);
  SDHubGalleryChangeSettings(
    v['thumbnail-shape'],
    v['thumbnail-position'],
    v['thumbnail-layout'],
    parseInt(v['thumbnail-size'], 10),
    v['image-info-layout']
  );

  const pageLimiter = document.getElementById('SDHub-Gallery-Setting-Page-Limiter-Input');
  pageLimiter.value = v['images-per-page'];

  const thumbSize = document.getElementById('SDHub-Gallery-Setting-Thumbnail-Size-Input');
  thumbSize.value = v['thumbnail-size'];

  const settingList = {
    'SDHub-Gallery-Setting-Thumbnail-Shape': v['thumbnail-shape'],
    'SDHub-Gallery-Setting-Thumbnail-Position': v['thumbnail-position'],
    'SDHub-Gallery-Setting-Thumbnail-Layout': v['thumbnail-layout'],
    'SDHub-Gallery-Setting-Image-Info': v['image-info-layout'],
  };

  for (const [id, s] of Object.entries(settingList)) {
    const i = document.getElementById(`${id}-Input`);
    const w = document.getElementById(`${id}-Wrapper`);
    const c = id.toLowerCase().split('-').slice(-2).join('-');

    if (i) i.value = i.dataset.value = s;
    if (w) {
      w.querySelectorAll('.sdhub-gallery-setting-selection').forEach(p => {
        const is = p.textContent === s;
        p.classList.toggle(`sdhub-gallery-selected-${c}`, is);
        p.classList.toggle('sdhub-gallery-setting-selected', is);
      });
    }
  }

  SDHubGalleryLoadInitial();
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
    Panel.addEventListener('scroll', window.SDHubGalleryImageInfoArrowScrolling);

    ['drop', 'dragover'].forEach(t => document.addEventListener(t, e => {
      const E = e.target.id === imgArea.id || e.target.classList?.contains('sdhub-gallery-info-output-content');
      E && (e.preventDefault(), e.stopPropagation());
    }));

    const con = document.querySelector('#SDHub-Gallery-Info-Image > .image-container');
    con.append(Object.assign(document.createElement('div'), { id: 'SDHub-Gallery-Info-img-frame' }));

    SDHubGallery.style.display = '';
    const DelCon = SDHubGallery.querySelector('#SDHub-Gallery-Delete-Container');
    const TabRow = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Button-Row');
    const TabWrap = SDHubGallery.querySelector('#SDHub-Gallery-Tab-Wrapper');
    const imgBox = SDHubGallery.querySelector('#SDHub-Gallery-Image-Box-0');
    const Setting = SDHubGallery.querySelector('#SDHub-Gallery-Setting');
    const SettingButton = SDHubGallery.querySelector('#SDHub-Gallery-Setting-Button');

    GalleryTab.prepend(SettingButton, Setting, DelCon, TabRow, TabWrap, imgBox);

    const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
    infoColumn.append(SDHubGallery.querySelector('#SDHub-Gallery-Image-Info-Arrow'));
    infoColumn.addEventListener('scroll', window.SDHubGalleryImageInfoArrowScrolling);

    const imgchestColumn = document.getElementById('SDHub-Gallery-imgchest-Column');
    if (imgchestColumn) SDHubGalleryCreateimgChest(GalleryTab, imgchestColumn);

    SDHubGalleryLoadSetting();
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

  const Setting = document.createElement('div');
  Setting.id = 'SDHub-Gallery-Setting';

  const SettingButton = document.createElement('div');
  SettingButton.id = 'SDHub-Gallery-Setting-Button';
  SettingButton.innerHTML = SDHubGallerySettingSVG;

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
    let btnTitle = whichTab.includes('-grids') 
      ? whichTab 
      : whichTab.split('-')[0].toLowerCase();

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
    SDHubGalleryTabEventListener(TabCon);
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

  document.addEventListener('keydown', (e) => {
    const infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
    const lightbox = document.getElementById('SDHub-Gallery-Image-Viewer');

    if (['Escape', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      if (infoColumn?.style.display === 'flex' && lightbox?.style.display !== 'flex') {
        if (e.key === 'Escape') {
          const img = infoColumn.querySelector('#SDHub-Gallery-Info-Image img');
          if (img) { e.preventDefault(); window.SDHubGalleryInfoClearImage(); }
        }

        const scroll = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? infoColumn.scrollHeight : null;
        if (scroll !== null) { e.preventDefault(); infoColumn?.scrollTo({ top: scroll, behavior: 'smooth' }); }
      }
    }

    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (infoColumn?.style.display !== 'flex' && lightbox?.style.display !== 'flex') {
        const wrap = document.getElementById('SDHub-Gallery-Tab-Wrapper');
        const btn = e.key === 'ArrowRight' ? '.sdhub-gallery-page-right-button.btn-on' : '.sdhub-gallery-page-left-button.btn-on';
        wrap?.querySelector(btn)?.click();
      }
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
    const GalleryTab = document.getElementById('sdhub-gallery-tab');
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
    const GalleryTab = document.getElementById('sdhub-gallery-tab');
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

function SDHubGalleryCreateSetting(SettingButton, Setting) {
  window.SDHubGalleryChangeThumbnailPosition = () => {
    const shape = document.getElementById('SDHub-Gallery-Setting-Thumbnail-Shape-Input')?.dataset.value;
    const ThumbPosWrapper = document.getElementById('SDHub-Gallery-Setting-Thumbnail-Position-Wrapper');
    const ThumbLayWrapper = document.getElementById('SDHub-Gallery-Setting-Thumbnail-Layout-Wrapper');
    if (ThumbPosWrapper && ThumbLayWrapper) {
      ThumbPosWrapper.classList.toggle('sdhub-gallery-setting-active', shape === 'Square');
      ThumbLayWrapper.classList.toggle('sdhub-gallery-setting-disable', shape === 'Square');
    }
  };

  function createSettings(t, o = {}) {
    const el = document.createElement(t);
    Object.entries(o).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'children') v.forEach(c => el.appendChild(c));
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el[k] = v;
    });
    return el;
  }

  function createSelections({ id, labelText, options, selected, className, onChange }) {
    const wrapper = createSettings('div', { id, class: 'sdhub-gallery-setting-box' });
    const label = createSettings('label', { id: `${id}-Label`, class: 'sdhub-gallery-setting-label', text: labelText, });
    const pillWrapper = createSettings('div', { id: `${id}-Wrapper`, class: 'sdhub-gallery-setting-wrapper', });
    const hiddenInput = createSettings('input', { id: `${id}-Input`, class: 'sdhub-gallery-setting-input', value: selected, dataset: { value: selected } });

    options.forEach(v => {
      const selections = createSettings('div', { class: 'sdhub-gallery-setting-selection', text: v });
      const s = 'sdhub-gallery-setting-selected';
      const c = `sdhub-gallery-selected-${id.toLowerCase().split('-').slice(-2).join('-')}`;

      if (v === selected) selections.classList.add(s, c);

      selections.addEventListener('click', () => {
        pillWrapper.querySelectorAll('.sdhub-gallery-setting-selection').forEach(p => p.classList.remove(s, c));
        selections.classList.add(s, c);
        hiddenInput.value = hiddenInput.dataset.value = v;
        if (onChange) onChange(v);
      });

      pillWrapper.appendChild(selections);
    });

    wrapper.append(label, pillWrapper, hiddenInput);
    return wrapper;
  }

  const SettingWrapper = createSettings('div', { id: 'SDHub-Gallery-Setting-Wrapper' });
  const exitButton = createSettings('div', { id: 'SDHub-Gallery-Setting-Exit-Button', html: SDHubGalleryCloseButtonSVG, onclick: killSetting });
  const SettingBox = createSettings('div', { id: 'SDHub-Gallery-Setting-Box', oncontextmenu: (e) => e.preventDefault() });

  const pageLimiter = createSettings('div', {
    id: 'SDHub-Gallery-Setting-Page-Limiter', class: 'sdhub-gallery-setting-box',
    children: [
      createSettings('label', {
        id: 'SDHub-Gallery-Setting-Page-Limiter-Label', class: 'sdhub-gallery-setting-label',
        text: 'Images per Page'
      }),
      createSettings('div', {
        id: 'SDHub-Gallery-Setting-Page-Limiter-Wrapper', class: 'sdhub-gallery-setting-wrapper',
        children: [
          createSettings('input', {
            id: 'SDHub-Gallery-Setting-Page-Limiter-Input', class: 'sdhub-gallery-setting-input-number',
            spellcheck: false, min: '10', max: '999', type: 'text', maxLength: 3,
            oninput: e => e.target.value = e.target.value.replace(/[^0-9]/g, '')
          })
        ]
      })
    ]
  });

  const thumbnailShape = createSelections({
    id: 'SDHub-Gallery-Setting-Thumbnail-Shape',
    labelText: 'Thumbnail Shape',
    options: ['Aspect Ratio', 'Square'],
    selected: 'Aspect Ratio',
    onChange: window.SDHubGalleryChangeThumbnailPosition
  });

  const thumbnailPosition = createSelections({
    id: 'SDHub-Gallery-Setting-Thumbnail-Position',
    labelText: 'Thumbnail Position',
    options: ['Center', 'Top'],
    selected: 'Center'
  });

  const thumbnailLayout = createSelections({
    id: 'SDHub-Gallery-Setting-Thumbnail-Layout',
    labelText: 'Thumbnail Layout',
    options: ['Masonry', 'Uniform'],
    selected: 'Masonry'
  });

  const thumbnailSize = createSettings('div', {
    id: 'SDHub-Gallery-Setting-Thumbnail-Size', class: 'sdhub-gallery-setting-box',
    children: [
      createSettings('label', {
        id: 'SDHub-Gallery-Setting-Thumbnail-Size-Label', class: 'sdhub-gallery-setting-label',
        text: 'Thumbnail Size'
      }),
      createSettings('div', {
        id: 'SDHub-Gallery-Setting-Thumbnail-Size-Wrapper', class: 'sdhub-gallery-setting-wrapper',
        children: [
          createSettings('input', {
            id: 'SDHub-Gallery-Setting-Thumbnail-Size-Input', class: 'sdhub-gallery-setting-input-number',
            spellcheck: false, min: '100', max: '999', type: 'text', maxLength: 3,
            oninput: e => e.target.value = e.target.value.replace(/[^0-9]/g, '')
          })
        ]
      })
    ]
  });

  const imageInfoLayout = createSelections({
    id: 'SDHub-Gallery-Setting-Image-Info',
    labelText: 'Image Info Layout',
    options: ['Fullscreen', 'Side by Side'],
    selected: 'Fullscreen'
  });

  const applyButton = createSettings('span', {
    id: 'SDHub-Gallery-Setting-Apply-Button',
    text: 'Apply'
  });

  SettingWrapper.append(pageLimiter, thumbnailShape, thumbnailPosition, thumbnailLayout, thumbnailSize, imageInfoLayout, applyButton);
  SettingBox.append(exitButton, SettingWrapper);
  Setting.append(SettingBox);

  function killSetting() {
    document.body.classList.remove('no-scroll');
    SettingBox.style.opacity = '';
    SettingBox.style.transform = 'scale(1.5)';
    Setting.style.opacity = '';
    SettingButton.style.transform = '';
    setTimeout(() => (Setting.style.display = SettingBox.style.transform = ''), 200);
  }

  document.addEventListener('contextmenu', e => Setting && !Setting.contains(e.target) && killSetting());
  document.addEventListener('click', (e) => {
    if (SettingButton && Setting && SettingBox) {
      if (SettingButton.contains(e.target) && window.getComputedStyle(Setting).display === 'none') {
        SettingButton.style.transform = 'rotate(-360deg)';
        document.body.classList.add('no-scroll');
        Setting.style.display = 'flex';
        requestAnimationFrame(() => {
          Setting.style.opacity = SettingBox.style.opacity = '1';
          SettingBox.style.transform = 'scale(1)';
        });
      }
    }
  });

  const applySettings = () => {
    applyButton.onclick = null;

    const SettingBox = document.getElementById('SDHub-Gallery-Setting-Box');
    const pageLimiter = document.getElementById('SDHub-Gallery-Setting-Page-Limiter-Input').value;
    const thumbnailShape = document.getElementById('SDHub-Gallery-Setting-Thumbnail-Shape-Input').dataset.value;
    const thumbnailPosition = document.getElementById('SDHub-Gallery-Setting-Thumbnail-Position-Input').dataset.value;
    const thumbnailLayout = document.getElementById('SDHub-Gallery-Setting-Thumbnail-Layout-Input').dataset.value;
    const thumbnailSize = document.getElementById('SDHub-Gallery-Setting-Thumbnail-Size-Input').value;
    const imageInfoLayout = document.getElementById('SDHub-Gallery-Setting-Image-Info-Input').dataset.value;

    SDHubGalleryChangeSettings(thumbnailShape, thumbnailPosition, thumbnailLayout, thumbnailSize, imageInfoLayout);

    if (parseInt(pageLimiter, 10) !== SDHubGalleryPageLimit) {
      SDHubGalleryPageLimit = parseInt(pageLimiter, 10);
      document.querySelectorAll('.sdhub-gallery-pages')?.forEach(p => p.remove());
      SDHubGalleryLoadInitial();
    }

    fetch(`${SDHubGalleryBase}/savesetting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'images-per-page': parseInt(pageLimiter, 10),
        'thumbnail-shape': thumbnailShape,
        'thumbnail-position': thumbnailPosition,
        'thumbnail-layout': thumbnailLayout,
        'thumbnail-size': parseInt(thumbnailSize, 10),
        'image-info-layout': imageInfoLayout
      })
    }).then(res => {
      if (!res.ok) throw new Error('Failed to save setting');
    }).catch(err => console.error(err));

    const applied = 'sdhub-gallery-setting-applied';
    SettingBox.classList.add(applied);
    setTimeout(() => (SettingBox.classList.remove(applied), applyButton.onclick = applySettings), 1000);
  };

  applyButton.onclick = applySettings;
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

  const apiInput = document.querySelector('#SDHub-Gallery-imgchest-API input');
  apiInput?.setAttribute('placeholder', SDHubGetTranslation('imgchest_api_key'));
  apiInput?.addEventListener('mousedown', () => { fromColumn = window.getComputedStyle(imgchestColumn).display === 'flex'; });

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
      Radio('#SDHub-Gallery-imgchest-Privacy', d.privacy);
      Radio('#SDHub-Gallery-imgchest-NSFW', d.nsfw);
      if (apiInput) apiInput.value = d.api, updateInput(apiInput);
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

  const apikey = document.querySelector('#SDHub-Gallery-imgchest-API input')?.value.trim();
  if (!apikey) return;

  const getSettings = (id) => document.querySelector(`${id} > div > label.selected`)?.getAttribute('data-testid')?.replace('-radio-label', '').toLowerCase() || '';
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