function SDHubGalleryImageViewer(mode) {
  const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
  const NextBtn = LightBox.querySelector('#SDHub-Gallery-Image-Viewer-Next-Button');
  const PrevBtn = LightBox.querySelector('#SDHub-Gallery-Image-Viewer-Prev-Button');

  const show = mode === 's' ? 'none' : (window.SDHubImageList.length > 1 ? 'flex' : 'none');
  [NextBtn.style.display, PrevBtn.style.display] = [show, show];
  if (mode === 's') window.SDHubImageList = [window.SDHubImagePath];

  LightBox.style.display = 'flex';
  LightBox.focus();

  document.body.classList.add('no-scroll');
  SDHubGalleryImageViewerDisplayImage();
}

function SDHubGalleryImageViewerDisplayImage() {
  const LightBox = document.getElementById('SDHub-Gallery-Image-Viewer');
  const Control = LightBox.querySelector('#SDHub-Gallery-Image-Viewer-Control');
  const Wrapper = LightBox.querySelector('#SDHub-Gallery-Image-Viewer-Wrapper');

  const imgEL = document.createElement('img');
  imgEL.id = 'SDHub-Gallery-Image-Viewer-img';
  imgEL.src = window.SDHubImagePath;
  Wrapper.append(imgEL);

  requestAnimationFrame(() => {
    LightBox.style.opacity = '1';
    Wrapper.style.transition = '';
    Wrapper.style.transform = 'translate(0px, 0px) scale(1)';
    Wrapper.style.opacity = '1';
  });

  const imgState = {
    scale: 1, offsetX: 0, offsetY: 0, lastX: 0, lastY: 0, lastLen: 1, LastTouch: 0, LastZoom: 0,
    ZoomMomentum: 0, MoveMomentum: 0, SnapMouse: 20, SnapTouch: 10,

    TouchGrass: {
      touchScale: false, last1X: 0, last1Y: 0, last2X: 0, last2Y: 0, delta1X: 0, delta1Y: 0, delta2X: 0, delta2Y: 0, scale: 1
    },

    SDHubGalleryImageViewerSnapBack: function (imgEL, LightBox) {
      const imgELW = imgEL.offsetWidth * this.scale;
      const imgELH = imgEL.offsetHeight * this.scale;
      const LightBoxW = LightBox.offsetWidth;
      const LightBoxH = LightBox.offsetHeight;

      if (this.scale <= 1) {
        this.offsetX = 0; this.offsetY = 0; this.lastX = 0; this.lastY = 0;
        return;

      } else if (imgELW <= LightBoxW && imgELH >= LightBoxH) {
        const EdgeY = (imgELH - LightBoxH) / 2;
        if (this.offsetY > EdgeY) this.offsetY = EdgeY;
        else if (this.offsetY < -EdgeY) this.offsetY = -EdgeY;

        imgEL.style.transition = 'transform 0.3s ease';
        imgEL.style.transform = `translateY(${this.offsetY}px) scale(${this.scale})`;

      } else if (imgELH <= LightBoxH && imgELW >= LightBoxW) {
        const EdgeX = (imgELW - LightBoxW) / 2;
        if (this.offsetX > EdgeX) this.offsetX = EdgeX;
        else if (this.offsetX < -EdgeX) this.offsetX = -EdgeX;

        imgEL.style.transition = 'transform 0.3s ease';
        imgEL.style.transform = `translateX(${this.offsetX}px) scale(${this.scale})`;

      } else if (imgELW >= LightBoxW && imgELH >= LightBoxH) {
        const EdgeX = (imgELW - LightBoxW) / 2;
        if (this.offsetX > EdgeX) this.offsetX = EdgeX;
        else if (this.offsetX < -EdgeX) this.offsetX = -EdgeX;

        const EdgeY = (imgELH - LightBoxH) / 2;
        if (this.offsetY > EdgeY) this.offsetY = EdgeY;
        else if (this.offsetY < -EdgeY) this.offsetY = -EdgeY;

        imgEL.style.transition = 'transform 0.3s ease';
        imgEL.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      }
    },

    SDHubGalleryImageViewerimgReset: function() {
      this.scale = 1; this.offsetX = this.offsetY = this.lastX = this.lastY = 0;
      Object.assign(this.TouchGrass, {
        touchScale: false, last1X: 0, last1Y: 0, last2X: 0, last2Y: 0, delta1X: 0, delta1Y: 0, delta2X: 0, delta2Y: 0, scale: 1
      });

      imgEL.style.transition = imgEL.style.transform = '';
    },

    SDHubGalleryImageViewerCloseZoom: function () {
      LightBox.style.opacity = '';

      setTimeout(() => {
        LightBox.style.display = 'none';
        Wrapper.style.transform = Wrapper.style.opacity = '';
        document.getElementById('SDHub-Gallery-Image-Viewer-img')?.remove();
        document.body.classList.remove('no-scroll');
      }, 200);
    }
  };

  window.SDHubGalleryImageViewerCloseZoom = imgState.SDHubGalleryImageViewerCloseZoom;

  imgState.SDHubGalleryImageViewerimgReset();
  imgEL.ondrag = imgEL.ondragend = imgEL.ondragstart = (e) => { e.stopPropagation(); e.preventDefault(); };

  let GropinTime = null;
  let Groped = false;

  imgEL.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    GropinTime = setTimeout(() => {
      Groped = true;
      imgEL.style.transition = 'transform 0s ease';
      imgEL.style.cursor = 'grab';
      imgState.lastX = e.clientX - imgState.offsetX;
      imgState.lastY = e.clientY - imgState.offsetY;
      Control.style.opacity = '0';
    }, 100);
  });

  imgEL.addEventListener('mousemove', (e) => {
    if (!Groped) return;

    e.preventDefault();
    imgEL.onclick = (e) => e.stopPropagation();
    LightBox.onclick = (e) => e.stopPropagation();

    const imgELW = imgEL.offsetWidth * imgState.scale;
    const imgELH = imgEL.offsetHeight * imgState.scale;
    const LightBoxW = LightBox.offsetWidth;
    const LightBoxH = LightBox.offsetHeight;

    const deltaX = e.clientX - imgState.lastX;
    const deltaY = e.clientY - imgState.lastY;

    imgEL.style.transition = 'transform 60ms ease';

    if (imgState.scale <= 1) {
      imgEL.style.transform = 'translate(0px, 0px) scale(1)';

    } else if (imgELW <= LightBoxW && imgELH >= LightBoxH) {
      imgState.offsetY = deltaY;
      const EdgeY = (imgELH - LightBoxH) / 2;
      imgState.offsetY = Math.max(Math.min(imgState.offsetY, EdgeY + imgState.SnapMouse), -EdgeY - imgState.SnapMouse);
      imgEL.style.transform = `translateY(${imgState.offsetY}px) scale(${imgState.scale})`;

    } else if (imgELH <= LightBoxH && imgELW >= LightBoxW) {
      imgState.offsetX = deltaX;
      const EdgeX = (imgELW - LightBoxW) / 2;
      imgState.offsetX = Math.max(Math.min(imgState.offsetX, EdgeX + imgState.SnapMouse), -EdgeX - imgState.SnapMouse);
      imgEL.style.transform = `translateX(${imgState.offsetX}px) scale(${imgState.scale})`;

    } else if (imgELW >= LightBoxW && imgELH >= LightBoxH) {
      imgState.offsetX = deltaX;
      imgState.offsetY = deltaY;

      const EdgeX = (imgELW - LightBoxW) / 2;
      imgState.offsetX = Math.max(Math.min(imgState.offsetX, EdgeX + imgState.SnapMouse), -EdgeX - imgState.SnapMouse);

      const EdgeY = (imgELH - LightBoxH) / 2;
      imgState.offsetY = Math.max(Math.min(imgState.offsetY, EdgeY + imgState.SnapMouse), -EdgeY - imgState.SnapMouse);

      imgEL.style.transform = `translate(${imgState.offsetX}px, ${imgState.offsetY}px) scale(${imgState.scale})`;
    }
  });

  const MouseUp = (e) => {
    clearTimeout(GropinTime);
    if (!Groped && e.button === 0) {
      imgEL.onclick = (e) => (e.preventDefault(), imgState.SDHubGalleryImageViewerCloseZoom());
      LightBox.onclick = (e) => (e.preventDefault(), imgState.SDHubGalleryImageViewerCloseZoom());
      return;
    }

    imgState.SDHubGalleryImageViewerSnapBack(imgEL, LightBox);
    Groped = false;
    imgEL.style.cursor = 'auto';
    setTimeout(() => imgEL.style.transition = 'transform 0s ease', 100);
    Control.style.opacity = '';
  };

  const MouseLeave = (e) => {
    if (e.target !== LightBox && Groped) {
      imgState.SDHubGalleryImageViewerSnapBack(imgEL, LightBox);
      Groped = false;
      imgEL.style.cursor = 'auto';
      Control.style.opacity = '';
    }
  };

  imgEL.addEventListener('wheel', (e) => {
    e.stopPropagation();
    e.preventDefault();

    const CTRL = e.ctrlKey || e.metaKey;
    const SHIFT = e.shiftKey;

    const currentTime = Date.now();
    const timeDelta = currentTime - imgState.LastZoom;
    imgState.LastZoom = currentTime;

    const centerX = LightBox.offsetWidth / 2;
    const centerY = LightBox.offsetHeight / 2;
    const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
    const zoomStep = 0.15;
    const zoom = 1 + delta * zoomStep;
    const moveStep = 30 * imgState.scale;
    const lastScale = imgState.scale;

    if (!CTRL && !SHIFT) {
      imgState.scale *= zoom;
      imgState.scale = Math.max(1, Math.min(imgState.scale, 10));
    }

    imgState.ZoomMomentum = delta / (timeDelta * 0.5 || 1);
    imgState.ZoomMomentum = Math.min(Math.max(imgState.ZoomMomentum, -1.5), 1.5);
    const ZoomFactor = Math.abs(imgState.ZoomMomentum);
    const ZoomTransition = `transform ${0.4 * (1 + ZoomFactor)}s cubic-bezier(0.25, 0.1, 0.25, 1)`;

    imgState.MoveMomentum = delta / (timeDelta * 0.1 || 1);
    imgState.MoveMomentum = Math.min(Math.max(imgState.MoveMomentum, -2), 2);
    const MoveFactor = Math.abs(imgState.MoveMomentum);
    const MoveTransition = `transform ${0.2 * (1 + MoveFactor)}s cubic-bezier(0.25, 0.1, 0.25, 1)`;

    imgEL.style.transition = (CTRL || SHIFT) ? MoveTransition : ZoomTransition;
    const SCALE = (CTRL || SHIFT) ? lastScale : imgState.scale;

    const imgELW = imgEL.offsetWidth * imgState.scale;
    const imgELH = imgEL.offsetHeight * imgState.scale;
    const LightBoxW = LightBox.offsetWidth;
    const LightBoxH = LightBox.offsetHeight;

    if (imgState.scale <= 1) {
      imgEL.style.transform = 'translate(0px, 0px) scale(1)';

    } else if (imgELW <= LightBoxW && imgELH >= LightBoxH) {
      if (CTRL) {
        imgState.offsetY -= delta * moveStep;
      } else {
        const imgCenterY = imgState.offsetY + centerY;
        imgState.offsetY = e.clientY - ((e.clientY - imgCenterY) / lastScale) * imgState.scale - centerY;
      }

      const EdgeY = (imgELH - LightBoxH) / 2;
      if (imgState.offsetY > EdgeY) imgState.offsetY = EdgeY;
      else if (imgState.offsetY < -EdgeY) imgState.offsetY = -EdgeY;

      imgEL.style.transform = `translateY(${imgState.offsetY}px) scale(${SCALE})`;

    } else if (imgELH <= LightBoxH && imgELW >= LightBoxW) {
      if (SHIFT) {
        imgState.offsetX -= delta * moveStep;
      } else {
        const imgCenterX = imgState.offsetX + centerX;
        imgState.offsetX = e.clientX - ((e.clientX - imgCenterX) / lastScale) * imgState.scale - centerX;
      }

      const EdgeX = (imgELW - LightBoxW) / 2;
      if (imgState.offsetX > EdgeX) imgState.offsetX = EdgeX;
      else if (imgState.offsetX < -EdgeX) imgState.offsetX = -EdgeX;

      imgEL.style.transform = `translateX(${imgState.offsetX}px) scale(${SCALE})`;

    } else if (imgELW >= LightBoxW && imgELH >= LightBoxH) {
      if (CTRL) {
        imgState.offsetY -= delta * moveStep;
      } else if (SHIFT) {
        imgState.offsetX -= delta * moveStep;
      } else if (!SHIFT && !CTRL) {
        const imgCenterX = imgState.offsetX + centerX;
        const imgCenterY = imgState.offsetY + centerY;
        imgState.offsetX = e.clientX - ((e.clientX - imgCenterX) / lastScale) * imgState.scale - centerX;
        imgState.offsetY = e.clientY - ((e.clientY - imgCenterY) / lastScale) * imgState.scale - centerY;
      }

      const EdgeX = (imgELW - LightBoxW) / 2;
      if (imgState.offsetX > EdgeX) imgState.offsetX = EdgeX;
      else if (imgState.offsetX < -EdgeX) imgState.offsetX = -EdgeX;

      const EdgeY = (imgELH - LightBoxH) / 2;
      if (imgState.offsetY > EdgeY) imgState.offsetY = EdgeY;
      else if (imgState.offsetY < -EdgeY) imgState.offsetY = -EdgeY;

      imgEL.style.transform = `translate(${imgState.offsetX}px, ${imgState.offsetY}px) scale(${SCALE})`;
    }

    imgState.ZoomMomentum *= 0.5;
    imgState.MoveMomentum *= 0.1;
  }, { passive: false });

  let MultiGrope = false;
  let DragSpeed = 1.5;
  let lastDistance = 0;
  let lastScale = 1;

  const SDHubGalleryImageViewerTouchDistance = (t1, t2) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  LightBox.ontouchmove = (e) => e.target !== imgEL && (e.stopPropagation(), e.preventDefault());

  imgEL.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    imgEL.style.transition = 'none';
    Control.style.opacity = '0';
    if (e.targetTouches[1]) {
      MultiGrope = true;
      imgState.TouchGrass.touchScale = true;
      lastDistance = SDHubGalleryImageViewerTouchDistance(e.targetTouches[0], e.targetTouches[1]);
      lastScale = imgState.scale;
    } else {
      MultiGrope = false;
      if (!imgState.TouchGrass.touchScale) {
        imgState.lastX = e.targetTouches[0].clientX;
        imgState.lastY = e.targetTouches[0].clientY;
      }
    }
  });

  imgEL.addEventListener('touchmove', (e) => {
    e.stopPropagation();
    e.preventDefault();
    imgEL.onclick = (e) => e.stopPropagation();

    if (e.targetTouches[1]) {
      const currentDistance = SDHubGalleryImageViewerTouchDistance(e.targetTouches[0], e.targetTouches[1]);
      const zoom = currentDistance / lastDistance;
      const centerX = LightBox.offsetWidth / 2;
      const centerY = LightBox.offsetHeight / 2;
      const pinchCenterX = (e.targetTouches[0].clientX + e.targetTouches[1].clientX) / 2;
      const pinchCenterY = (e.targetTouches[0].clientY + e.targetTouches[1].clientY) / 2;
      const prevScale = imgState.scale;

      imgState.scale = lastScale * zoom;
      imgState.scale = Math.max(1, Math.min(imgState.scale, 10));

      const imgELW = imgEL.offsetWidth * imgState.scale;
      const imgELH = imgEL.offsetHeight * imgState.scale;
      const LightBoxW = LightBox.offsetWidth;
      const LightBoxH = LightBox.offsetHeight;

      if (imgState.scale <= 1) {
        imgState.offsetX = 0;
        imgState.offsetY = 0;
        imgEL.style.transform = `translate(0px, 0px) scale(${imgState.scale})`;

      } else if (imgELW <= LightBoxW && imgELH >= LightBoxH) {
        const imgCenterY = imgState.offsetY + centerY;
        imgState.offsetY = pinchCenterY - ((pinchCenterY - imgCenterY) / prevScale) * imgState.scale - centerY;

        const EdgeY = (imgELH - LightBoxH) / 2;
        if (imgState.offsetY > EdgeY) imgState.offsetY = EdgeY;
        else if (imgState.offsetY < -EdgeY) imgState.offsetY = -EdgeY;

        imgEL.style.transform = `translateY(${imgState.offsetY}px) scale(${imgState.scale})`;

      } else if (imgELH <= LightBoxH && imgELW >= LightBoxW) {
        const imgCenterX = imgState.offsetX + centerX;
        imgState.offsetX = pinchCenterX - ((pinchCenterX - imgCenterX) / prevScale) * imgState.scale - centerX;

        const EdgeX = (imgELW - LightBoxW) / 2;
        if (imgState.offsetX > EdgeX) imgState.offsetX = EdgeX;
        else if (imgState.offsetX < -EdgeX) imgState.offsetX = -EdgeX;

        imgEL.style.transform = `translateX(${imgState.offsetX}px) scale(${imgState.scale})`;

      } else if (imgELW >= LightBoxW && imgELH >= LightBoxH) {
        const imgCenterX = imgState.offsetX + centerX;
        const imgCenterY = imgState.offsetY + centerY;

        imgState.offsetX = pinchCenterX - ((pinchCenterX - imgCenterX) / prevScale) * imgState.scale - centerX;
        imgState.offsetY = pinchCenterY - ((pinchCenterY - imgCenterY) / prevScale) * imgState.scale - centerY;

        const EdgeX = (imgELW - LightBoxW) / 2;
        const EdgeY = (imgELH - LightBoxH) / 2;

        if (imgState.offsetX > EdgeX) imgState.offsetX = EdgeX;
        else if (imgState.offsetX < -EdgeX) imgState.offsetX = -EdgeX;

        if (imgState.offsetY > EdgeY) imgState.offsetY = EdgeY;
        else if (imgState.offsetY < -EdgeY) imgState.offsetY = -EdgeY;

        imgEL.style.transform = `translate(${imgState.offsetX}px, ${imgState.offsetY}px) scale(${imgState.scale})`;
      }
    } else if (!imgState.TouchGrass.touchScale) {
      imgEL.style.transition = 'transform 60ms ease';

      const currentX = e.targetTouches[0].clientX;
      const currentY = e.targetTouches[0].clientY;
      const deltaX = (currentX - imgState.lastX) * DragSpeed;
      const deltaY = (currentY - imgState.lastY) * DragSpeed;

      const imgELW = imgEL.offsetWidth * imgState.scale;
      const imgELH = imgEL.offsetHeight * imgState.scale;
      const LightBoxW = LightBox.offsetWidth;
      const LightBoxH = LightBox.offsetHeight;

      if (imgState.scale <= 1) {
        imgState.offsetX = 0;
        imgState.offsetY = 0;
        imgEL.style.transform = `translate(0px, 0px) scale(${imgState.scale})`;

      } else if (imgELW <= LightBoxW && imgELH >= LightBoxH) {
        imgState.offsetY += deltaY;
        const EdgeY = (imgELH - LightBoxH) / 2;
        imgState.offsetY = Math.max(Math.min(imgState.offsetY, EdgeY + imgState.SnapTouch), -EdgeY - imgState.SnapTouch);
        imgEL.style.transform = `translateY(${imgState.offsetY}px) scale(${imgState.scale})`;

      } else if (imgELH <= LightBoxH && imgELW >= LightBoxW) {
        imgState.offsetX += deltaX;
        const EdgeX = (imgELW - LightBoxW) / 2;
        imgState.offsetX = Math.max(Math.min(imgState.offsetX, EdgeX + imgState.SnapTouch), -EdgeX - imgState.SnapTouch);
        imgEL.style.transform = `translateX(${imgState.offsetX}px) scale(${imgState.scale})`;

      } else if (imgELW >= LightBoxW && imgELH >= LightBoxH) {
        imgState.offsetX += deltaX;
        imgState.offsetY += deltaY;

        const EdgeX = (imgELW - LightBoxW) / 2;
        const EdgeY = (imgELH - LightBoxH) / 2;

        imgState.offsetX = Math.max(Math.min(imgState.offsetX, EdgeX + imgState.SnapTouch), -EdgeX - imgState.SnapTouch);
        imgState.offsetY = Math.max(Math.min(imgState.offsetY, EdgeY + imgState.SnapTouch), -EdgeY - imgState.SnapTouch);
        imgEL.style.transform = `translate(${imgState.offsetX}px, ${imgState.offsetY}px) scale(${imgState.scale})`;
      }

      imgState.lastX = currentX;
      imgState.lastY = currentY;
    }
  });

  imgEL.addEventListener('touchcancel', (e) => {
    e.stopPropagation();
    e.preventDefault();
    Control.style.opacity = '';
    imgEL.onclick = undefined;
    MultiGrope = false;
    imgState.TouchGrass.touchScale = false;
    imgEL.style.transform = `translate(${imgState.offsetX}px, ${imgState.offsetY}px) scale(${imgState.scale})`;
    imgState.SDHubGalleryImageViewerSnapBack(imgEL, LightBox);
  });

  imgEL.addEventListener('touchend', (e) => {
    e.stopPropagation();
    Control.style.opacity = '';
    imgEL.onclick = undefined;
    imgEL.style.transition = 'none';
    if (e.targetTouches.length === 0) {
      if (MultiGrope) MultiGrope = false; imgState.TouchGrass.touchScale = false;
      imgState.SDHubGalleryImageViewerSnapBack(imgEL, LightBox);
      setTimeout(() => imgState.TouchGrass.touchScale = false, 10);
    }
  });

  document.addEventListener('mouseleave', MouseLeave);
  document.addEventListener('mouseup', MouseUp);
}

function SDHubGalleryNextImage() {
  if (window.SDHubImageList.length <= 1) return;
  window.SDHubImageIndex = (window.SDHubImageIndex + 1) % window.SDHubImageList.length;
  window.SDHubImagePath = window.SDHubImageList[window.SDHubImageIndex];
  document.getElementById('SDHub-Gallery-Image-Viewer-img')?.remove();
  SDHubGalleryImageViewerDisplayImage();
}

function SDHubGalleryPrevImage() {
  if (window.SDHubImageList.length <= 1) return;
  window.SDHubImageIndex = (window.SDHubImageIndex - 1 + window.SDHubImageList.length) % window.SDHubImageList.length;
  window.SDHubImagePath = window.SDHubImageList[window.SDHubImageIndex];
  document.getElementById('SDHub-Gallery-Image-Viewer-img')?.remove();
  SDHubGalleryImageViewerDisplayImage();
}

function SDHubGalleryOpenViewerFromButton(imgEL) {
  const TabCon = imgEL.closest('.sdhub-gallery-tab-container');
  window.SDHubImagePath = imgEL.getAttribute('data-image');
  window.SDHubImageList = [...TabCon.querySelectorAll('img')].map(img => img.getAttribute('data-image'));
  window.SDHubImageIndex = window.SDHubImageList.indexOf(window.SDHubImagePath);
  SDHubGalleryImageViewer('m');
}
