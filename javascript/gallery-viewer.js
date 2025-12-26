let SDHubGalleryImageViewer = null;

function SDHubGalleryDisplayImageViewer(mode, skip = false) {
  const lightBox = document.getElementById(SDHub.ImgViewer),
  imgWrapper = lightBox.querySelector(`#${SDHub.ImgViewer}-Wrapper`),
  controls = lightBox.querySelector(`#${SDHub.ImgViewer}-Control`),
  nextBtn = controls.querySelector(`#${SDHub.ImgViewer}-Next-Button`),
  prevBtn = controls.querySelector(`#${SDHub.ImgViewer}-Prev-Button`);

  if (SDHubGalleryImageViewer) {
    SDHubGalleryImageViewer.cleanup();
    SDHubGalleryImageViewer = null;
  }

  let img;

  if (skip) {
    img = document.getElementById(`${SDHub.ImgViewer}-img`);
  } else {
    imgWrapper.querySelectorAll('img').forEach(img => img.remove());
    img = SDHubEL('img', { id: `${SDHub.ImgViewer}-img`, src: window.SDHubImagePath });
    imgWrapper.append(img);
  }

  if (mode) {
    document.body.classList.add(SDHub.noScroll);

    const show = mode === 's' ? 'none' : (window.SDHubImageList.length > 1 ? 'flex' : 'none');
    [nextBtn.style.display, prevBtn.style.display] = [show, show];
    if (mode === 's') window.SDHubImageList = [window.SDHubImagePath];

    lightBox.style.display = 'flex';
    lightBox.focus();

    setTimeout(() => requestAnimationFrame(() => {
      [lightBox, imgWrapper].forEach(l => l.classList.add(SDHub.style));
    }), 100);

    setTimeout(() => {
      lightBox.onkeydown = (e) => {
        switch (e.key) {
          case 'Escape': return window.SDHubGalleryImageViewerExit();
          case 'ArrowLeft': return getComputedStyle(prevBtn).display === 'flex' && prevBtn.click();
          case 'ArrowRight': return getComputedStyle(nextBtn).display === 'flex' && nextBtn.click();
        }
      };
    }, 400);
  }

  const closing = () => {
    SDHubGalleryImageViewer = null;
    lightBox.onkeydown = null;
    imgWrapper.classList.remove(SDHub.style);
    if (mode === 's') {
      document.getElementById(`${SDHub.ImgInfo}-Row`).focus();
      document.body.classList.add(SDHub.noScroll);
    } else {
      document.body.classList.remove(SDHub.noScroll);
    }
  };

  SDHubGalleryImageViewer = new SDImageScriptsViewer(img, lightBox, controls, {
    dragStart: () => controls.classList.add(SDHub.style),
    dragEnd: () => controls.classList.remove(SDHub.style),
    exitStart: () => lightBox.classList.remove(SDHub.style),
    exitEnd: closing,
    initDelay: skip ? 100 : 150,
    eventDelay: skip ? 100 : 400
  });

  window.SDHubGalleryImageViewerExit = () => SDHubGalleryImageViewer?.close();
}

function SDHubGallerySwitchImage() {
  window.SDHubImagePath = window.SDHubImageList[window.SDHubImageIndex];

  const imgWrapper = document.getElementById(`${SDHub.ImgViewer}-Wrapper`),
  img = SDHubEL('img', { id: `${SDHub.ImgViewer}-img`, src: window.SDHubImagePath, class: 'sdhub-gallery-img-0' });

  setTimeout(() => {
    imgWrapper.querySelectorAll('img').forEach(img => img.remove());
    img.classList.remove('sdhub-gallery-img-0');
    imgWrapper.append(img);
    SDHubGalleryDisplayImageViewer(null, true);
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

function SDHubGalleryOpenViewerFromButton(img) {
  SDHubGalleryImageViewerimgList(img);
  SDHubGalleryDisplayImageViewer('m');
}

function SDHubGalleryImageViewerimgList(img) {
  const page = img.closest(`.${SDHub.page}s.selected-page`);
  window.SDHubImagePath = img.getAttribute('data-image');
  window.SDHubImageList = [...page.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);
}