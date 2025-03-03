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

function SDHubTranslateUI(text, count = 1) {
  const lang = navigator.language || navigator.languages[0] || 'en';

  const translations = {
    auto_upload_to: ['Auto Upload to', '自動アップロード先', '自动上传到', '自动上传到', 'Carga automática a', 'Unggah otomatis ke', '자동 업로드 대상'],
    enabled: ['Enabled', '有効', '已启用', '已启用', 'Habilitado', 'Diaktifkan', '사용함'],
    click_to_enable: ['Click to Enable', 'クリックして有効にする', '点击启用', '点击启用', 'Haz clic para habilitar', 'Klik untuk mengaktifkan', '클릭하여 활성화'],
    hidden: ['Hidden', '非表示', '隐藏', '隐藏', 'Oculto', 'Tersembunyi', '숨김'],
    public: ['Public', '公開', '公开', '公开', 'Público', 'Publik', '공개'],
    true: ['True', '真', '真', '真', 'Verdadero', 'True', '참'],
    false: ['False', '偽', '假', '假', 'Falso', 'False', '거짓'],
    imgchest_api_key: ['imgchest API key', 'imgchest API キー', 'imgchest API 密钥', 'imgchest API 密钥', 'clave API de imgchest', 'kunci API imgchest', 'imgchest API 키'],
    item: ['item', '個', '项', '项', 'artículo', 'item', '개'],
    items: ['items', '個', '项', '项', 'artículos', 'item', '개'],
    image_viewer: ['Image Viewer', '画像ビューア', '图片查看器', '图片查看器', 'Visor de imágenes', 'Penampil Gambar', '이미지 뷰어'],
    uploader: ['Uploader', 'アップローダー', '上传器', '上传器', 'Cargador', 'Pengunggah', '업로더'],
    open_new_tab: ['Open image in new tab', '新しいタブで画像を開く', '在新标签页打开图片', '在新标签页打开图片', 'Abrir imagen en nueva pestaña', 'Buka gambar di tab baru', '새 탭에서 이미지 열기'],
    download: ['Download', 'ダウンロード', '下载', '下载', 'Descargar', 'Unduh', '다운로드'],
    image_info: ['Image Info', '画像情報', '图片信息', '图片信息', 'Información de la imagen', 'Info Gambar', '이미지 정보'],
    send_to: ['Send To...', '送信先...', '发送到...', '发送到...', 'Enviar a...', 'Kirim ke...', '보내기...'],
    delete: ['Delete', '削除', '删除', '删除', 'Eliminar', 'Hapus', '삭제'],
    yes: ['Yes', 'はい', '是', '是', 'Sí', 'Ya', '예'],
    no: ['No', 'いいえ', '否', '否', 'No', 'Tidak', '아니요'],
    clear: ['Clear', 'クリア', '清除', '清除', 'Borrar', 'Hapus', '지우기'],
    remove_image: ['Remove Image', '画像を削除', '删除图片', '删除图片', 'Eliminar imagen', 'Hapus Gambar', '이미지 삭제'],
    load: ['Load', 'ロード', '加载', '加载', 'Cargar', 'Muat', '불러오기'],
    save: ['Save', 'セーブ', '保存', '保存', 'Guardar', 'Simpan', '저장']
  };

  const languageIndex = {
    en: 0,
    ja: 1,
    zh: 2,
    'zh-CN': 3,
    es: 4,
    id: 5,
    ko: 6
  };

  const selectedLangIndex = languageIndex[lang] || languageIndex['en'];

  if (text === 'item' || text === 'items') {
    return translations[text][selectedLangIndex] || (count === 1 ? 'item' : 'items');
  }

  return translations[text.toLowerCase()] ? translations[text.toLowerCase()][selectedLangIndex] : text;
}
