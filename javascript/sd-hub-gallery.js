let dataCache = new DataTransfer();
let fetchTimeout = null;
let lastFetch = 0;
let DivIndex = 1;
let Hover;
let RightClick = false

const Tabname = [
  'txt2img-images',
  'img2img-images',
  'extras-images',
  'txt2img-grids',
  'img2img-grids'
];

function SDHubGalleryFetchImage(images) {
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

function SDHubGalleryFetchList(r) {
  fetch(r)
    .then(response => response.json())
    .then(data => data.images?.length && SDHubGalleryFetchImage(data.images))
    .catch(console.error);
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
      SDHubGalleryFetchList('/sd-hub-gallery-list');
      lastFetch = Date.now();
      fetchTimeout = null;
    }, remainingTime);
    return;
  }

  SDHubGalleryFetchList('/sd-hub-gallery-list');
  lastFetch = now;
}

onAfterUiUpdate(function() {
  debouncingFetch();
});

onUiTabChange(function() {
  let MainTab = gradioApp().querySelector('#tabs > .tab-nav > button.selected');
  if (MainTab && (MainTab.textContent.trim() === 'HUB')) {
    SDHubGalleryFetchList('/sd-hub-gallery-list');
  }
});

onUiLoaded(function () {
  let GalleryTab = document.querySelector("#sdhub-gallery-tab");
  if (GalleryTab) SDHubCreateGallery(GalleryTab);
});

function SDHubCreateGallery(GalleryTab) {
  const GalleryCM = document.createElement("div");
  GalleryCM.id = "SDHub-Gallery-ContextMenu";
  GalleryCM.classList.add("sdhub-gallery-contextmenu");
  GalleryCM.innerHTML = `
    <ul>
      <li onclick="SDHubGalleryOpenImageInNewTab()">Open image in new tab</li>
      <li onclick="SDHubGalleryDownloadImage()">Download</li>
      <li class="sdhub-cm-sendto">
        Send To...
        <div id="sdhub-cm-sendto-menu" class="sdhub-cm-submenu sdhub-gallery-contextmenu">
          <ul>
            <li onclick="SDHubGallerySendImage('txt')">txt2img</li>
            <li onclick="SDHubGallerySendImage('img')">img2img</li>
            <li onclick="SDHubGallerySendImage('extras')">extras</li>
            <li onclick="SDHubGallerySendImage('inpaint')">inpaint</li>
          </ul>
        </div>
      </li>
      <li onclick="SDHubGalleryDeleteImage()">Delete</li>
    </ul>
  `;

  const TabRow = document.createElement("div");
  TabRow.id = "sdhub-gallery-tab-button-row";

  const btnClass = ["lg", "primary", "gradio-button", "svelte-cmf5ev", "sdhub-gallery-tab-button"];

  Tabname.forEach(whichTab => {
    let btnTitle = whichTab.includes('grids') 
      ? whichTab 
      : whichTab.split('-')[0].toLowerCase();

    const TabBtn = document.createElement('button');
    TabBtn.id = `sdhub-gallery-${whichTab}-tab-button`;
    TabBtn.classList.add(...btnClass);
    TabBtn.textContent = btnTitle;
    TabBtn.addEventListener('click', () => SDHubGallerySwitchTab(whichTab));

    const TabDiv = document.createElement('div');
    TabDiv.id = `sdhub-gallery-${whichTab}-tab-div`;
    TabDiv.classList.add('sdhub-gallery-tab-div');

    TabRow.append(TabBtn);
    GalleryTab.append(TabDiv);
  });

  const imgDiv = document.createElement("div");
  imgDiv.id = "sdhub-imgdiv-0";
  imgDiv.classList.add("sdhub-gallery-img-div");

  const imgCOn = document.createElement("div");
  imgCOn.id = "sdhub-imgCon";

  const imgWrap = document.createElement("div");
  imgWrap.id = "sdhub-gallery-img-wrapper";

  const img = document.createElement("img");
  img.id = "sdhub-gallery-img";

  const Btn = document.createElement("button");
  Btn.id = "sdhub-gallery-img-button";
  Btn.innerHTML = ContextSVG;

  const eFrame = document.createElement("div");
  eFrame.id = "sdhub-gallery-empty-frame";

  imgWrap.append(img, Btn, eFrame);
  imgCOn.append(imgWrap);
  imgDiv.append(imgCOn);
  GalleryTab.prepend(TabRow, imgDiv);
  document.body.appendChild(GalleryCM);

  SDHubGalleryFetchList("/sd-hub-gallery-initial");
  SDHubGalleryEventListener(GalleryTab, GalleryCM);
}

function SDHubGalleryEventListener(GalleryTab, GalleryCM) {
  GalleryTab.addEventListener("click", (e) => {
    const imgEL = e.target.closest("img");
    imgEL && SDHubGalleryImageInfo(imgEL);
  });

  GalleryTab.addEventListener("mouseenter", (e) => {
    const Btn = e.target.closest("#sdhub-gallery-img-button");
    if (!Btn) return;

    const GalleryCM = document.getElementById("SDHub-Gallery-ContextMenu");
    if (GalleryCM.style.visibility === "visible" && GalleryCM.dataset.targetBtn === Btn) return;

    Hover = setTimeout(() => {
      if (document.querySelector("#sdhub-gallery-img-button:hover")) {
        const imgEL = Btn.closest("#sdhub-gallery-img-wrapper")?.querySelector("img");
        if (imgEL) {
          RightClick = false;
          GalleryCM.dataset.targetBtn = Btn;
          SDHubGalleryContextMenu(e, imgEL);
        }
      }
    }, 200);
  }, true);

  GalleryTab.addEventListener("mouseleave", (e) => {
    clearTimeout(Hover);
    const BtnHover = document.querySelector("#sdhub-gallery-img-button:hover");
    const CMHover = document.querySelector("#SDHub-Gallery-ContextMenu:hover");
    if (!BtnHover && !CMHover && !RightClick) SDHubGalleryKillContextMenu();
  }, true);

  GalleryTab.addEventListener("contextmenu", (e) => {
    const imgEL = e.target.closest("img");
    imgEL
      ? (e.preventDefault(), RightClick = true, SDHubGalleryContextMenu(e, imgEL))
      : SDHubGalleryKillContextMenu();
  });

  document.addEventListener("click", (e) => {
    const GalleryCM = document.getElementById("SDHub-Gallery-ContextMenu");
    const CMVisible = GalleryCM.style.visibility === "visible";
    const ClickOutsideEL = !GalleryCM.contains(e.target);
    const Btn = e.target.closest("#sdhub-gallery-img-button");
    if (CMVisible && ClickOutsideEL && !Btn) RightClick = false; SDHubGalleryKillContextMenu();
  });

  GalleryCM.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}

function SDHubGalleryContextMenu(e, imgEL) {
  const GalleryCM = document.getElementById("SDHub-Gallery-ContextMenu");

  GalleryCM.dataset.targetImagePath = imgEL.getAttribute("data-path");
  GalleryCM.targetFile = imgEL.fileObject;

  GalleryCM.style.transition = "none";
  GalleryCM.style.visibility = "";
  GalleryCM.style.left = "";
  GalleryCM.style.right = "";
  GalleryCM.style.opacity = "";
  GalleryCM.style.pointerEvents = "";

  const menuWidth = GalleryCM.offsetWidth;
  const menuHeight = GalleryCM.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const spaceOnRight = windowWidth - e.pageX;

  if (spaceOnRight >= menuWidth) {
    GalleryCM.style.left = `${e.pageX}px`;
    GalleryCM.style.right = "";
  } else {
    GalleryCM.style.right = `${spaceOnRight}px`;
    GalleryCM.style.left = "";
  }

  const top =
    e.pageY + menuHeight > windowHeight 
      ? e.pageY - menuHeight
      : e.pageY;

  GalleryCM.style.top = `${top}px`;
  GalleryCM.style.pointerEvents = "auto";
  GalleryCM.style.visibility = "visible";
  GalleryCM.style.transition = "";

  setTimeout(() => {
    GalleryCM.style.opacity = "1";
  }, 50);

  setTimeout(() => {
    positionSendToSubmenu();
  }, 100);
}

function positionSendToSubmenu() {
  const submenu = document.querySelector(".sdhub-cm-submenu");
  const sendToButton = document.querySelector(".sdhub-cm-sendto");

  if (!submenu || !sendToButton) return;

  const menuWidth = submenu.offsetWidth;
  const menuHeight = submenu.offsetHeight;
  const buttonRect = sendToButton.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const spaceOnRight = windowWidth - buttonRect.right;
  const spaceBelow = windowHeight - buttonRect.bottom;

  submenu.style.visibility = "visible";
  submenu.style.left = "auto";
  submenu.style.right = "auto";
  submenu.style.marginLeft = 'auto';
  submenu.style.marginRight = 'auto';
  submenu.style.transition = "none";
  submenu.style.opacity = "";
  submenu.style.pointerEvents = "";
  submenu.style.height = "0";

  if (spaceOnRight >= menuWidth) {
    submenu.style.left = "100%";
    submenu.style.marginLeft = '1px';
  } else {
    submenu.style.right = "100%";
    submenu.style.marginRight = '1px';
  }

  if (spaceBelow < menuHeight) {
    submenu.style.top = `-${menuHeight - 30}px`;
  } else {
    submenu.style.top = "0";
  }

  submenu.style.transition = "opacity 0.3s ease";
}

function SDHubGalleryKillContextMenu() {
  const GalleryCM = document.getElementById("SDHub-Gallery-ContextMenu");
  GalleryCM.style.transition = "none";
  GalleryCM.style.visibility = "";
  GalleryCM.style.opacity = "";
  GalleryCM.style.pointerEvents = "";
}

function SDHubGalleryDownloadImage() {
  const imagePath = document.getElementById("SDHub-Gallery-ContextMenu").dataset.targetImagePath;
  const filename = imagePath.substring(imagePath.lastIndexOf("/") + 1) || "image.png";

  const link = document.createElement("a");
  link.href = imagePath;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  SDHubGalleryKillContextMenu();
}

function SDHubGalleryOpenImageInNewTab() {
  const imagePath = document.getElementById("SDHub-Gallery-ContextMenu").dataset.targetImagePath;

  window.open(imagePath, "_blank");
  SDHubGalleryKillContextMenu();
}

function SDHubGalleryDeleteImage() {
  const imagePath = document.getElementById("SDHub-Gallery-ContextMenu").dataset.targetImagePath;
  console.log("Deleted...", imagePath);
  SDHubGalleryKillContextMenu();
}

function SDHubGallerySendImage(v) {
  const file = document.getElementById("SDHub-Gallery-ContextMenu").targetFile;
  const imgInput = document.querySelector('#SDHubimgInfoImage input');

  dataCache.items.clear();
  dataCache.items.add(file);
  imgInput.files = dataCache.files;
  imgInput.dispatchEvent(new Event('change', { bubbles: true }));

  setTimeout(() => {
    switch (v) {
      case "txt":
        document.querySelector('#SDHubimgInfoSendButton > #txt2img_tab')?.click();
        break;
      case "img":
        document.querySelector('#SDHubimgInfoSendButton > #img2img_tab')?.click();
        break;
      case "inpaint":
        document.querySelector('#SDHubimgInfoSendButton > #inpaint_tab')?.click();
        break;
      case "extras":
        document.querySelector('#SDHubimgInfoSendButton > #extras_tab')?.click();
        break;
    }
  }, 500);
}

function SDHubGalleryImageInfo(imgEL) {
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

function SDHubGallerySwitchTab(whichTab) {
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
