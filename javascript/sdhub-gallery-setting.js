function SDHubGalleryCreateSetting(SettingButton, Setting) {
  window.SDHubGalleryThumbnailShapeClick = () => {
    const shape = document.getElementById(`${SDHGS}-Thumbnail-Shape-Input`)?.dataset.selected,
    square = shape === 'square',
    pos = document.getElementById(`${SDHGS}-Thumbnail-Position`),
    lay = document.getElementById(`${SDHGS}-Thumbnail-Layout`);

    [pos, lay].forEach((el, i) => {
      const active = !!(i === 0) === square;
      el.classList.toggle(`${sdhgs}-active`, active);
      el.classList.toggle(`${sdhgs}-disable`, !active);
    });
  };

  const applied = `${sdhgs}-applied`,

  createSelection = ({ id, labelText, options, selected, onChange }) => {
    const i = `${SDHGS}-${id}`,
    inputClass = id.toLowerCase().split('-').slice(-2).join('-'),
    sc = `${sdhgs}-selected`,
    c = `sdhub-gallery-selected-${inputClass}`,

    selectionWrapper = SDHubEL('div', { class: `${sdhgs}-wrapper-selection` }),
    selection = options.slice(0, 2).map(v => {
      const el = SDHubEL('div', { class: `${sdhgs}-selection`, text: SDHubGetTranslation(v), dataset: { selected: v } });
      if (v === selected) el.classList.add(sc, c);
      selectionWrapper.appendChild(el);
      return el;
    }),

    input = SDHubEL('input', { id: `${i}-Input`, tabindex: -1, class: `${sdhgs}-input`, value: selected, dataset: { selected } });

    return SDHubEL('div', {
      id: i,
      class: `${sdhgs}-box`,
      title: SDHubGetTranslation(`${labelText}_title`),
      onclick: (e) => {
        const parent = e.currentTarget;
        if (parent.classList.contains(`${sdhgs}-disable`)) return;

        const [a, b] = selection, s = a.classList.contains(sc), nv = s ? b : a;
        [a, b].forEach(l => {
          l.classList.toggle(sc, l === nv);
          l.classList.toggle(c, l === nv);
        });

        input.value = input.dataset.selected = nv.dataset.selected;
        onChange?.(nv.dataset.selected);
      },
      children: [
        SDHubEL('label', { id: `${i}-Label`, class: `${sdhgs}-label`, text: SDHubGetTranslation(labelText) }),
        SDHubEL('div', { id: `${i}-Wrapper`, class: `${sdhgs}-wrapper`, children: [selectionWrapper] }),
        input
      ]
    });
  },

  createInputNumber = ({ id, labelText, min, max, defaultValue }) => {
    const i = `${SDHGS}-${id}`, name = id.toLowerCase(),
    last = String(window.SDHubGallerySettings?.[name] ?? defaultValue ?? String(min)),

    input = SDHubEL('input', {
      id: `${i}-Input`,
      type: 'text',
      spellcheck: false,
      tabindex: -1,
      class: `${sdhgs}-input-number`,
      maxLength: String(max).length,
      dataset: { lastNumber: last },
      oninput: e => { const el = e.target; el.value = el.value.replace(/[^0-9]/g, ''); },
      onblur: e => {
        const el = e.target, v = el.value, n = parseInt(v, 10), def = el.dataset.lastNumber ?? String(min);
        el.value =
          v === '' ? def
          : isNaN(n) || n < min ? (el.dataset.lastNumber = el.value = String(min))
          : n > max ? (el.dataset.lastNumber = el.value = String(max))
          : (el.dataset.lastNumber = v);
      }
    }),

    wrapperSelection = SDHubEL('div', { class: `${sdhgs}-wrapper-selection`, children: [input] }),
    wrapper = SDHubEL('div', { id: `${i}-Wrapper`, class: `${sdhgs}-wrapper`, children: [wrapperSelection] }),
    label = SDHubEL('label', { id: `${i}-Label`, class: `${sdhgs}-label`, text: SDHubGetTranslation(labelText) });

    return SDHubEL('div', {
      id: i,
      class: `${sdhgs}-box`,
      title: SDHubGetTranslation(`${labelText}_title`),
      onclick: () => input.focus(),
      children: [label, wrapper]
    });
  },

  createCheckbox = ({ id, labelText, def = false }) => {
    const i = `${SDHGS}-${id}`,
    name = id.toLowerCase(),

    input = SDHubEL('input', {
      id: `${i}-Input`,
      type: 'checkbox',
      tabindex: -1,
      class: `${sdhgs}-checkbox-input`,
      checked: window.SDHubGallerySettings?.[name] ?? def
    }),

    wrapperCheckbox = SDHubEL('div', { class: `${sdhgs}-wrapper-checkbox`, children: [input] }),
    wrapper = SDHubEL('div', { id: `${i}-Wrapper`, class: `${sdhgs}-wrapper`, children: [wrapperCheckbox] }),
    label = SDHubEL('label', { id: `${i}-Label`, class: `${sdhgs}-label`, text: SDHubGetTranslation(labelText) });

    return SDHubEL('div', {
      id: i,
      class: `${sdhgs}-box`,
      title: SDHubGetTranslation(`${labelText}_title`),
      onclick: () => input.click(),
      children: [label, wrapper]
    });
  },

  SettingFrame = SDHubEL('div', { id: `${SDHGS}-Frame` }),
  SettingTitle = SDHubEL('span', { id: `${SDHGS}-Title`, html: SDHubGetTranslation('setting_title') }),
  SettingPage1 = SDHubEL('div', { id: `${SDHGS}-Page-1`, class: `${sdhgs}-page` }),
  SettingPage2 = SDHubEL('div', { id: `${SDHGS}-Page-2`, class: `${sdhgs}-page` }),
  SettingPageWrap = SDHubEL('div', { id: `${SDHGS}-Page-Wrapper`, children: [SettingPage1, SettingPage2] }),
  applyButton = SDHubEL('span', { id: `${SDHGS}-Apply-Button`, text: SDHubGetTranslation('apply') }),
  exitButton = SDHubEL('div', { id: `${SDHGS}-Exit-Button`, html: SDHubGallerySVG_Cross, onclick: killSetting }),
  SettingWrapper = SDHubEL('div', { id: `${SDHGS}-Wrapper`, children: [SettingTitle, SettingPageWrap, applyButton, exitButton] }),

  leftNav = SDHubEL('span', { id: `${SDHGS}-Nav-Left-Button`, class: `${sdhgs}-nav-button`, html: SDHubGallerySVG_ArrowButton }),
  rightNav = SDHubEL('span', { id: `${SDHGS}-Nav-Right-Button`, class: `${sdhgs}-nav-button`, html: SDHubGallerySVG_ArrowButton }),
  SettingNav = SDHubEL('div', { id: `${SDHGS}-Nav`, children: [leftNav, rightNav] }),

  SettingBox = SDHubEL('div', { id: `${SDHGS}-Box`, children: [SettingFrame, SettingWrapper, SettingNav], oncontextmenu: (e) => e.preventDefault() }),

  pageLimiter = createInputNumber({ id: 'Page-Limiter', labelText: 'images_per_page', min: 10, max: 1000, defaultValue: 10 }),
  thumbnailShape = createSelection({ id: 'Thumbnail-Shape', labelText: 'thumbnail_shape', options: ['aspect_ratio', 'square'], selected: 'aspect_ratio', onChange: window.SDHubGalleryThumbnailShapeClick }),
  thumbnailPosition = createSelection({ id: 'Thumbnail-Position', labelText: 'thumbnail_position', options: ['center', 'top'], selected: 'center' }),
  thumbnailLayout = createSelection({ id: 'Thumbnail-Layout', labelText: 'thumbnail_layout', options: ['masonry', 'uniform'], selected: 'masonry' }),
  thumbnailSize = createInputNumber({ id: 'Thumbnail-Size', labelText: 'thumbnail_size', min: 100, max: 512, defaultValue: 100 }),
  showFilename = createCheckbox({ id: 'Show-Filename', labelText: 'show_filename', defaultValue: false }),
  showButtons = createCheckbox({ id: 'Show-Buttons', labelText: 'show_buttons', defaultValue: false }),
  imageInfoLayout = createSelection({ id: 'Image-Info', labelText: 'image_info_layout', options: ['full_width', 'side_by_side'], selected: 'full_width' }),

  deleteSingle = createCheckbox({ id: 'Delete-Single', labelText: 'single_delete_permanent', defaultValue: false }),
  warningSingle = createCheckbox({ id: 'Warning-Delete-Single', labelText: 'single_delete_suppress_warning', defaultValue: false }),
  deleteBatch = createCheckbox({ id: 'Delete-Batch', labelText: 'batch_delete_permanent', defaultValue: false }),
  warningBatch = createCheckbox({ id: 'Warning-Delete-Batch', labelText: 'batch_delete_suppress_warning', defaultValue: false }),
  warningSwitchTab = createCheckbox({ id: 'Warning-Switching-Tab', labelText: 'switch_tab_suppress_warning', defaultValue: false });

  SettingPage1.append(pageLimiter, thumbnailShape, thumbnailPosition, thumbnailLayout, thumbnailSize, showFilename, showButtons);
  SettingPage2.append(imageInfoLayout, deleteSingle, warningSingle, deleteBatch, warningBatch, warningSwitchTab);
  Setting.append(SettingBox);

  const applySettings = () => {
    applyButton.onclick = null;
    window.SDHubGalleryAllCheckbox(false, false);
    const GalleryWrap = document.getElementById('SDHub-Gallery-Wrapper'),
    q = id => document.getElementById(`${SDHGS}-${id}-Input`),

    pageLimiter = parseInt(q('Page-Limiter').value, 10),
    thumbnailShape = q('Thumbnail-Shape').dataset.selected,
    thumbnailPosition = q('Thumbnail-Position').dataset.selected,
    thumbnailLayout = q('Thumbnail-Layout').dataset.selected,
    thumbnailSize = parseInt(q('Thumbnail-Size').value, 10),
    showFilename = q('Show-Filename').checked,
    showButtons = q('Show-Buttons').checked,

    imageInfoLayout = q('Image-Info').dataset.selected,
    deleteSingle = q('Delete-Single').checked,
    warningSingle = q('Warning-Delete-Single').checked,
    deleteBatch = q('Delete-Batch').checked,
    warningBatch = q('Warning-Delete-Batch').checked,
    warningSwitchTab = q('Warning-Switching-Tab').checked;

    window.SDHubGallerySettings = {
      'images-per-page': pageLimiter,
      'thumbnail-shape': thumbnailShape,
      'thumbnail-position': thumbnailPosition,
      'thumbnail-layout': thumbnailLayout,
      'thumbnail-size': thumbnailSize,
      'show-filename': showFilename,
      'show-buttons': showButtons,

      'image-info-layout': imageInfoLayout,
      'single-delete-permanent': deleteSingle,
      'single-delete-suppress-warning': warningSingle,
      'batch-delete-permanent': deleteBatch,
      'batch-delete-suppress-warning': warningBatch,
      'switch-tab-suppress-warning': warningSwitchTab
    };

    SDHubGalleryChangeSettings(
      thumbnailShape, thumbnailPosition, thumbnailLayout,
      thumbnailSize, showFilename, showButtons, imageInfoLayout
    );

    if (pageLimiter !== SDHubGalleryPageLimit) {
      SDHubGalleryPageLimit = pageLimiter;
      const navBox = document.getElementById('SDHub-Gallery-Page-Nav-Box');
      navBox.style.display = '';

      const TabRow = document.getElementById('SDHub-Gallery-Tab-Button-Row');
      TabRow.classList.remove(sdhubS);
      TabRow.querySelectorAll('.sdhub-gallery-tab-button').forEach(btn => {
        btn.style.display = '';
        btn.classList.remove('selected');
      });

      GalleryWrap.querySelectorAll('.sdhub-gallery-tab-container').forEach(con => {
        con.style.display = '';
        con.classList.remove('active');
        con.querySelectorAll(`.${sdhgp}s`)?.forEach(p => p.remove());
      });

      setTimeout(() => SDHubGalleryLoadInitial(), 100);
    }

    fetch(`${SDHubGalleryBase}-save-setting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(window.SDHubGallerySettings)
    }).then(res => {
      if (!res.ok) throw new Error('Failed to save setting');
    }).catch(console.error);

    SettingFrame.classList.add(applied);
    setTimeout(() => SettingFrame.classList.remove(applied), 600);
    setTimeout(() => applyButton.onclick = applySettings, 700);
  };

  let navON = `${sdhgs}-nav-on`, navLocked = false;

  const nav = (r) => {
    if (navLocked) return;
    navLocked = true;
    rightNav.classList.toggle(navON, !r);
    leftNav.classList.toggle(navON, r);
    SettingPageWrap.style.transform = r ? 'translateX(calc(-100% - 20px))' : '';
    setTimeout(() => navLocked = false, 800);
  };

  leftNav.onclick = () => nav(false);
  rightNav.onclick = () => nav(true);

  SettingButton.onclick = () => {
    document.body.classList.add(SDHubBnS);
    SettingButton.style.transform = 'rotate(-360deg)';

    Setting.style.display = 'flex';
    Setting.focus();

    SDHubGalleryApplySettings();
    SDHubGalleryContextMenuClose();

    requestAnimationFrame(() => requestAnimationFrame(() => {
      [Setting, SettingBox].forEach(l => l.classList.add(sdhubS));
      rightNav.classList.add(navON);
    }));

    setTimeout(() => {
      Setting.onkeydown = (e) => {
        if (e.key === 'Escape') return killSetting();
        if (e.key === 'Enter') return applyButton.click();
        if (e.key === 'ArrowLeft') return leftNav.click();
        if (e.key === 'ArrowRight') return rightNav.click();
      };
    }, 300);
  };

  Setting.addEventListener('contextmenu', (e) => e.preventDefault());
  applyButton.onclick = applySettings;

  function killSetting() {
    document.body.classList.remove(SDHubBnS);
    Setting.onkeydown = null;
    [rightNav, leftNav].forEach(l => l.classList.remove(navON));
    [Setting, SettingBox].forEach(l => l.classList.remove(sdhubS));
    SettingButton.style.transform = '';
    setTimeout(() => (Setting.style.display = SettingPageWrap.style.transform =  ''), 200);
  }
}

async function SDHubGalleryLoadSettings() {
  const v = await (await fetch(`${SDHubGalleryBase}-load-setting`)).json(),

  keys = [
    'images-per-page', 'thumbnail-shape', 'thumbnail-position', 'thumbnail-layout',
    'thumbnail-size', 'show-filename', 'show-buttons', 'image-info-layout',
    'single-delete-permanent', 'single-delete-suppress-warning',
    'batch-delete-permanent', 'batch-delete-suppress-warning',
    'switch-tab-suppress-warning'
  ],

  bool = new Set([
    'single-delete-permanent', 'single-delete-suppress-warning',
    'batch-delete-permanent', 'batch-delete-suppress-warning',
    'switch-tab-suppress-warning'
  ]),

  settings = Object.fromEntries(keys.map(k => {
    const f = bool.has(k) ? false : v[k];
    return [k, v[k] !== undefined ? v[k] : f];
  }));

  window.SDHubGallerySettings = settings;

  SDHubGalleryPageLimit = parseInt(settings['images-per-page'], 10);

  SDHubGalleryChangeSettings(
    settings['thumbnail-shape'], settings['thumbnail-position'], settings['thumbnail-layout'],
    parseInt(settings['thumbnail-size'], 10),
    settings['show-filename'], settings['show-buttons'], settings['image-info-layout']
  );

  ['Page-Limiter', 'Thumbnail-Size'].forEach(id => {
    const input = document.getElementById(`${SDHGS}-${id}-Input`);
    if (input) input.dataset.lastNumber = settings[input.id.includes('Page') ? 'images-per-page' : 'thumbnail-size'];
  });

  SDHubGalleryApplySettings();
  SDHubGalleryLoadInitial();
}

function SDHubGalleryApplySettings() {
  const v = window.SDHubGallerySettings,

  q = id => document.getElementById(`${SDHGS}-${id}-Input`),
  pageLimiter = q('Page-Limiter'),
  thumbnailSize = q('Thumbnail-Size'),
  showFilename = q('Show-Filename'),
  showButtons = q('Show-Buttons'),

  deleteSingle = q('Delete-Single'),
  warningSingle = q('Warning-Delete-Single'),
  deleteBatch = q('Delete-Batch'),
  warningBatch = q('Warning-Delete-Batch'),
  warningSwitchTab = q('Warning-Switching-Tab');

  pageLimiter.value = pageLimiter.dataset.lastNumber = v['images-per-page'];
  thumbnailSize.value = thumbnailSize.dataset.lastNumber = v['thumbnail-size'];
  showFilename.checked = v['show-filename'];
  showButtons.checked = v['show-buttons'];

  deleteSingle.checked = v['single-delete-permanent'] ?? false;
  warningSingle.checked = v['single-delete-suppress-warning'] ?? false;
  deleteBatch.checked = v['batch-delete-permanent'] ?? false;
  warningBatch.checked = v['batch-delete-suppress-warning'] ?? false;
  warningSwitchTab.checked = v['switch-tab-suppress-warning'] ?? false;

  const settingList = {
    [`${SDHGS}-Thumbnail-Shape`]: v['thumbnail-shape'],
    [`${SDHGS}-Thumbnail-Position`]: v['thumbnail-position'],
    [`${SDHGS}-Thumbnail-Layout`]: v['thumbnail-layout'],
    [`${SDHGS}-Image-Info`]: v['image-info-layout'],
  };

  for (const [id, v] of Object.entries(settingList)) {
    const input = document.getElementById(`${id}-Input`),
    wrapper = document.getElementById(`${id}-Wrapper`),
    clas = id.toLowerCase().split('-').slice(-2).join('-');

    if (input) input.value = input.dataset.selected = v;

    if (wrapper) {
      wrapper.querySelectorAll(`.${sdhgs}-selection`).forEach(el => {
        const selected = el.dataset.selected === v;
        el.classList.toggle(`sdhub-gallery-selected-${clas}`, selected);
        el.classList.toggle(`${sdhgs}-selected`, selected);
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
  },

  remove = id => document.getElementById(id)?.remove(),

  square = 'SDHub-Gallery-Thumbnail-Shape-Square',
  uniform = 'SDHub-Gallery-Thumbnail-Layout-Uniform',
  thumbPos = `SDHub-Gallery-Thumbnail-Position-${thumbnailPosition}`;
  document.querySelectorAll(`style[id^="SDHub-Gallery-Thumbnail-Position-"]`).forEach(el => el.id !== thumbPos && el.remove());

  if (thumbnailShape === 'square') {
    add(square, `
      #SDHub-Gallery-Tab .sdhub-gallery-img {
        height: var(--sdhub-gallery-img-size) !important;
        width: var(--sdhub-gallery-img-size) !important;
        object-fit: cover !important;
      }
    `);
    add(thumbPos, `
      #SDHub-Gallery-Tab .sdhub-gallery-img {
        object-position: ${thumbnailPosition.toLowerCase()} !important;
      }
    `);
    remove(uniform);
  } else {
    remove(square);
    thumbnailLayout === 'uniform'
      ? add(uniform, `
          .sdhub-gallery-img-box {
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
        #${SDHGiI}-Row {
          flex-grow: 10 !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          align-items: flex-start !important;
          height: 100% !important;
          width: 100% !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        #${SDHGiI}-Row > .form{
          gap: 0 !important;
          height: 100% !important;
        }

        #${SDHGiI}-Image-Column {
          flex-direction: column !important;
          height: 100% !important;
          width: 100% !important;
          padding: 10px 0 10px 10px !important;
        }

        #${SDHGiI}-img {
          flex: 1 1 0% !important;
          position: relative !important;
          height: 100% !important;
          min-height: min(160px, 100%) !important;
          width: 100% !important;
          border-radius: 1rem !important;
          box-shadow: 0 0 4px 0 #000, 0 0 1px 1px var(--background-fill-primary) !important;
        }

        #${SDHGiI}-img .boundedheight {
          position: relative !important;
          inset: unset !important;
          filter: unset !important;
        }

        #${SDHGiI}-img img {
          object-fit: cover !important;
          object-position: top !important;
          position: unset !important;
          max-height: 100% !important;
          max-width: 100% !important;
          border-top-right-radius: 1.5rem !important;
        }

        #${SDHGiI}-Exit-Button {
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          height: 54px !important;
          min-width: 54px !important;
          max-width: 54px !important;
          padding: 7px !important;
          box-shadow: 0 0 5px 1px #000 !important;
        }

        #${SDHGiI}-Exit-Button > svg {
          top: unset !important;
          right: unset !important;
        }

        #${SDHGiI}-img-frame {
          position: absolute !important;
          border-radius: 1rem !important;
          box-shadow: inset 0 0 1px 0 var(--background-fill-primary), inset 0 0 3px 1px var(--background-fill-primary) !important;
          filter: unset !important;
        }

        #${SDHGiI}-SendButton {
          grid-template-columns: 1fr 1fr !important;
          gap: 4px !important;
          align-self: center !important;
          left: unset !important;
          bottom: 0 !important;
          width: 100% !important;
          padding: 0 10px 15px 10px !important;
          border-radius: 1rem;
        }

        #${SDHGiI}-SendButton button { border-radius: 0 !important; }
        #${SDHGiI}-SendButton > :nth-child(1) { border-top-left-radius: 1rem !important; }
        #${SDHGiI}-SendButton > :nth-child(2) { border-top-right-radius: 1rem !important; }
        #${SDHGiI}-SendButton > :nth-child(3) { border-bottom-left-radius: 1rem !important; }
        #${SDHGiI}-SendButton > :nth-child(4) { border-bottom-right-radius: 1rem !important; }

        #${SDHGiI}-Output-Panel {
          flex: 7 1 0% !important;
          position: relative !important;
          height: max-content !important;
          max-height: 100% !important;
          padding: 10px !important;
          pointer-events: auto !important;
          overflow-y: auto !important;
          scrollbar-width: none !important;
          will-change: transform;
        }

        #${SDHGiI}-img-area {
          display: none !important;
        }

        #${SDHGiI}-HTML {
          height: max-content !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
        }

        #${SDHGiI}-Output-Panel .${sdhgii}-output-title {
          background: var(--input-background-fill);
          filter: unset !important;
        }

        #${SDHGiI}-Output-Panel .${sdhgii}-output-wrapper {
          background: var(--input-background-fill) !important;
          filter: unset !important;
        }

        #${SDHGiI}-Output-Panel .${sdhgii}-output-failed {
          position: relative !important;
          margin-top: 5px !important;
          bottom: unset !important;
        }

        @media (max-width: 600px) {
          #${SDHGiI}-Row {
            overflow-y: auto !important;
          }

          #${SDHGiI}-Image-Column {
            padding: 10px !important;
            height: 70% !important;
          }

          #${SDHGiI}-SendButton {
            padding: 15px !important;
          }

          #${SDHGiI}-Output-Panel {
            max-height: max-content !important;
            overflow: visible !important;
          }
        }
      `)
    : remove('SDHub-Gallery-Image-Info-SideBySide');

  showFilename
    ? add('SDHub-Gallery-Show-Filename-ON', `
        #SDHub-Gallery-Tab .sdhub-gallery-img-name {
          color: var(--body-text-color);
          box-shadow: var(--sdhub-gallery-img-name-box-shadow);
          background: var(--sdhub-gallery-img-name-background);
          opacity: 1 !important;
          transform: unset !important;
        }
      `)
    : remove('SDHub-Gallery-Show-Filename-ON');

  showButtons
    ? add('SDHub-Gallery-Show-Buttons-ON', `
        .sdhub-gallery-img-btn {
          color: var(--primary-400);
          background: var(--input-background-fill-hover);
          opacity: 1 !important;
          transform: unset !important;
        }
      `)
    : remove('SDHub-Gallery-Show-Buttons-ON');

  setTimeout(() => (window.SDHubGalleryPageArrowUpdate(), window.SDHubGalleryThumbnailShapeClick()), 0);
}

function SDHubGalleryRePages() {
  const t = document.querySelector('.sdhub-gallery-tab-container.active'); if (!t) return;
  const parent = t?.parentElement;
  const w = t.querySelector(`.${sdhgp}-wrapper`); if (!w) return;
  const p = [...w.querySelectorAll(`.${sdhgp}s`)].sort((a, b) => a.dataset.page - b.dataset.page);

  for (let i = 0; i < p.length - 1; i++) {
    let c = p[i], next = p[i + 1];
    while (c.children.length < SDHubGalleryPageLimit && next.children.length) c.prepend(next.lastElementChild);
  }

  for (let i = p.length - 1; i >= 0; i--) { if (!p[i].children.length) p[i].remove(); }

  const selected = w.querySelector(`.${sdhgp}s.selected-page`);
  if (!selected) {
    const lastPage = w.querySelector(`.${sdhgp}s:last-child`);
    if (lastPage) (lastPage.classList.add('selected-page'), requestAnimationFrame(() => lastPage.style.opacity = '1'));
  }

  const hide = () => {
    document.getElementById('SDHub-Gallery-Page-Nav-Box').style.display = '';
    document.getElementById('SDHub-Gallery-Tab-Button-Row').classList.remove(sdhubS);
  }

  const page = w.querySelectorAll(`.${sdhgp}s`).length;

  if (!page) {
    const Id = t.id, v = Id.match(/^SDHub-Gallery-(.+)-Tab-Container$/); if (!v) return;

    const name = v[1],
    TabCon = document.getElementById(Id),
    TabButton = document.getElementById(`SDHub-Gallery-${name}-Tab-Button`);

    TabButton && (TabButton.classList.remove('selected'), TabButton.style.display = '');
    TabCon && (TabCon.classList.remove('active'), TabCon.style.display = '');

    const allpages = parent.querySelectorAll(`.${sdhgp}s`); if (!allpages.length) return hide();
    const nextTabCon = allpages[0].closest('.sdhub-gallery-tab-container'); if (!nextTabCon) return;
    const nextId = nextTabCon.id.match(/^SDHub-Gallery-(.+)-Tab-Container$/); if (!nextId) return;
    const nextname = nextId[1], nextTabButton = document.getElementById(`SDHub-Gallery-${nextname}-Tab-Button`);

    nextTabButton && (nextTabButton.classList.add('selected'), nextTabButton.style.display = 'flex');
    nextTabCon && (nextTabCon.classList.add('active'), nextTabCon.style.display = 'flex');

  } else {
    const pages = [...w.querySelectorAll(`.${sdhgp}s`)],
    pageIndex = pages.findIndex(p => p.classList.contains('selected-page')),
    indi = t.querySelector(`.${sdhgp}-indicator`);
    if (indi && pageIndex >= 0) indi.textContent = `${pageIndex + 1} / ${pages.length}`;
  }
}