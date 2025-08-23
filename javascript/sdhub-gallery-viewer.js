function SDHubGalleryImageViewer(mode, skip = false) {
  const LightBox = document.getElementById(SDHGiV),
  Control = LightBox.querySelector(`#${SDHGiV}-Control`),
  NextBtn = Control.querySelector(`#${SDHGiV}-Next-Button`),
  PrevBtn = Control.querySelector(`#${SDHGiV}-Prev-Button`),
  Wrapper = LightBox.querySelector(`#${SDHGiV}-Wrapper`),

  imgInfoRow = document.getElementById(`${SDHGiI}-Row`),
  pointer = 'sdhub-gallery-pointer-events-none',
  imgId = `${SDHGiV}-img`;

  let imgEL;
  if (!skip) {
    Wrapper.querySelectorAll('img').forEach(img => img.remove());
    imgEL = SDHubEL('img', { id: imgId, src: window.SDHubImagePath });
    Wrapper.append(imgEL);
  } else {
    imgEL = document.getElementById(imgId);
  }

  if (mode) {
    const show = mode === 's' ? 'none' : (window.SDHubImageList.length > 1 ? 'flex' : 'none');
    [NextBtn.style.display, PrevBtn.style.display] = [show, show];
    if (mode === 's') window.SDHubImageList = [window.SDHubImagePath];

    LightBox.style.display = 'flex';
    LightBox.focus();

    requestAnimationFrame(() => requestAnimationFrame(() => {
      LightBox.classList.add(sdhubS);
      setTimeout(() => Wrapper.style.transform = 'translate(0px, 0px) scale(1)', 50);
    }));

    setTimeout(() => {
      LightBox.onkeydown = (e) => {
        if (e.key === 'Escape') return window.SDHubGalleryImageViewerExit();
        if (e.key === 'ArrowLeft') return getComputedStyle(PrevBtn).display === 'flex' && PrevBtn.click();
        if (e.key === 'ArrowRight') return getComputedStyle(NextBtn).display === 'flex' && NextBtn.click();
      };
    }, 300);

    document.body.classList.add(SDHubBnS);
  }

  const ifClose = () => {
    LightBox.onkeydown = null;
    if (imgInfoRow.style.display === 'flex') (imgInfoRow.focus(), document.body.classList.add(SDHubBnS));
  };

  const imageViewer = SharedImageViewer(imgEL, LightBox, Control, Wrapper, {
    noScroll: SDHubBnS, noPointer: pointer, onClose: ifClose,
    onLightboxClose: () => LightBox.classList.remove(sdhubS)
  });

  window.SDHubGalleryImageViewerExit = imageViewer.state.close;
}

function SDHubGalleryImageViewerDisplayImage(skip = false) {
  const LightBox = document.getElementById(`${SDHGiV}`),
  Control = LightBox.querySelector(`#${SDHGiV}-Control`),
  Wrapper = LightBox.querySelector(`#${SDHGiV}-Wrapper`),

  pointer = 'sdhub-gallery-pointer-events-none',
  sf = `${SDHGiI}-output-filter`;

  let imgEL;
  if (!skip) {
    Wrapper.querySelectorAll('img').forEach(img => img.remove());
    imgEL = document.createElement('img');
    imgEL.id = `${SDHGiV}-img`;
    imgEL.src = window.SDHubImagePath;
    Wrapper.append(imgEL);
  } else {
    imgEL = document.getElementById(`${SDHGiV}-img`);
  }

  requestAnimationFrame(() => requestAnimationFrame(() => {
    LightBox.classList.add(sdhubS);
    setTimeout(() => Wrapper.style.transform = 'translate(0px, 0px) scale(1)', 50);
  }));

  const ifClose = () => {
    if (document.getElementById(`${SDHGiI}-Row`)?.style.display === 'flex') document.body.classList.add(SDHubBnS);
  }

  const imageViewer = SharedImageViewer(imgEL, LightBox, Control, Wrapper, {
    noScroll: SDHubBnS, noPointer: pointer, onClose: ifClose,
    onLightboxClose: () => LightBox.classList.remove(sdhubS)
  });

  window.SDHubGalleryImageViewerExit = imageViewer.state.close;
}

function SDHubGallerySwitchImage() {
  window.SDHubImagePath = window.SDHubImageList[window.SDHubImageIndex];

  const Wrapper = document.getElementById(`${SDHGiV}-Wrapper`),
  imgEL = SDHubEL('img', { id: `${SDHGiV}-img`, src: window.SDHubImagePath, class: 'sdhub-gallery-img-0' });

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
  const page = imgEL.closest(`.${sdhgp}s.selected-page`);
  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageList = [...page.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);
}