let DivIndex = 1;
const Tabname = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids'
];

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

    const { path, thumb } = images[index];
    const whichTab = Tabname.find(tab => path.includes(`/${tab}/`));

    if (whichTab) {
      const TabDiv = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
      const TabBtn = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);

      if (imgDiv && TabDiv) {
        TabDiv.style.filter = 'brightness(0.8) blur(10px)';
        const newImgDiv = imgDiv.cloneNode(true);
        let newId = `sdhub-imgdiv-${DivIndex}`;
        while (document.getElementById(newId)) {
          DivIndex++;
          newId = `sdhub-imgdiv-${DivIndex}`;
        }

        newImgDiv.id = newId;
        const img = newImgDiv.querySelector('img');
        let BtnDiv = document.getElementById('sdhub-gallery-img-button-div');
        if (img) {
          fetch(path)
            .then(response => response.blob())
            .then(blob => {
              const mimeType = blob.type;
              img.fileObject = new File([blob], `image.${mimeType.split('/')[1]}`, { type: mimeType });
            });

          img.src = thumb;
          img.setAttribute('data-path', path);
          BtnDiv.style.display = 'block';
        }

        TabDiv.prepend(newImgDiv);
        if (TabBtn) TabBtn.style.display = 'flex';
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

ContextSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
    width="100%" height="100%" viewBox="0 0 24 24" xml:space="preserve" stroke="currentColor" 
    style="fill-rule: evenodd; clip-rule: evenodd; stroke-linecap: round; stroke-linejoin: round;">
    <g transform="matrix(1.14096,-0.140958,-0.140958,1.14096,-0.0559523,0.0559523)">
      <path 
        d="M18,6L6.087,17.913" 
        style="fill: none; fill-rule: nonzero; stroke-width: 2px;">
      </path>
    </g>
    <path 
      d="M4.364,4.364L19.636,19.636" 
      style="fill: none; fill-rule: nonzero; stroke-width: 2px;">
    </path>
  </svg>
`;

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

    const BtnDiv = document.createElement('div');
    BtnDiv.id = 'sdhub-gallery-img-button-div';

    const Btn = document.createElement('button');
    Btn.id = 'sdhub-gallery-img-button';
    Btn.innerHTML = ContextSVG;

    const img = document.createElement('img');
    img.classList.add('sdhub-gallery-img');

    BtnDiv.append(Btn);
    imgDiv.append(BtnDiv, img);
    Gallery.prepend(TabRow, imgDiv);

    FetchList('/sd-hub-gallery-initial');
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
