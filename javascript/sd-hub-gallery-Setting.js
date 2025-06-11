let SDHubID = 'SDHub-Gallery-Setting';
let SDHubClass = 'sdhub-gallery-setting';

function SDHubGalleryCreateSetting(SettingButton, Setting) {
  window.SDHubGalleryThumbnailShapeClick = () => {
    const shape = document.getElementById(`${SDHubID}-Thumbnail-Shape-Input`)?.dataset.selected;
    const ThumbPosWrapper = document.getElementById(`${SDHubID}-Thumbnail-Position-Wrapper`);
    const ThumbLayWrapper = document.getElementById(`${SDHubID}-Thumbnail-Layout-Wrapper`);
    if (ThumbPosWrapper && ThumbLayWrapper) {
      ThumbPosWrapper.classList.toggle(`${SDHubClass}-active`, shape === 'square');
      ThumbLayWrapper.classList.toggle(`${SDHubClass}-disable`, shape === 'square');
    }
  };

  function createSettings(t, o = {}) {
    const el = document.createElement(t);
    Object.entries(o).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'children') v.forEach(c => el.appendChild(c));
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el[k] = v;
    });
    return el;
  }

  function createSelections({ id, labelText, options, selected, onChange }) {
    const i = `${SDHubID}-${id}`;

    const parent = createSettings('div', {
      id: i,
      class: `${SDHubClass}-box`,
      title: SDHubGetTranslation(`${labelText}_title`),
    });

    const label = createSettings('label', {
      id: `${i}-Label`,
      class: `${SDHubClass}-label`,
      text: SDHubGetTranslation(labelText)
    });

    const wrapper = createSettings('div', {
      id: `${i}-Wrapper`,
      class: `${SDHubClass}-wrapper`
    });

    const selectionWrapper = createSettings('div', {
      class: `${SDHubClass}-wrapper-selection`
    });

    const input = createSettings('input', {
      id: `${i}-Input`,
      class: `${SDHubClass}-input`,
      value: selected,
      dataset: { selected: selected }
    });

    const inputClass = id.toLowerCase().split('-').slice(-2).join('-');
    const sc = `${SDHubClass}-selected`;
    const c = `sdhub-gallery-selected-${inputClass}`;

    options.forEach(v => {
      const selection = createSettings('div', {
        class: `${SDHubClass}-selection`,
        text: SDHubGetTranslation(v),
        dataset: { selected: v },
        onclick: e => {
          wrapper.querySelectorAll(`.${SDHubClass}-selection`).forEach(p => p.classList.remove(sc, c));
          e.currentTarget.classList.add(sc, c);
          input.value = input.dataset.selected = v;
          if (onChange) onChange(v);
        }
      });

      if (v === selected) selection.classList.add(sc, c);
      selectionWrapper.appendChild(selection);
    });

    wrapper.appendChild(selectionWrapper);
    parent.append(label, wrapper, input);
    return parent;
  }

  function createInputNumber({ id, labelText, min, max, defaultValue }) {
    const i = `${SDHubID}-${id}`;
    const name = id.toLowerCase();
    const last = String(window.SDHubGallerySettings?.[name] ?? defaultValue ?? String(min));

    return createSettings('div', {
      id: i,
      class: `${SDHubClass}-box`,
      title: SDHubGetTranslation(`${labelText}_title`),
      children: [
        createSettings('label', {
          id: `${i}-Label`,
          class: `${SDHubClass}-label`,
          text: SDHubGetTranslation(labelText)
        }),
        createSettings('div', {
          id: `${i}-Wrapper`,
          class: `${SDHubClass}-wrapper`,
          children: [
            createSettings('div', {
              class: `${SDHubClass}-wrapper-selection`,
              children: [
                createSettings('input', {
                  id: `${i}-Input`,
                  type: 'text',
                  spellcheck: false,
                  class: `${SDHubClass}-input-number`,
                  maxLength: String(max).length,
                  dataset: { lastNumber: last },
                  oninput: e => { let i = e.target; i.value = i.value.replace(/[^0-9]/g, ''); },
                  onblur: e => {
                    let i = e.target,
                      v = i.value,
                      n = parseInt(v, 10),
                      def = i.dataset.lastNumber ?? String(min);
                    i.value =
                      v === '' ? def
                      : isNaN(n) || n < min ? (i.dataset.lastNumber = i.value = String(min))
                      : n > max ? (i.dataset.lastNumber = i.value = String(max))
                      : (i.dataset.lastNumber = v);
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  function createCheckbox({ id, labelText, def = false }) {
    const i = `${SDHubID}-${id}`;

    return createSettings('div', {
      id: i,
      class: `${SDHubClass}-box`,
      title: SDHubGetTranslation(`${labelText}_title`),
      children: [
        createSettings('label', {
          id: `${i}-Label`,
          class: `${SDHubClass}-label`,
          text: SDHubGetTranslation(labelText)
        }),
        createSettings('div', {
          id: `${i}-Wrapper`,
          class: `${SDHubClass}-wrapper`,
          children: [
            createSettings('div', {
              class: `${SDHubClass}-wrapper-checkbox`,
              children: [
                createSettings('input', {
                  id: `${i}-Input`,
                  type: 'checkbox',
                  class: `${SDHubClass}-checkbox-input`,
                  checked: window.SDHubGallerySettings?.[id.toLowerCase()] ?? def
                })
              ]
            })
          ]
        })
      ]
    });
  }

  const SettingBox = createSettings('div', {
    id: `${SDHubID}-Box`,
    oncontextmenu: (e) => e.preventDefault()
  });

  const SettingFrame = createSettings('div', {
    id: `${SDHubID}-Frame`
  });

  const ExitButton = createSettings('div', {
    id: `${SDHubID}-Exit-Button`,
    html: SDHubGalleryCloseButtonSVG,
    onclick: killSetting
  });

  const SettingWrapper = createSettings('div', {
    id: `${SDHubID}-Wrapper`
  });

  const SettingTitle = createSettings('span', {
    id: `${SDHubID}-Title`,
    html: SDHubGetTranslation('setting_title')
  });

  const SettingSetting = createSettings('div', {
    id: `${SDHubID}-Setting`
  });

  const pageLimiter = createInputNumber({
    id: 'Page-Limiter',
    labelText: 'images_per_page',
    min: 10,
    max: 1000,
    defaultValue: 10
  });

  const thumbnailShape = createSelections({
    id: 'Thumbnail-Shape',
    labelText: 'thumbnail_shape',
    options: ['aspect_ratio', 'square'],
    selected: 'aspect_ratio',
    onChange: window.SDHubGalleryThumbnailShapeClick
  });

  const thumbnailPosition = createSelections({
    id: 'Thumbnail-Position',
    labelText: 'thumbnail_position',
    options: ['center', 'top'],
    selected: 'center'
  });

  const thumbnailLayout = createSelections({
    id: 'Thumbnail-Layout',
    labelText: 'thumbnail_layout',
    options: ['masonry', 'uniform'],
    selected: 'masonry'
  });

  const thumbnailSize = createInputNumber({
    id: 'Thumbnail-Size',
    labelText: 'thumbnail_size',
    min: 100,
    max: 512,
    defaultValue: 100
  });

  const showFilename = createCheckbox({
    id: 'Show-Filename',
    labelText: 'show_filename',
    defaultValue: false
  });

  const showButtons = createCheckbox({
    id: 'Show-Buttons',
    labelText: 'show_buttons',
    defaultValue: false
  });

  const imageInfoLayout = createSelections({
    id: 'Image-Info',
    labelText: 'image_info_layout',
    options: ['full_width', 'side_by_side'],
    selected: 'full_width'
  });

  const applyButton = createSettings('span', {
    id: `${SDHubID}-Apply-Button`,
    text: SDHubGetTranslation('apply')
  });

  SettingSetting.append(
    pageLimiter, thumbnailShape, thumbnailPosition, thumbnailLayout,
    thumbnailSize, showFilename, showButtons, imageInfoLayout, applyButton
  );

  SettingWrapper.append(SettingTitle, SettingSetting);
  SettingBox.append(SettingFrame, ExitButton, SettingWrapper);
  Setting.append(SettingBox);

  function killSetting() {
    document.body.classList.remove(SDHubBnS);
    SettingBox.style.transform = 'scale(1.5)';
    Setting.style.pointerEvents = 'none';
    Setting.style.opacity = SettingBox.style.opacity = SettingButton.style.transform = '';
    setTimeout(() => (Setting.style.display = SettingBox.style.transform = Setting.style.pointerEvents = ''), 300);
  }

  document.addEventListener('contextmenu', (e) => Setting && !Setting.contains(e.target) && killSetting());

  SettingButton.onclick = () => {
    document.body.classList.add(SDHubBnS);
    SettingButton.style.transform = 'rotate(-360deg)';
    SDHubGalleryApplySettings();

    Setting.style.display = 'flex';
    Setting.focus();

    setTimeout(() => (Setting.style.opacity = SettingBox.style.opacity = '1', SettingBox.style.transform = 'scale(1)'), 50);
  };

  Setting.onkeydown = (e) => { if (e.key === 'Escape') killSetting(); };

  const applySettings = () => {
    applyButton.onclick = null;

    const pageLimiter = parseInt(document.getElementById(`${SDHubID}-Page-Limiter-Input`).value, 10);
    const thumbnailShape = document.getElementById(`${SDHubID}-Thumbnail-Shape-Input`).dataset.selected;
    const thumbnailPosition = document.getElementById(`${SDHubID}-Thumbnail-Position-Input`).dataset.selected;
    const thumbnailLayout = document.getElementById(`${SDHubID}-Thumbnail-Layout-Input`).dataset.selected;
    const thumbnailSize = parseInt(document.getElementById(`${SDHubID}-Thumbnail-Size-Input`).value, 10);
    const showFilename = document.getElementById(`${SDHubID}-Show-Filename-Input`).checked;
    const showButtons = document.getElementById(`${SDHubID}-Show-Buttons-Input`).checked;
    const imageInfoLayout = document.getElementById(`${SDHubID}-Image-Info-Input`).dataset.selected;

    window.SDHubGallerySettings = {
      'images-per-page': pageLimiter,
      'thumbnail-shape': thumbnailShape,
      'thumbnail-position': thumbnailPosition,
      'thumbnail-layout': thumbnailLayout,
      'thumbnail-size': thumbnailSize,
      'show-filename': showFilename,
      'show-buttons': showButtons,
      'image-info-layout': imageInfoLayout
    };

    SDHubGalleryChangeSettings(
      thumbnailShape, thumbnailPosition, thumbnailLayout,
      thumbnailSize, showFilename, showButtons, imageInfoLayout
    );

    if (pageLimiter !== SDHubGalleryPageLimit) {
      SDHubGalleryPageLimit = pageLimiter;
      document.querySelectorAll('.sdhub-gallery-pages')?.forEach(p => p.remove());
      SDHubGalleryLoadInitial();
    }

    fetch(`${SDHubGalleryBase}/savesetting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(window.SDHubGallerySettings)
    }).then(res => {
      if (!res.ok) throw new Error('Failed to save setting');
    }).catch(console.error);

    const applied = `${SDHubClass}-applied`;
    [SettingFrame, SettingBox].forEach(el => el.classList.add(applied));

    setTimeout(() => [SettingFrame, SettingBox].forEach(el => el.classList.remove(applied)), 600);
    setTimeout(() => applyButton.onclick = applySettings, 1000);
  };

  applyButton.onclick = applySettings;
}

async function SDHubGalleryLoadSettings() {
  const v = await (await fetch(`${SDHubGalleryBase}/loadsetting`)).json();

  const settings = [
    'images-per-page', 'thumbnail-shape', 'thumbnail-position', 'thumbnail-layout',
    'thumbnail-size', 'show-filename', 'show-buttons', 'image-info-layout'
  ];

  window.SDHubGallerySettings = Object.fromEntries(settings.map(k => [k, v[k]]));

  SDHubGalleryPageLimit = parseInt(v['images-per-page'], 10);
  SDHubGalleryChangeSettings(
    v['thumbnail-shape'], v['thumbnail-position'], v['thumbnail-layout'], parseInt(v['thumbnail-size'], 10),
    v['show-filename'], v['show-buttons'], v['image-info-layout']
  );

  ['Page-Limiter', 'Thumbnail-Size'].forEach(id => {
    const input = document.getElementById(`${SDHubID}-${id}-Input`);
    if (input) input.dataset.lastNumber = v[input.id.includes('Page') ? 'images-per-page' : 'thumbnail-size'];
  });

  SDHubGalleryApplySettings();
  SDHubGalleryLoadInitial();
}

function SDHubGalleryApplySettings() {
  const v = window.SDHubGallerySettings;

  const pageLimiter = document.getElementById(`${SDHubID}-Page-Limiter-Input`);
  pageLimiter.value = pageLimiter.dataset.lastNumber = v['images-per-page'];
  const thumbnailSize = document.getElementById(`${SDHubID}-Thumbnail-Size-Input`);
  thumbnailSize.value = thumbnailSize.dataset.lastNumber = v['thumbnail-size'];

  const showFilename = document.getElementById(`${SDHubID}-Show-Filename-Input`);
  showFilename.checked = v['show-filename'];
  const showButtons = document.getElementById(`${SDHubID}-Show-Buttons-Input`);
  showButtons.checked = v['show-buttons'];

  const settingList = {
    [`${SDHubID}-Thumbnail-Shape`]: v['thumbnail-shape'],
    [`${SDHubID}-Thumbnail-Position`]: v['thumbnail-position'],
    [`${SDHubID}-Thumbnail-Layout`]: v['thumbnail-layout'],
    [`${SDHubID}-Image-Info`]: v['image-info-layout'],
  };

  for (const [id, v] of Object.entries(settingList)) {
    const input = document.getElementById(`${id}-Input`);
    const wrapper = document.getElementById(`${id}-Wrapper`);
    const clas = id.toLowerCase().split('-').slice(-2).join('-');

    if (input) input.value = input.dataset.selected = v;

    if (wrapper) {
      wrapper.querySelectorAll(`.${SDHubClass}-selection`).forEach(el => {
        const selected = el.dataset.selected === v;
        el.classList.toggle(`sdhub-gallery-selected-${clas}`, selected);
        el.classList.toggle(`${SDHubClass}-selected`, selected);
      });
    }
  }

  setTimeout(() => window.SDHubGalleryThumbnailShapeClick(), 0);
}

function SDHubGalleryChangeSettings(
  thumbnailShape, thumbnailPosition, thumbnailLayout,
  thumbnailSize, showFilename, showButtons, imageInfoLayout
) {
  const add = (id, css) => {
    document.getElementById(id)?.remove();
    const style = Object.assign(document.createElement('style'), { id, textContent: css });
    document.body.appendChild(style);
  };

  const remove = id => document.getElementById(id)?.remove();
  const square = 'SDHub-Gallery-Thumbnail-Shape-Square';
  const uniform = 'SDHub-Gallery-Thumbnail-Layout-Uniform';
  const thumbPos = `SDHub-Gallery-Thumbnail-Position-${thumbnailPosition}`;
  document.querySelectorAll(`style[id^="SDHub-Gallery-Thumbnail-Position-"]`).forEach(el => el.id !== thumbPos && el.remove());

  if (thumbnailShape === 'square') {
    add(square, `
      #SDHub-Gallery-Tab .sdhub-gallery-image {
        height: var(--sdhub-gallery-img-size) !important;
        width: var(--sdhub-gallery-img-size) !important;
        object-fit: cover !important;
      }
    `);
    add(thumbPos, `
      #SDHub-Gallery-Tab .sdhub-gallery-image {
        object-position: ${thumbnailPosition.toLowerCase()} !important;
      }
    `);
    remove(uniform);
  } else {
    remove(square);
    thumbnailLayout === 'uniform'
      ? add(uniform, `
          .sdhub-gallery-image-box {
            height: var(--sdhub-gallery-img-size) !important;
            width: var(--sdhub-gallery-img-size) !important;
            flex-basis: unset !important;
          }
        `)
      : remove(uniform);
    document.querySelectorAll(`style[id^="SDHub-Gallery-Thumbnail-Position-"]`).forEach(el => el.remove());
  }

  if (thumbnailSize) {
    add('SDHub-Gallery-Thumbnail-Size-Changed', `
      :root {
        --sdhub-gallery-img-size: ${parseInt(thumbnailSize, 10)}px !important;
      }
    `);
  }

  imageInfoLayout === 'side_by_side'
    ? add('SDHub-Gallery-Image-Info-SideBySide', `
        #SDHub-Gallery-Info-Column {
          flex-grow: 10 !important;
          align-items: flex-start !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          height: 100% !important;
          width: 100% !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        #SDHub-Gallery-Info-Column > .form{
          height: 100% !important;
          gap: 0 !important;
        }

        #SDHub-Gallery-Info-Image-Column {
          flex-direction: column !important;
          width: 100% !important;
          height: 100% !important;
          padding: 10px 0 10px 10px !important;
        }

        #SDHub-Gallery-Info-Image {
          flex: 1 1 0% !important;
          position: relative !important;
          height: 100% !important;
          min-height: min(160px, 100%) !important;
          width: 100% !important;
          background: transparent !important;
          border: 0 !important;
          border-radius: 1rem !important;
          box-shadow: 0 0 7px 1px #000 !important;
        }

        #SDHub-Gallery-Info-Image img {
          position: unset !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: cover !important;
          object-position: top !important;
          border-top-right-radius: 1.5rem !important;
        }

        #SDHub-Gallery-Info-Clear-Button {
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
        }

        #SDHub-Gallery-Info-img-frame {
          position: absolute !important;
          filter: unset !important;
          box-shadow: inset 0 0 5px 1px #000 !important;
          border-radius: 1rem !important;
        }

        #SDHub-Gallery-Info-SendButton {
          grid-template-columns: 1fr 1fr !important;
          left: unset !important;
          bottom: 0 !important;
          padding: 0 10px 15px 10px !important;
          border-radius: 1rem;
          width: 100% !important;
          align-self: center !important;
          gap: 2px !important;
        }

        #SDHub-Gallery-Info-SendButton button {
          border-radius: 0 !important;
          box-shadow: 0 0 5px 1px #000 !important;
        }

        #SDHub-Gallery-Info-SendButton > :nth-child(1) {
          border-top-left-radius: 1rem !important;
        }

        #SDHub-Gallery-Info-SendButton > :nth-child(2) {
          border-top-right-radius: 1rem !important;
        }

        #SDHub-Gallery-Info-SendButton > :nth-child(3) {
          border-bottom-left-radius: 1rem !important;
        }

        #SDHub-Gallery-Info-SendButton > :nth-child(4) {
          border-bottom-right-radius: 1rem !important;
        }

        #SDHub-Gallery-Info-Output-Panel {
          flex: 7 1 0% !important;
          position: relative !important;
          height: max-content !important;
          max-height: 100% !important;
          padding: 10px !important;
          pointer-events: auto !important;
          overflow-y: auto !important;
          will-change: transform;
          scrollbar-width: none;
        }

        #SDHub-Gallery-Info-img-area {
          display: none !important;
        }

        #SDHub-Gallery-Info-HTML {
          height: max-content !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
        }

        #SDHub-Gallery-Info-Output-Panel .sdhub-gallery-info-output-title {
          background: var(--input-background-fill);
          filter: unset !important;
        }

        #SDHub-Gallery-Info-Output-Panel .sdhub-gallery-info-output-wrapper {
          background: var(--input-background-fill) !important;
          filter: unset !important;
        }

        #SDHub-Gallery-Info-Output-Panel .sdhub-gallery-info-output-failed {
          position: relative !important;
          margin-top: 5px !important;
          bottom: unset !important;
        }

        @media (max-width: 600px) {
          #SDHub-Gallery-Info-Column {
            overflow-y: auto !important;
          }

          #SDHub-Gallery-Info-Image-Column {
            padding: 10px !important;
            height: 70% !important;
          }

          #SDHub-Gallery-Info-SendButton {
            padding: 15px !important;
          }

          #SDHub-Gallery-Info-Output-Panel {
            max-height: max-content !important;
            overflow: visible !important;
          }
        }
      `)
    : remove('SDHub-Gallery-Image-Info-SideBySide');

  showFilename
    ? add('SDHub-Gallery-Show-Filename-ON', `
        #SDHub-Gallery-Tab .sdhub-gallery-image-name {
          background: rgba(0, 0, 0, 0.6) !important;
          visibility: visible !important;
          box-shadow: unset !important;
          transform: unset !important;
        }
      `)
    : remove('SDHub-Gallery-Show-Filename-ON');

  showButtons
    ? add('SDHub-Gallery-Show-Buttons-ON', `
        .sdhub-gallery-image-button {
          transform: unset !important;
          visibility: visible !important;
        }
      `)
    : remove('SDHub-Gallery-Show-Buttons-ON');

  setTimeout(() => (window.SDHubGalleryArrowScrolling(), window.SDHubGalleryThumbnailShapeClick()), 0);
}