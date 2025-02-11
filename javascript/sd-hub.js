function SDHubCopyTextFromUselessDataFrame() {
  document.addEventListener("click", (e) => {
    const table = gradioApp().querySelector("#sdhub-tag-dataframe");

    if (table && table.contains(e.target)) {
      const td = e.target.closest("td");
      const span = td.querySelector("span");
      const text = span ? span.textContent : null;

      if (text) {
        navigator.clipboard.writeText(text);

        td.classList.add("pulse-td");
        setTimeout(() => {
          td.classList.remove("pulse-td");
        }, 2000);
      }
    }
  });
}

function SDHubShellShiftEnter() {
  const tab = document.querySelector('#sdhub-shell-tab');
  const button = document.querySelector('#sdhub-shell-button');

  document.addEventListener('keydown', function(e) {
    if (e.shiftKey && e.key === 'Enter' && tab && window.getComputedStyle(tab).display === 'block') {
      button.click();
    }
  });
}

function SDHubTextEditorCTRLS() {
  const tab = document.querySelector('#sdhub-texteditor-tab');
  const button = document.querySelector('#sdhub-texteditor-save-button');

  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's' && tab && window.getComputedStyle(tab).display === 'block') {
      e.preventDefault();
      button.click();
    }
  });
}

async function SDHubTextEditorInfo() {
  const info = document.querySelector('#sdhub-texteditor-info input');

  if (info.value.trim() !== '') {
    info.style.opacity = '1';
    setTimeout(() => {
      info.style.transition = 'opacity 2s ease';
      info.style.opacity = '0';
    }, 1000);

    setTimeout(() => {
      info.value = '';
      updateInput(info);
      info.style.transition = 'opacity 0.3s ease';
    }, 2000);
  }
}

function SDHubTextEditorGalleryScrollBar() {
  const isFirefox = /firefox/i.test(navigator.userAgent);

  const ScrollBAR = document.createElement('style');
  document.body.appendChild(ScrollBAR);

  const SBforFirefox = `
    #sdhub-texteditor-editor,
    #sdhub-gallery-txt2img-images-tab-div,
    #sdhub-gallery-img2img-images-tab-div,
    #sdhub-gallery-extras-images-tab-div,
    #sdhub-gallery-txt2img-grids-tab-div,
    #sdhub-gallery-img2img-grids-tab-div {
      scrollbar-width: thin !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }
  `;

  const SBwebkit = `
    #sdhub-texteditor-editor::-webkit-scrollbar {
      width: 0.6rem !important;
      position: absolute !important;
      right: 4px !important;
    }

    #sdhub-gallery-txt2img-images-tab-div::-webkit-scrollbar,
    #sdhub-gallery-img2img-images-tab-div::-webkit-scrollbar,
    #sdhub-gallery-extras-images-tab-div::-webkit-scrollbar,
    #sdhub-gallery-txt2img-grids-tab-div::-webkit-scrollbar,
    #sdhub-gallery-img2img-grids-tab-div::-webkit-scrollbar {
      width: 0.4rem !important;
      position: absolute !important;
      right: 4px !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-thumb,
    #sdhub-gallery-txt2img-images-tab-div::-webkit-scrollbar-thumb,
    #sdhub-gallery-img2img-images-tab-div::-webkit-scrollbar-thumb,
    #sdhub-gallery-extras-images-tab-div::-webkit-scrollbar-thumb,
    #sdhub-gallery-txt2img-grids-tab-div::-webkit-scrollbar-thumb,
    #sdhub-gallery-img2img-grids-tab-div::-webkit-scrollbar-thumb {
      background: var(--primary-400) !important;
      border-radius: 30px !important;
      background-clip: padding-box !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-thumb:hover,
    #sdhub-gallery-txt2img-images-tab-div::-webkit-scrollbar-thumb:hover,
    #sdhub-gallery-img2img-images-tab-div::-webkit-scrollbar-thumb:hover,
    #sdhub-gallery-extras-images-tab-div::-webkit-scrollbar-thumb:hover,
    #sdhub-gallery-txt2img-grids-tab-div::-webkit-scrollbar-thumb:hover,
    #sdhub-gallery-img2img-grids-tab-div::-webkit-scrollbar-thumb:hover {
      background: var(--primary-600) !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 2px 0 !important;
    }

    #sdhub-gallery-txt2img-images-tab-div::-webkit-scrollbar-track,
    #sdhub-gallery-img2img-images-tab-div::-webkit-scrollbar-track,
    #sdhub-gallery-extras-images-tab-div::-webkit-scrollbar-track,
    #sdhub-gallery-txt2img-grids-tab-div::-webkit-scrollbar-track,
    #sdhub-gallery-img2img-grids-tab-div::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 12px 0 !important;
    }
  `;

  ScrollBAR.innerHTML = isFirefox ? SBforFirefox : SBwebkit;
}

onUiLoaded(function () {
  window.getRunningScript = () => () => new Error().stack.match(/(?:[a-z]+:\/\/)?[^ \n]*\.js/)[0];
  var FilePath = getRunningScript()().match(/file=([^\/]+\/[^\/]+)\//);

  if (FilePath) {
    var Path = `file=${FilePath[1]}/`;
    var NameFile = 'uploader-info.json';

    fetch(Path + NameFile, { cache: "no-store" })
      .then(response => {
        if (!response.ok) return;
        return response.json();
      })
      .then(data => {
        if (data) {
          const { username, repository, branch } = data;

          const UsernameBox = gradioApp().querySelector('#sdhub-uploader-username-box input');
          const RepoBox = gradioApp().querySelector('#sdhub-uploader-repo-box input');
          const BranchBox = gradioApp().querySelector('#sdhub-uploader-branch-box input');

          const info = [
            { value: username, box: UsernameBox },
            { value: repository, box: RepoBox },
            { value: branch, box: BranchBox }
          ];

          info.forEach(i => {
            if (i.value) {
              i.box.value = i.value;
              updateInput(i.box);
            }
          });
        }
      })
      .catch(error => {
        console.log("Error:", error);
      });
  }

  SDHubCopyTextFromUselessDataFrame();
  SDHubTextEditorGalleryScrollBar();
  SDHubTextEditorCTRLS();
  SDHubShellShiftEnter();
});

var Id = 'sdHUBHidingScrollBar';

onUiUpdate(function() {
  let MainTab = gradioApp().querySelector('#tabs > .tab-nav > button.selected');
  let Tab = gradioApp().querySelector('#sdhub-tab > .tab-nav > button.selected');
  let Accordion = gradioApp().querySelector('#sdhub-dataframe-accordion');

  if (Tab && (Tab.textContent.trim() === 'Text Editor' || Tab.textContent.trim() === 'Gallery')) {
    Accordion.style.display = 'none';
    if (!document.getElementById(Id)) {
      const Scrollbar = document.createElement('style');
      Scrollbar.id = Id;
      Scrollbar.innerHTML = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
      document.head.appendChild(Scrollbar);
    }
    Object.assign(document.documentElement.style, { scrollbarWidth: 'none' });

  } else if (Tab && (Tab.textContent.trim() !== 'Text Editor' || Tab.textContent.trim() !== 'Gallery')) {
    Accordion.style.display = 'block';
    const Scrollbar = document.getElementById(Id);
    if (Scrollbar) document.head.removeChild(Scrollbar);
    Object.assign(document.documentElement.style, { scrollbarWidth: '' });
    document.body.classList.remove('no-scroll');
  }

  if (MainTab && (MainTab.textContent.trim() !== 'HUB')) {
    const Scrollbar = document.getElementById(Id);
    if (Scrollbar) document.head.removeChild(Scrollbar);
    Object.assign(document.documentElement.style, { scrollbarWidth: '' });
    document.body.classList.remove('no-scroll');
  }
});
