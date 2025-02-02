var BASE = "/sd-hub-gallery"

function LoadGallery() {
  fetch('/sd-hub-gallery-initial')
    .then(response => response.json())
    .then(data => {
      const PathList = data.image_paths;

      if (!Array.isArray(PathList) || PathList.length === 0) {
        return;
      }

      let DivIndex = 1;
      let imgDiv = document.querySelector('#sdhub-imgdiv-0');

      let loadedImages = 0;

      try {
        PathList.forEach((imgPathValue) => {
          let imgPath = imgPathValue.replace(/[\[\]']+/g, '').trim();
          let whichTab = Tabname.find(whichTab => imgPath.includes(`/${whichTab}/`));

          if (whichTab) {
            let TabDiv = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
            let TabBtn = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);

            if (imgDiv && TabDiv) {
              let newImgDiv = imgDiv.cloneNode(true);
              newImgDiv.classList.add('sdhub-gallery-img-div');

              let newId = `sdhub-imgdiv-${DivIndex}`;
              while (document.getElementById(newId)) {
                DivIndex++;
                newId = `sdhub-imgdiv-${DivIndex}`;
              }

              newImgDiv.id = newId;

              let img = newImgDiv.querySelector('img');
              if (img) {
                img.classList.add('sdhub-gallery-img');

                fetch(imgPath)
                  .then(response => response.blob())
                  .then(blob => {
                    const objectURL = URL.createObjectURL(blob);
                    img.src = objectURL;

                    const file = new File([blob], 'image.png', { type: blob.type });
                    img.fileObject = file;

                    img.onload = function() {
                      URL.revokeObjectURL(objectURL);
                      loadedImages++;

                      if (loadedImages === PathList.length) {
                        setTimeout(() => {
                          console.log("Gallery loaded");
                        }, 1000);
                      }
                    };
                  })
                  .catch(error => {
                    console.error('Error fetching image:', error);
                  });
              }

              TabDiv.prepend(newImgDiv);

              if (TabBtn) {
                TabBtn.style.display = 'flex';
              }

              DivIndex++;
            }
          }
        });
      } catch (error) {
        console.error('Error:', error);
      }

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
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

const Tabname = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids'
];

let dataTransferCache = new DataTransfer();

function SDHubImageInfo(imgEL) {
  document.body.classList.add('no-scroll');
  const Div = document.querySelector('#sdhub-gallery-image-info-row');
  const imgInput = document.querySelector('#SDHubimgInfoImage input');
  const img = document.querySelector('#SDHubimgInfoImage img');
  const file = imgEL.fileObject;
  if (file) {
    dataTransferCache.items.clear();
    dataTransferCache.items.add(file);
    imgInput.files = dataTransferCache.files;
    imgInput.dispatchEvent(new Event('change', { bubbles: true }));
    Div.style.display = 'flex';
    setTimeout(() => (Div.style.opacity = '1'), 100);
  }
}

function ClearButtonClearButton() {
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
        e.stopPropagation();
        e.preventDefault();
        closeRow();
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
    Gallery.addEventListener('click', function(event) {
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

    const img = document.createElement('img');
    const textarea = document.createElement('textarea');

    textarea.style.display = 'none';
    textarea.classList.add('prose');

    imgDiv.append(img, textarea);
    Gallery.prepend(TabRow, imgDiv);

    LoadGallery();
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
