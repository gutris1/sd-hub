let DivIndex = 1;
const imageCache = new Map();
const Tabname = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids'
];

async function ProcessProcess(path) {
  try {
    const response = await fetch(path);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX) {
            height = height * (MAX / width);
            width = MAX;
          }
        } else {
          if (height > MAX) {
            width = width * (MAX / height);
            height = MAX;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((thumbBlob) => {
          const Thumb = URL.createObjectURL(thumbBlob);

          resolve({
            url,
            Thumb,
            Blob: blob,
            extension: path.match(/\.([^.]+)$/)?.[1]?.toLowerCase() || 'png'
          });
        }, 'image/jpeg', 0.85);
      };

      img.onerror = reject;
      img.src = url;
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

function FetchImage(images) {
  let imgDiv = document.querySelector('#sdhub-imgdiv-0');
  let loadedImages = 0;
  const total = images.length;

  const processImage = async (index) => {
    if (index >= images.length) {
      if (loadedImages === total) {
        console.log("all-loaded");
        fetch('/clear-gallery-list', { method: 'POST' });
      }
      return;
    }

    const { path } = images[index];
    const imgPath = path.replace(/[\[\]']+/g, '').trim();
    const whichTab = Tabname.find(whichTab => imgPath.includes(`/${whichTab}/`));

    if (whichTab) {
      const TabDiv = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
      const TabBtn = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);

      if (TabDiv) {
        TabDiv.style.filter = 'brightness(0.8) blur(10px)';
      }

      if (imgDiv && TabDiv) {
        const imageData = await ProcessProcess(imgPath);

        if (!imageData) {
          if (TabDiv) TabDiv.style.filter = 'none';
          processImage(index + 1);
          return;
        }

        const { url, Thumb, Blob, extension } = imageData;
        const newImgDiv = imgDiv.cloneNode(true);
        let newId = `sdhub-imgdiv-${DivIndex}`;

        while (document.getElementById(newId)) {
          DivIndex++;
          newId = `sdhub-imgdiv-${DivIndex}`;
        }

        newImgDiv.id = newId;

        const img = newImgDiv.querySelector('img');
        if (img) {
          img.setAttribute('data-path', imgPath);
          img.src = Thumb;
          imageCache.set(imgPath + '_thumb', Thumb);
          imageCache.set(imgPath + '_original', url);

          const mimeType = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp',
            'avif': 'image/avif'
          }[extension] || 'image/png';

          img.fileObject = new File(
            [Blob],
            `image.${extension}`,
            { type: mimeType }
          );
        }

        TabDiv.prepend(newImgDiv);

        if (TabBtn) {
          TabBtn.style.display = 'flex';
        }

        DivIndex++;
        loadedImages++;
        TabDiv.style.filter = 'none';
      }
    }

    processImage(index + 1);
  };

  processImage(0);

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


onUiTabChange(function() {
  let MainTab = gradioApp().querySelector('#tabs > .tab-nav > button.selected');
  if (MainTab && (MainTab.textContent.trim() === 'HUB')) {
    FetchList('/sd-hub-gallery-list');
  }
});

function FetchList(r) {
  fetch(r)
    .then(response => response.json())
    .then(data => data.images?.length && FetchImage(data.images))
    .catch(console.error);
}

let dataCache = new DataTransfer();

function SDHubImageInfo(imgEL) {
  document.body.classList.add('no-scroll');
  const Div = document.querySelector('#sdhub-gallery-image-info-row');
  const imgInput = document.querySelector('#SDHubimgInfoImage input');
  const img = document.querySelector('#SDHubimgInfoImage img');
  const file = imgEL.fileObject;
  if (file) {
    dataCache.items.clear();
    dataCache.items.add(file);
    imgInput.files = dataCache.files;
    imgInput.dispatchEvent(new Event('change', { bubbles: true }));
    Div.style.display = 'flex';
    setTimeout(() => (Div.style.opacity = '1'), 100);
  }
}

function SDHubImageInfoClearButton() {
  let Row = document.querySelector("#sdhub-gallery-image-info-row");
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
      Row.style.opacity = '0';
      document.body.classList.remove('no-scroll');
      setTimeout(() => {
        ClearButton.click();
        Row.style.display = 'none';
        document.removeEventListener('keydown', RowKeydown);
        document.removeEventListener('click', SendButtonClick);
      }, 200);
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeRow();
    });

    const RowKeydown = (e) => {
      if (e.key === 'Escape' && Row && window.getComputedStyle(Row).display === 'flex') {
        const LightBox = document.querySelector('#SDHubimgInfoZoom');
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

onUiLoaded(function () {
  let Gallery = document.querySelector('#sdhub-gallery-tab');

  if (Gallery) {
    Gallery.addEventListener('click', function (event) {
      const img = event.target.closest('img');
      if (img) SDHubImageInfo(img);
    });

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
      TabBtn.addEventListener('click', () => switchGalleryTab(whichTab));

      const TabDiv = document.createElement('div');
      TabDiv.id = `sdhub-gallery-${whichTab}-tab-div`;
      TabDiv.classList.add('sdhub-gallery-tab-div');

      TabRow.append(TabBtn);
      Gallery.append(TabDiv);
    });

    const imgDiv = document.createElement('div');
    imgDiv.id = 'sdhub-imgdiv-0';
    imgDiv.classList.add('sdhub-gallery-img-div');

    const imgSib = document.createElement('div');
    imgSib.id = 'sdhub-imgSib';
    imgSib.classList.add('sdhub-gallery-img-sib');

    const img = document.createElement('img');
    img.classList.add('sdhub-gallery-img');

    imgDiv.append(img, imgSib);
    Gallery.prepend(TabRow, imgDiv);

    FetchList('/sd-hub-gallery-initial');

    window.addEventListener('beforeunload', () => {
      imageCache.forEach(URL.revokeObjectURL);
      imageCache.clear();
      fetch('/clear-gallery-cache', { method: 'POST' });
    });
  }
});

function switchGalleryTab(whichTab) {
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
