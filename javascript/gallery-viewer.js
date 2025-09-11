function SDHubGalleryImageViewer(mode, skip = false) {
  const LightBox = document.getElementById(SDHubVar.ImgViewer),
  Control = LightBox.querySelector(`#${SDHubVar.ImgViewer}-Control`),
  NextBtn = Control.querySelector(`#${SDHubVar.ImgViewer}-Next-Button`),
  PrevBtn = Control.querySelector(`#${SDHubVar.ImgViewer}-Prev-Button`),
  Wrapper = LightBox.querySelector(`#${SDHubVar.ImgViewer}-Wrapper`),

  imgInfoRow = document.getElementById(`${SDHubVar.ImgInfo}-Row`),
  pointer = 'sdhub-gallery-pointer-events-none',
  imgId = `${SDHubVar.ImgViewer}-img`;

  let imgEL;

  if (skip) {
    imgEL = document.getElementById(imgId);
  } else {
    Wrapper.querySelectorAll('img').forEach(img => img.remove());
    imgEL = SDHubEL('img', { id: imgId, src: window.SDHubImagePath });
    Wrapper.append(imgEL);
  }

  if (mode) {
    document.body.classList.add(SDHubVar.noScroll);

    const show = mode === 's' ? 'none' : (window.SDHubImageList.length > 1 ? 'flex' : 'none');
    [NextBtn.style.display, PrevBtn.style.display] = [show, show];
    if (mode === 's') window.SDHubImageList = [window.SDHubImagePath];

    LightBox.style.display = 'flex';
    LightBox.focus();

    setTimeout(() => requestAnimationFrame(() => {
      LightBox.classList.add(SDHubVar.style);
      setTimeout(() => Wrapper.classList.add(SDHubVar.style), 50);
    }), 100);

    setTimeout(() => {
      LightBox.onkeydown = (e) => {
        switch (e.key) {
          case 'Escape':
            return window.SDHubGalleryImageViewerExit();
          case 'ArrowLeft':
            return getComputedStyle(PrevBtn).display === 'flex' && PrevBtn.click();
          case 'ArrowRight':
            return getComputedStyle(NextBtn).display === 'flex' && NextBtn.click();
        }
      };
    }, 400);
  }

  const closing = () => {
    LightBox.onkeydown = null; Wrapper.classList.remove(SDHubVar.style);
    if (mode === 's') {
      imgInfoRow.focus(); document.body.classList.add(SDHubVar.noScroll);
    } else {
      document.body.classList.remove(SDHubVar.noScroll);
    }
  },

  imageViewer = SharedImageViewer(imgEL, LightBox, {
    zoomStart: () => Control.classList.add(pointer),
    zoomEnd: () => Control.classList.remove(pointer),
    exitStart: () => LightBox.classList.remove(SDHubVar.style),
    exitEnd: closing
  });

  window.SDHubGalleryImageViewerExit = imageViewer.state.close;
}

function SDHubGallerySwitchImage() {
  window.SDHubImagePath = window.SDHubImageList[window.SDHubImageIndex];

  const Wrapper = document.getElementById(`${SDHubVar.ImgViewer}-Wrapper`),
  imgEL = SDHubEL('img', { id: `${SDHubVar.ImgViewer}-img`, src: window.SDHubImagePath, class: 'sdhub-gallery-img-0' });

  setTimeout(() => {
    Wrapper.querySelectorAll('img').forEach(img => img.remove());
    imgEL.classList.remove('sdhub-gallery-img-0');
    Wrapper.append(imgEL);
    SDHubGalleryImageViewer(null, true);
  }, 100);
}

function SDHubGalleryNextImage() {
  if (window.SDHubImageList.length <= 1) return;
  window.SDHubImageIndex = (window.SDHubImageIndex + 1) % window.SDHubImageList.length;
  SDHubGallerySwitchImage();
}

function SDHubGalleryPrevImage() {
  if (window.SDHubImageList.length <= 1) return;
  window.SDHubImageIndex = (window.SDHubImageIndex - 1 + window.SDHubImageList.length) % window.SDHubImageList.length;
  SDHubGallerySwitchImage();
}

function SDHubGalleryOpenViewerFromButton(imgEL) {
  SDHubGalleryImageViewerimgList(imgEL);
  SDHubGalleryImageViewer('m');
}

function SDHubGalleryImageViewerimgList(imgEL) {
  const page = imgEL.closest(`.${SDHubVar.page}s.selected-page`);
  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageList = [...page.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);
}