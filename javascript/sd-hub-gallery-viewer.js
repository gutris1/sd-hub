function SDHubGalleryImageViewer(mode) {
  const LightBox = document.getElementById(`${SDHGiV}`),
        NextBtn = LightBox.querySelector(`#${SDHGiV}-Next-Button`),
        PrevBtn = LightBox.querySelector(`#${SDHGiV}-Prev-Button`);

  const show = mode === 's' ? 'none' : (window.SDHubImageList.length > 1 ? 'flex' : 'none');
  [NextBtn.style.display, PrevBtn.style.display] = [show, show];
  if (mode === 's') window.SDHubImageList = [window.SDHubImagePath];

  LightBox.style.display = 'flex';
  LightBox.focus();

  document.body.classList.add(SDHubBnS);
  SDHubGalleryImageViewerDisplayImage();
}

function SDHubGalleryImageViewerDisplayImage(skip = false) {
  const LightBox = document.getElementById(`${SDHGiV}`),
        Control = LightBox.querySelector(`#${SDHGiV}-Control`),
        Wrapper = LightBox.querySelector(`#${SDHGiV}-Wrapper`),
        pointer = 'sdhub-gallery-pointer-events-none';

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

  requestAnimationFrame(() => setTimeout(() => {
    LightBox.style.opacity = '1';
    setTimeout(() => Wrapper.style.transform = 'translate(0px, 0px) scale(1)', 50);
  }, 50));

  const ifClose = () => {
    if (document.getElementById(`${SDHGiI}-Row`)?.style.display === 'flex') document.body.classList.add(SDHubBnS);
  }

  const imageViewer = SharedImageViewer(imgEL, LightBox, Control, Wrapper, {
    noScroll: SDHubBnS, noPointer: pointer, onClose: ifClose,
  });

  window.SDHubGalleryImageViewerCloseZoom = imageViewer.state.close;
}

function SDHubGallerySwitchImage() {
  window.SDHubImagePath = window.SDHubImageList[window.SDHubImageIndex];

  const imgEL = document.createElement('img');
  imgEL.id = `${SDHGiV}-img`;
  imgEL.src = window.SDHubImagePath;
  imgEL.classList.add('sdhub-gallery-img-0');

  setTimeout(() => {
    const Wrapper = document.getElementById(`${SDHGiV}-Wrapper`);
    Wrapper.querySelectorAll('img').forEach(img => img.remove());
    imgEL.classList.remove('sdhub-gallery-img-0');
    Wrapper.append(imgEL);
    SDHubGalleryImageViewerDisplayImage(true);
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