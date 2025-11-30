async function SDHubGalleryParser() {
  const RawOutput = document.querySelector(`#${SDHub.ImgInfo}-Geninfo textarea`),
  HTMLPanel = document.getElementById(`${SDHub.ImgInfo}-HTML`),
  ImagePanel = document.getElementById(`${SDHub.ImgInfo}-img`),
  img = ImagePanel.querySelector('img');

  if (!img) {
    window.SharedParserPostProcessingInfo = window.SharedParserExtrasInfo = '';
    HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML('');
    setTimeout(window.SDHubGalleryImageInfoArrowUpdate, 0);
    return;
  }

  img.onclick = () => SDHubGalleryDisplayImageViewer('s');
  img.onload = () => {
    img.style.opacity = '1';
    setTimeout(() => window.SDHubGalleryDisplayImageInfo?.(), 200);
  };

  const output = await SharedImageParser(img);
  window.SDHubGalleryImageInfoRaw = RawOutput.value = output;
  updateInput(RawOutput);
  setTimeout(() => window.SDHubGallerySendImageInfo?.(), 200);
  HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML(output);
  window.SDHubImg = null;
}

async function SDHubGalleryPlainTextToHTML(inputs) {
  const { SharedParserExtrasInfo: ExtrasInfo, SharedParserPostProcessingInfo: PostProcessingInfo,
          SharedParserEncryptInfo: EncryptInfo, SharedParserSha256Info: Sha256Info, SharedParserNaiSourceInfo: NaiSourceInfo,
        } = window,

  SendButton = document.getElementById(`${SDHub.ImgInfo}-SendButton`),
  OutputPanel = document.getElementById(`${SDHub.ImgInfo}-Output-Panel`),

  outputDisplay = 'sdhub-gallery-display-output-panel',
  outputFail = 'sdhub-gallery-display-output-fail',

  createTitle = (id, label, copyBtn = false) => {
    const L = SDHubGetTranslation(label) || label,
    C = copyBtn && SDHubGetTranslation(`copy_${label}`),

    att = [
      copyBtn && `id='${SDHub.ImgInfo}-${id}-Button'`,
      `class='${SDHub.imgInfo}-output-title${copyBtn ? ` ${SDHub.imgInfo}-copybutton` : ''}'`,
      copyBtn && `title='${C}'`,
      copyBtn && `onclick='SDHubGalleryCopyButtonEvent(event)'`
    ].filter(Boolean).join(' ');

    return `<div ${att}>${L}</div>`;
  },

  titles = {
    prompt: createTitle('Prompt', 'prompt', true),
    negativePrompt: createTitle('NegativePrompt', 'negative_prompt', true),
    params: createTitle('Params', 'parameters', true),
    postProcessing: createTitle('PostProcessing', 'post_processing'),
    encrypt: createTitle('Encrypt', 'Encrypt'),
    sha: createTitle('Sha256', 'EncryptPwdSha'),
    software: createTitle('Software', 'software'),
    source: createTitle('Source', 'source'),
    models: ''
  },

  createSection = (title, content) => {
    if (!content?.trim()) return '';
    const empty = title === 'nothing', model = title === titles.models, wrapper = !empty && !model,
    text = wrapper ? `<div class='${SDHub.imgInfo}-output-wrapper'><div class='${SDHub.imgInfo}-output-content'>${content}</div></div>` : content,
    extra = model ? ` ${SDHub.imgInfo}-models-section` : '';
    return `<div class='${SDHub.imgInfo}-output-section${extra}'${empty ? " style='height: 100%'" : ''}>${empty ? '' : title}${text}</div>`;
  };

  if (!inputs?.trim() && !(window.SharedParserExtrasInfo?.trim() || window.SharedParserPostProcessingInfo?.trim())) {
    OutputPanel.classList.remove(outputDisplay, outputFail);
    SendButton.classList.remove(outputDisplay);
    return '';
  }

  OutputPanel.classList.add(outputDisplay);

  if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
    OutputPanel.classList.add(outputFail);
    SendButton.classList.remove(outputDisplay);
    const failContent = `<div class='${SDHub.imgInfo}-output-failed' style='position: absolute; bottom: 0;'>${inputs}</div>`;
    return createSection('nothing', failContent);
  }

  if (inputs.trim().startsWith('OPPAI:')) {
    let output = '';
    if (EncryptInfo?.trim()) output += createSection(titles.encrypt, EncryptInfo);
    if (Sha256Info?.trim()) output += createSection(titles.sha, Sha256Info);
    output += createSection('', inputs);
    return output;
  }

  SendButton.classList.add(outputDisplay);

  let text = inputs
    .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/Seed:\s?(\d+),/gi, (_, seedNumber) => 
      `<span id='${SDHub.ImgInfo}-Seed-Button' title='${SDHubGetTranslation("copy_seed")}' onclick='SDHubGalleryCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`
    ),

  spinner = `<div id='${SDHub.ImgInfo}-Spinner-Wrapper'><div id='${SDHub.ImgInfo}-Spinner'>${SDHubSVG.spinner()}</div></div>`;

  const { prompt, negativePrompt, params, paramsRAW } = SharedPromptParser(text);

  if (paramsRAW) {
    setTimeout(async () => {
      const modelsBox = OutputPanel.querySelector(`.${SDHub.imgInfo}-models-section`);
      if (modelsBox) {
        try {
          const links = await SharedModelsFetch(paramsRAW);
          if (!links?.trim()) return modelsBox.remove();
          modelsBox.innerHTML = links;
        } catch {
          modelsBox.innerHTML = `<div class='${SDHub.imgInfo}-output-failed'>Failed to fetch...</div>`;
        }
      }

      setTimeout(window.SDHubGalleryImageInfoArrowUpdate, 0);
    }, 500);
  }

  const sections = [
    [titles.prompt, prompt], [titles.negativePrompt, negativePrompt], [titles.params, params], [titles.models, spinner],
    [titles.postProcessing, ExtrasInfo], [titles.postProcessing, PostProcessingInfo], [titles.software, window.SharedParserSoftwareInfo],
    [titles.encrypt, EncryptInfo], [titles.sha, Sha256Info], [titles.source, NaiSourceInfo]
  ];

  return sections.filter(([_, content]) => content?.trim()).map(([title, content]) => createSection(title, content)).join('');
}

function SDHubGalleryCopyButtonEvent(e) {
  const OutputRaw = window.SDHubGalleryImageInfoRaw,

  CopyText = (text, target) => {
    const content = target.closest(`.${SDHub.imgInfo}-output-section`)?.querySelector(`.${SDHub.imgInfo}-output-content`);
    content?.classList.add(`${SDHub.imgInfo}-borderpulse`);
    setTimeout(() => content?.classList.remove(`${SDHub.imgInfo}-borderpulse`), 2000);
    navigator.clipboard.writeText(text);
  };

  if (e.target?.id) {
    const { id } = e.target,

    stepsStart = OutputRaw.indexOf('Steps:'),
    negStart = OutputRaw.indexOf('Negative prompt:'),
    seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i),

    text = {
      [`${SDHub.ImgInfo}-Prompt-Button`]: () => OutputRaw.substring(0, [negStart, stepsStart].find(i => i !== -1) || OutputRaw.length).trim(),
      [`${SDHub.ImgInfo}-NegativePrompt-Button`]: () => negStart !== -1 && stepsStart > negStart ? OutputRaw.slice(negStart + 16, stepsStart).trim() : null,
      [`${SDHub.ImgInfo}-Params-Button`]: () => stepsStart !== -1 ? OutputRaw.slice(stepsStart).trim() : null,
      [`${SDHub.ImgInfo}-Seed-Button`]: () => seedMatch?.[1]?.trim() || null
    }[id]?.();

    text && CopyText(text, e.target);
  }
} 

function SDHubGallerySendButton(id) {
  window.scrollTo({ top: 0, behavior: 'instant' });

  const OutputRaw = window.SDHubGalleryImageInfoRaw,

  ADetailer = (id) => {
    const i = `script_${id.replace('_tab', '')}_adetailer_ad_main_accordion-visible-checkbox`,
    cb = document.getElementById(i);
    if (cb && !cb.checked) cb.click();
  },

  mahiro = (id) => {
    const i = `#${id.replace('_tab', '')}_script_container span`,
    cb = Array.from(document.querySelectorAll(i)).find(s => s.textContent.trim() === 'Enable Mahiro CFG')?.previousElementSibling;
    if (cb && !cb.checked) cb.click();
  };

  if (['txt2img_tab', 'img2img_tab'].includes(id)) {
    if (OutputRaw?.includes('ADetailer model')) ADetailer(id);
    if (OutputRaw?.includes('mahiro_cfg_enabled: True')) mahiro(id);
  }

  if (document.querySelector('.gradio-container-4-40-0') && id.includes('extras_tab'))
    setTimeout(() => document.getElementById('tab_extras-button').click(), 500);

  setTimeout(() => window.SDHubGalleryCloseImageInfo(), 100);
}