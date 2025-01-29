function LoadInitalGallery() {
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

    const tabContainer = document.createElement('div');
    tabContainer.id = 'sdhub-gallery-tab-button-row';

    Tabname.forEach(whichTab => {
      const buttonContent = whichTab.split('-')[0].toLowerCase();
      const button = document.createElement('button');
      button.id = `sdhub-gallery-${whichTab}-tab-button`;
      button.classList.add('lg', 'primary', 'gradio-button', 'svelte-cmf5ev', 'sdhub-gallery-tab-button');
      button.textContent = buttonContent;
      button.addEventListener('click', () => switchGalleryTab(whichTab));

      const tabDiv = document.createElement('div');
      tabDiv.id = `sdhub-gallery-${whichTab}-tab-div`;
      tabDiv.classList.add('sdhub-gallery-tab-div');

      tabContainer.appendChild(button);
      Gallery.appendChild(tabDiv);
    });

    Gallery.prepend(tabContainer);

    const imgDiv = document.createElement('div');
    imgDiv.id = 'sdhub-imgdiv-0';

    const img = document.createElement('img');
    const textarea = document.createElement('textarea');
    const sendbutton = document.createElement('div');

    textarea.style.display = 'none';
    textarea.classList.add('prose');

    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    const button3 = document.createElement('button');
    const button4 = document.createElement('button');

    sendbutton.append(button1, button2, button3, button4);
    imgDiv.append(img, textarea, sendbutton);
    Gallery.appendChild(imgDiv);

    LoadInitalGallery();
  }
});

function switchGalleryTab(whichTab) {
  document.querySelectorAll('[id^="sdhub-gallery-"][id$="-tab-div"]').forEach(tab => {
    tab.style.display = 'none';
  });

  document.querySelectorAll('[id^="sdhub-gallery-"][id$="-tab-button"]').forEach(btn => {
    btn.classList.remove('selected');
  });

  const Tab = document.getElementById(`sdhub-gallery-${whichTab}-tab-div`);
  if (Tab) Tab.style.display = 'flex';

  const Button = document.getElementById(`sdhub-gallery-${whichTab}-tab-button`);
  if (Button) Button.classList.add('selected');
}
