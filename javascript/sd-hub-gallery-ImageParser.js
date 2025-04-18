async function SDHubGalleryParser() {
  const RawOutput = document.querySelector('#SDHub-Gallery-Info-GenInfo textarea');
  const HTMLPanel = document.getElementById('SDHub-Gallery-Info-HTML');
  const ImagePanel = document.getElementById('SDHub-Gallery-Info-Image');
  const img = ImagePanel.querySelector('img');

  if (!img) {
    HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML('');
    return;
  }

  SDHubGalleryInfoClearButton();
  img.onclick = () => SDHubGalleryImageViewer('s');

  const output = await SDImageParser(img);
  RawOutput.value = output;
  updateInput(RawOutput);
  window.SDHubGalleryInfoRawOutput = output;
  HTMLPanel.classList.add('prose');
  HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML(output);

  document.querySelectorAll('.sdhub-gallery-info-output-section').forEach(s => {
    const t = s.querySelector('.sdhub-gallery-info-output-title');
    const w = s.querySelector('.sdhub-gallery-info-output-wrapper');
    if (!t || !w) return;
    w.onmouseenter = () => [t, w].forEach(x => x.style.background = 'var(--input-background-fill)');
    w.onmouseleave = () => [t, w].forEach(x => x.style.background = '');
  });
}

async function SDHubGalleryPlainTextToHTML(inputs) {
  const EncryptInfo = window.SDImageParserEncryptInfo;
  const Sha256Info = window.SDImageParserSha256Info;
  const NaiSourceInfo = window.SDImageParserNaiSourceInfo;
  const SoftwareInfo = window.SDImageParserSoftwareInfo;

  const SendButton = document.getElementById('SDHub-Gallery-Info-SendButton');
  const OutputPanel = document.getElementById('SDHub-Gallery-Info-Output-Panel');

  const titleEL = [
    { id: 'Prompt', label: 'prompt', title: 'copy_prompt' },
    { id: 'NegativePrompt', label: 'negative_prompt', title: 'copy_negative_prompt' },
    { id: 'Params', label: 'parameters', title: 'copy_parameters' },
    { id: 'Encrypt', label: 'Encrypt' },
    { id: 'Sha256', label: 'EncryptPwdSha' },
    { id: 'Software', label: 'Software' },
    { id: 'Source', label: 'Source' }
  ];

  const titles = {};

  titleEL.forEach(({ id, label, title }) => {
    const b = !!title;
    const l = b ? SDHubGetTranslation(label) : label;
    const t = b ? SDHubGetTranslation(title) : '';

    const attr = [
      b ? `id='SDHub-Gallery-Info-${id}-Button'` : '',
      `class='sdhub-gallery-info-output-title${b ? ' sdhub-gallery-info-copybutton' : ''}'`,
      b ? `title='${t}'` : '',
      b ? `onclick='SDHubGalleryCopyButtonEvent(event)'` : ''
    ].filter(Boolean).join(' ');

    titles[`title${id}`] = `<div ${attr}>${l}</div>`;
  });

  let titlePrompt = titles.titlePrompt;
  let titleNegativePrompt = titles.titleNegativePrompt;
  let titleParams = titles.titleParams;
  let titleEncrypt = titles.titleEncrypt;
  let titleSha = titles.titleSha256;
  let titleSoftware = titles.titleSoftware;
  let titleSource = titles.titleSource;

  let titleModels = '';
  let br = /\n/g;

  let outputHTML = '';
  let promptText = '';
  let negativePromptText = '';
  let paramsText = '';
  let modelOutput = '';

  function SDHubGalleryHTMLOutput(title, content) {
    const none = title === 'nothing', con = title === titleModels || none;
    const tent = con ? content : `<div class='sdhub-gallery-info-output-wrapper'><div class='sdhub-gallery-info-output-content'>${content}</div></div>`;
    return `<div class='sdhub-gallery-info-output-section'${none ? " style='height: 100%'" : ''}>${none ? '' : title}${tent}</div>`;
  }

  if (inputs === undefined || inputs === null || inputs.trim() === '') {
    OutputPanel.classList.remove('sdhub-display-output-panel');
    SendButton.style.display = '';

  } else {
    OutputPanel.classList.add('sdhub-display-output-panel');

    if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
      titlePrompt = '';
      SendButton.style.display = '';
      const none = `<div class='sdhub-gallery-info-output-failed' style='position: absolute; bottom: 0;'>${inputs}</div>`;
      outputHTML = SDHubGalleryHTMLOutput('nothing', none);

    } else if (inputs.trim().startsWith('OPPAI:')) {
      const sections = [{ title: titleEncrypt, content: EncryptInfo }, { title: titleSha, content: Sha256Info }];
      sections.forEach(section => {
        if (section.content && section.content.trim() !== '') outputHTML += SDHubGalleryHTMLOutput(section.title, section.content);
      });
      outputHTML += SDHubGalleryHTMLOutput('', inputs);

    } else {
      SendButton.style.display = 'grid';
      inputs = inputs.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(br, '<br>');
      inputs = inputs.replace(/Seed:\s?(\d+),/gi, function(match, seedNumber) {
        return `<span id='SDHub-Gallery-Info-Seed-Button' title='${SDHubGetTranslation("copy_seed")}' onclick='SDHubGalleryCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`;
      });

      const negativePromptIndex = inputs.indexOf('Negative prompt:');
      const stepsIndex = inputs.indexOf('Steps:');
      const hashesIndex = inputs.indexOf('Hashes:');

      if (negativePromptIndex !== -1) promptText = inputs.substring(0, negativePromptIndex).trim();
      else if (stepsIndex !== -1) promptText = inputs.substring(0, stepsIndex).trim();
      else promptText = inputs.trim();

      if (negativePromptIndex !== -1 && stepsIndex !== -1 && stepsIndex > negativePromptIndex) {
        negativePromptText = inputs.slice(negativePromptIndex + 'Negative prompt:'.length, stepsIndex).trim();
      }

      if (stepsIndex !== -1) {
        const hashesEX = inputs.slice(hashesIndex).match(/Hashes:\s*(\{.*?\})(,\s*)?/);
        paramsRAW = inputs.slice(stepsIndex).trim();
        paramsText = inputs.slice(stepsIndex).trim().replace(/,\s*(Lora hashes|TI hashes):\s*"[^"]+"/g, '').trim();

        let Id = 'SDHub-Gallery-Info-Model-Output';
        let display = 'sdhub-gallery-info-display-model-output';

        modelOutput = `
          <div id='${Id}' class='sdhub-gallery-info-modelBox'>
            ${SDHubGallerySpinnerSVG.replace(/<svg\s+class=['"][^'"]*['"]/, '<svg id="SDHub-Gallery-Info-Spinner"')}
          </div>
        `;

        const modelBox = document.getElementById(Id);
        if (modelBox) {
          modelBox.closest('.sdhub-gallery-info-output-section').classList.add('sdhub-gallery-info-modelBox');
          modelBox.innerHTML = modelOutput;
        }

        setTimeout(async () => {
          const fetchTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000));
          const modelBox = document.getElementById(Id);
          try {
            const fetchHash = await Promise.race([SDImageParserFetchModelOutput(paramsRAW), fetchTimeout]);
            modelBox.classList.add(display);
            modelBox.innerHTML = fetchHash;
            setTimeout(() => modelBox.classList.remove(display), 2000);
          } catch (error) {
            error.message === 'Timeout' && (modelBox.innerHTML = '<div class="sdhub-gallery-info-output-failed">Failed to fetch...</div>');
          }
        }, 500);

        if (hashesEX && hashesEX[1]) paramsText = paramsText.replace(hashesEX[0], '').trim();
        if (paramsText.endsWith(',')) paramsText = paramsText.slice(0, -1).trim();

      } else {
        paramsText = inputs.trim();
      }

      const sections = [
        { title: titlePrompt, content: promptText },
        { title: titleNegativePrompt, content: negativePromptText },
        { title: titleParams, content: paramsText },
        { title: titleSoftware, content: SoftwareInfo },
        { title: titleModels, content: modelOutput },
        { title: titleEncrypt, content: EncryptInfo },
        { title: titleSha, content: Sha256Info },
        { title: titleSource, content: NaiSourceInfo }
      ];

      sections.forEach(section => {
        if (section.content?.trim() !== '') outputHTML += SDHubGalleryHTMLOutput(section.title, section.content);
      });
    }
  }

  return `${outputHTML}`;
}

function SDHubGallerySendButton(Id) {
  let OutputRaw = window.SDHubGalleryInfoRawOutput;
  let ADmodel = OutputRaw?.includes('ADetailer model');
  let cb = document.getElementById(`script_${Id}_adetailer_ad_main_accordion-visible-checkbox`);
  if (ADmodel) cb?.checked === false && cb.click();
}

function SDHubGalleryCopyButtonEvent(e) {
  let OutputRaw = window.SDHubGalleryInfoRawOutput;

  const CopyText = (text, target) => {
    const content = target.closest('.sdhub-gallery-info-output-section')?.querySelector('.sdhub-gallery-info-output-content');
    content?.classList.add('sdhub-gallery-info-borderpulse');
    setTimeout(() => content?.classList.remove('sdhub-gallery-info-borderpulse'), 2000);
    navigator.clipboard.writeText(text);
  };

  if (e.target?.id) {
    const { id } = e.target;
    const stepsStart = OutputRaw.indexOf('Steps:');
    const negStart = OutputRaw.indexOf('Negative prompt:');
    const seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i);

    const text = {
      'SDHub-Gallery-Info-Prompt-Button': () => OutputRaw.substring(0, [negStart, stepsStart].find(i => i !== -1) || OutputRaw.length).trim(),
      'SDHub-Gallery-Info-NegativePrompt-Button': () => negStart !== -1 && stepsStart > negStart ? OutputRaw.slice(negStart + 16, stepsStart).trim() : null,
      'SDHub-Gallery-Info-Params-Button': () => stepsStart !== -1 ? OutputRaw.slice(stepsStart).trim() : null,
      'SDHub-Gallery-Info-Seed-Button': () => seedMatch?.[1]?.trim() || null
    }[id]?.();

    if (text) CopyText(text, e.target);
  }
}

function SDHubGalleryInfoClearButton() {
  let infoColumn = document.getElementById('SDHub-Gallery-Info-Column');
  let Cloned = document.getElementById('SDHub-Gallery-Info-Clear-Button');
  let ClearButton = document.querySelector('#SDHub-Gallery-Info-Image > div > div > div > button:nth-child(2)') || 
                    document.querySelector('.gradio-container-4-40-0 #SDHub-Gallery-Info-Image > div > div > button');

  if (ClearButton && !Cloned) {
    let parent = ClearButton.parentElement;
    Object.assign(parent.style, { position: 'absolute', zIndex: 1, top: 0, right: 0, gap: 0 });
    ClearButton.style.display = 'none';

    let btn = ClearButton.cloneNode(true);
    btn.id = 'SDHub-Gallery-Info-Clear-Button';
    parent.prepend(btn);

    const clearImage = () => {
      infoColumn.style.opacity = '';
      document.body.classList.remove('no-scroll');
      setTimeout(() => (ClearButton.click(), (infoColumn.style.display = ''), window.SDHubGalleryInfoRawOutput = ''), 200);
    };

    btn.onclick = (e) => (e.stopPropagation(), clearImage());
    window.SDHubGalleryInfoClearImage = clearImage;
  }
}
