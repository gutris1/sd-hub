let dataCache = new DataTransfer();
let fetchTimeout = null;
let lastFetch = 0;
let DivIndex = 1;

const Tabname = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids'
];

function FetchImage(images) {
  let imgDiv = document.querySelector("#sdhub-imgdiv-0");
  let loadedImages = 0;
  let total = images.length;
  let updatedTabs = new Set();

  const processImage = async (index) => {
    if (index >= total) return;

    const { path, thumb } = images[index];
    const whichTab = Tabname.find((tab) => path.includes(`/${tab}/`));

    if (whichTab) {
      const TabDiv = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
      const TabBtn = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);

      if (imgDiv && TabDiv) {
        TabDiv.style.filter = "brightness(0.8) blur(10px)";
        updatedTabs.add(TabDiv);

        const newImgDiv = imgDiv.cloneNode(true);
        let newId = `sdhub-imgdiv-${DivIndex}`;

        while (document.getElementById(newId)) {
          DivIndex++;
          newId = `sdhub-imgdiv-${DivIndex}`;
        }

        newImgDiv.id = newId;
        const img = newImgDiv.querySelector("img");

        if (img) {
          img.src = thumb;
          img.setAttribute("data-path", path);

          img.onload = () => {
            loadedImages++;
            if (loadedImages === total) {
              console.log("all-loaded");
              updatedTabs.forEach((tab) => (tab.style.filter = "none"));
            }
          };

          setTimeout(async () => {
            try {
              const response = await fetch(path);
              const blob = await response.blob();
              const mimeType = blob.type;
              img.fileObject = new File([blob], `image.${mimeType.split("/")[1]}`, {
                type: mimeType,
              });
            } catch (error) {
              console.error("Error fetching:", error);
            }
          }, 0);
        }

        TabDiv.prepend(newImgDiv);
        if (TabBtn) TabBtn.style.display = "flex";
        DivIndex++;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    processImage(index + 1);
  };

  processImage(0);

  for (let i = 0; i < Tabname.length; i++) {
    let TabBtn = document.getElementById(`sdhub-gallery-${Tabname[i]}-tab-button`);
    let TabDiv = document.getElementById(`sdhub-gallery-${Tabname[i]}-tab-div`);
    if (TabBtn && TabDiv) {
      TabBtn.classList.add("selected");
      TabDiv.classList.add("active");
      TabDiv.style.display = "flex";
      break;
    }
  }
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
      FetchList('/sd-hub-gallery-list');
      lastFetch = Date.now();
      fetchTimeout = null;
    }, remainingTime);
    return;
  }

  FetchList('/sd-hub-gallery-list');
  lastFetch = now;
}

onAfterUiUpdate(function() {
  debouncingFetch();
});

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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    width="30px" height="30px">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
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

    const imgCOn = document.createElement('div');
    imgCOn.id = 'sdhub-imgCon';

    const imgWrap = document.createElement('div');
    imgWrap.id = 'sdhub-gallery-img-wrapper';

    const img = document.createElement('img');
    img.classList.add('sdhub-gallery-img');

    const BtnWap = document.createElement('div');
    BtnWap.id = 'sdhub-gallery-img-button-wrapper';

    const Btn = document.createElement('button');
    Btn.id = 'sdhub-gallery-img-button';
    Btn.innerHTML = ContextSVG;

    const eFrame = document.createElement('div');
    eFrame.id = 'sdhub-gallery-empty-frame';

    BtnWap.append(Btn);
    imgWrap.append(img, BtnWap, eFrame);
    imgCOn.append(imgWrap);
    imgDiv.append(imgCOn);
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
