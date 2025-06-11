function SDHubGalleryImageViewer(mode) {
  const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
  const NextBtn = LightBox.querySelector('#SDHub-Gallery-Image-Viewer-Next-Button');
  const PrevBtn = LightBox.querySelector('#SDHub-Gallery-Image-Viewer-Prev-Button');

  const show = mode === 's' ? 'none' : (window.SDHubImageList.length > 1 ? 'flex' : 'none');
  [NextBtn.style.display, PrevBtn.style.display] = [show, show];
  if (mode === 's') window.SDHubImageList = [window.SDHubImagePath];

  LightBox.style.display = 'flex';
  LightBox.focus();

  document.body.classList.add(SDHubBnS);
  SDHubGalleryImageViewerDisplayImage();
}

function SDHubGalleryImageViewerDisplayImage(skip = false) {
  const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
  const Control = LightBox.querySelector('#SDHub-Gallery-Image-Viewer-Control');
  const Wrapper = LightBox.querySelector('#SDHub-Gallery-Image-Viewer-Wrapper');
  const pointer = 'sdhub-gallery-pointer-events-none';

  let imgEL;

  if (!skip) {
    Wrapper.querySelectorAll('img').forEach(img => img.remove());

    imgEL = document.createElement('img');
    imgEL.id = 'SDHub-Gallery-Image-Viewer-img';
    imgEL.src = window.SDHubImagePath;
    Wrapper.append(imgEL);
  } else {
    imgEL = document.getElementById('SDHub-Gallery-Image-Viewer-img');
  }

  requestAnimationFrame(() => setTimeout(() => {
    LightBox.style.opacity = '1';
    setTimeout(() => Wrapper.style.transform = 'translate(0px, 0px) scale(1)', 50);
  }, 50));

  const ifClose = () => {
    if (document.getElementById('SDHub-Gallery-Info-Column')?.style.display === 'flex') document.body.classList.add(SDHubBnS);
  }

  const imageViewer = SharedImageViewer(imgEL, LightBox, Control, Wrapper, {
    noScroll: SDHubBnS, noPointer: pointer, onClose: ifClose,
  });

  window.SDHubGalleryImageViewerCloseZoom = imageViewer.state.close;
}

function SDHubGallerySwitchImage() {
  window.SDHubImagePath = window.SDHubImageList[window.SDHubImageIndex];

  const imgEL = document.createElement('img');
  imgEL.id = 'SDHub-Gallery-Image-Viewer-img';
  imgEL.src = window.SDHubImagePath;
  imgEL.classList.add('sdhub-gallery-img-0');

  setTimeout(() => {
    const Wrapper = document.getElementById('SDHub-Gallery-Image-Viewer-Wrapper');
    Wrapper.querySelectorAll('img').forEach(img => img.remove());
    imgEL.classList.remove('sdhub-gallery-img-0');
    Wrapper.append(imgEL);
    SDHubGalleryImageViewerDisplayImage(true)
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
  const page = imgEL.closest('.sdhub-gallery-pages.selected-page');
  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageList = [...page.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);
  SDHubGalleryImageViewer('m');
}
