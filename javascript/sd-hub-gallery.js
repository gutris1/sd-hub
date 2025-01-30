function GalleryInitialLoad() {
  let imgPathList = document.querySelector('#sdhub-gallery-imginitial textarea');

  if (imgPathList && imgPathList.value.trim() !== '') {
    const PathList = imgPathList.value.split(',').map(path => path.trim());
    let DivIndex = 1;
    let imgDiv = document.querySelector('#sdhub-imgdiv-0');

    PathList.forEach((imgPathValue) => {
      let imgPath = imgPathValue.replace(/[\[\]']+/g, '').trim();
      let encodedPath = encodeURIComponent(imgPath);

      let whichTab = Tabname.find(whichTab => imgPath.includes(whichTab));

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
            img.src = '/file=' + encodedPath;
          }

          TabDiv.appendChild(newImgDiv);

          if (TabBtn) {
            TabBtn.style.display = 'flex';
          }

          DivIndex++;
        }
      }
    });

    for (let i = 0; i < Tabname.length; i++) {
      let TabBtn = document.getElementById(`sdhub-gallery-${Tabname[i]}-tab-button`);
      let TabDiv = document.getElementById(`sdhub-gallery-${Tabname[i]}-tab-div`);

      if (TabBtn && TabDiv) {
        TabBtn.classList.add('selected');
        TabDiv.style.display = 'flex';
        break;
      }
    }
  }
}

function LoadGallery() {
  fetch('/sd-hub-gallery-initial')
    .then(response => response.json())
    .then(data => {
      const PathList = data.image_paths;
      let DivIndex = 1;
      let imgDiv = document.querySelector('#sdhub-imgdiv-0');

      PathList.forEach((imgPathValue) => {
        let imgPath = imgPathValue.replace(/[\[\]']+/g, '').trim();
        let whichTab = Tabname.find(whichTab => imgPath.includes(whichTab));

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
              img.src = imgPath;
            }

            TabDiv.appendChild(newImgDiv);

            if (TabBtn) {
              TabBtn.style.display = 'flex';
            }

            DivIndex++;
          }
        }
      });

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
    .catch(error => console.error('Error:', error));
}

const Tabname = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids'
];

onUiLoaded(function () {
  let Gallery = document.querySelector('#sdhub-gallery-tab');

  if (Gallery) {
    Gallery.addEventListener('click', function(event) {
      const clickedImg = event.target.closest('img');
      if (clickedImg) {
        console.log(clickedImg.src);
      }
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
    const sendbutton = document.createElement('div');

    textarea.style.display = 'none';
    textarea.classList.add('prose');

    const btn1 = document.createElement('button');
    const btn2 = document.createElement('button');
    const btn3 = document.createElement('button');
    const btn4 = document.createElement('button');

    sendbutton.append(btn1, btn2, btn3, btn4);
    imgDiv.append(img, textarea, sendbutton);
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
