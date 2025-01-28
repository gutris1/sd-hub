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

function SDHubTextEditorScrollBar() {
  const isFirefox = /firefox/i.test(navigator.userAgent);

  const ScrollBAR = document.createElement('style');
  document.body.appendChild(ScrollBAR);

  const SBforFirefox = `
    #sdhub-texteditor-editor {
      scrollbar-width: thin !important;
      scrollbar-color: var(--primary-400) transparent !important;
    }
  `;

  const SBwebkit = `
    #sdhub-texteditor-editor::-webkit-scrollbar {
      width: 0.4rem !important;
      height: auto !important;
    }
    #sdhub-texteditor-editor::-webkit-scrollbar-thumb {
      background: var(--primary-400) !important;
      border-radius: 30px !important;
    }
    #sdhub-texteditor-editor::-webkit-scrollbar-thumb:hover {
      background: var(--primary-600) !important;
    }
    #sdhub-texteditor-editor::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
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
  SDHubTextEditorScrollBar();
  SDHubTextEditorCTRLS();
  SDHubShellShiftEnter();
});

onUiUpdate(function() {
  var Id = 'sdHUBHidingScrollBar';
  let BS = gradioApp().querySelector('#tabs > .tab-nav > button.selected');

  if (BS && BS.textContent.trim() === 'HUB') {
    if (!document.getElementById(Id)) {
      const SB = document.createElement('style');
      SB.id = Id;
      SB.innerHTML = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
      document.head.appendChild(SB);
    }
    Object.assign(document.documentElement.style, { scrollbarWidth: 'none' });

  } else if (BS && BS.textContent.trim() !== 'HUB') {
    const SB = document.getElementById(Id);
    if (SB) document.head.removeChild(SB);
    Object.assign(document.documentElement.style, { scrollbarWidth: '' });
  }
});
