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
    .sdhub-gallery-tab-container {
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

    .sdhub-gallery-tab-container::-webkit-scrollbar {
      width: 0.4rem !important;
      position: absolute !important;
      right: 4px !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-thumb,
    .sdhub-gallery-tab-container::-webkit-scrollbar-thumb {
      background: var(--primary-400) !important;
      border-radius: 30px !important;
      background-clip: padding-box !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-thumb:hover,
    .sdhub-gallery-tab-container::-webkit-scrollbar-thumb:hover {
      background: var(--primary-600) !important;
    }

    #sdhub-texteditor-editor::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 2px 0 !important;
    }

    .sdhub-gallery-tab-container::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 0px !important;
      margin: 0 !important;
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
  SDHubTabTranslation();
  onSDHubTabChanges();
});

function onSDHubTabChanges() {
  const TargetTabs = [document.getElementById('tabs'), document.getElementById('sdhub-tab')];
  const config = { childList: true, subtree: true };

  TargetTabs.forEach(Target => {
    if (Target) {
      const obs = new MutationObserver((mutationsList, observer) => {
        mutationsList.forEach(mutation => {
          if (mutation.type === 'childList') {
            let MainTab = gradioApp().querySelector('#tabs > .tab-nav > button.selected');
            let Tab = gradioApp().querySelector('#sdhub-tab > .tab-nav > button.selected');
            let Accordion = gradioApp().querySelector('#sdhub-dataframe-accordion');
            const Id = 'sdHUBHidingScrollBar';

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
          }
        });
      });

      obs.observe(Target, config);
    }
  });
}

let SDHubTranslations = {};

const SDHubLangIndex = {
  en: 1,
  ja: 2,
  'zh-CN': 3,
  'zh-TW': 4,
  es: 5,
  ko: 6,
  ru: 7
};

function SDHubParseCSV(csvText) {
  const rows = csvText.split('\n').map(row => row.split(';'));
  const headers = rows[0];

  SDHubTranslations = {};

  Object.keys(SDHubLangIndex).forEach(lang => {
    SDHubTranslations[lang] = {};
  });

  const relevantRows = rows.slice(1).filter(row => row[0] && !row[0].startsWith("//"));

  relevantRows.forEach(row => {
    const key = row[0].trim();
    if (!key) return;

    Object.keys(SDHubLangIndex).forEach(lang => {
      const langIndex = SDHubLangIndex[lang];
      if (langIndex < row.length) {
        const translation = row[langIndex]?.trim();
        if (translation && translation !== '') {
          SDHubTranslations[lang][key] = translation;
        } else {
          SDHubTranslations[lang][key] = key;
        }
      } else {
        SDHubTranslations[lang][key] = key;
      }
    });
  });
}

function getSDHubTranslation(key, count = 1) {
  let lang = navigator.language || navigator.languages[0] || 'en';

  if (key === 'item' || key === 'items') {
    if (SDHubTranslations[lang] && SDHubTranslations[lang][key]) return SDHubTranslations[lang][key];
    if (SDHubTranslations['en'] && SDHubTranslations['en'][key]) return SDHubTranslations['en'][key];
    return count === 1 ? 'item' : 'items';
  }

  if (SDHubTranslations[lang] && SDHubTranslations[lang][key]) return SDHubTranslations[lang][key];
  if (SDHubTranslations['en'] && SDHubTranslations['en'][key]) return SDHubTranslations['en'][key];
  return key;
}

function SDHubTabTranslation() {
  ['.sdhub-downloader-tab-title', '.sdhub-uploader-tab-title'].forEach(tab => {
    let title = document.querySelector(tab);
    if (title) {
      let key = tab === '.sdhub-downloader-tab-title' ? 'download_command_center' : 'upload_to_huggingface';
      if (title.lastChild?.nodeType === Node.TEXT_NODE) title.lastChild.textContent = getSDHubTranslation(key);
    }
  });

  const tokens = [
    { selector: '#sdhub-downloader-token1 > label > span', key: 'huggingface_token_read' },
    { selector: '#sdhub-downloader-token2 > label > span', key: 'civitai_api_key' },
    { selector: '#sdhub-uploader-token > label > span', key: 'huggingface_token_write' },
    { selector: '#sdhub-downloader-token1 > label > input', key: 'huggingface_token_placeholder_read' },
    { selector: '#sdhub-downloader-token2 > label > input', key: 'civitai_api_key_placeholder' },
    { selector: '#sdhub-uploader-token > label > input', key: 'huggingface_token_placeholder_write' }
  ];

  tokens.forEach(({ selector, key }) => {
    let el = document.querySelector(selector);
    if (el) {
      if (el.tagName === 'INPUT') {
        el.placeholder = getSDHubTranslation(key);
      } else {
        el.textContent = getSDHubTranslation(key);
      }
    }
  });

  ['load', 'save'].forEach((key) => {
    const button = document.querySelector(`#sdhub-downloader-${key}-button`);
    if (button) button.textContent = getSDHubTranslation(key.toLowerCase());
  });
}

document.addEventListener('DOMContentLoaded', function() {
  window.getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)[0];
  const path = getRunningScript().match(/file=[^\/]+\/[^\/]+\//)?.[0];
  const file = `${path}sd-hub-translations.csv`;
  const csv = document.createElement('script');
  csv.type = 'text/csv';
  csv.id = 'SDHub-Translation-CSV';

  fetch(file)
    .then(response => response.text())
    .then(csvText => {
      csv.textContent = csvText;
      document.body.appendChild(csv);
      SDHubParseCSV(csvText);
      SDHubGalleryDOMLoaded(path);
    })
    .catch(err => {
      console.error('Error loading CSV:', err);
    });
});
