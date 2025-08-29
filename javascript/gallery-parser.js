async function SDHubGalleryParser() {
  const RawOutput = document.querySelector(`#${SDHubVar.ImgInfo}-Geninfo textarea`),
  HTMLPanel = document.getElementById(`${SDHubVar.ImgInfo}-HTML`),
  ImagePanel = document.getElementById(`${SDHubVar.ImgInfo}-img`),
  img = ImagePanel.querySelector('img');

  if (!img) {
    window.SharedParserPostProcessingInfo = window.SharedParserExtrasInfo = '';
    HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML('');
    return;
  }

  img.onclick = () => SDHubGalleryImageViewer('s');
  img.onload = () => (img.style.opacity = '1', setTimeout(() => window.SDHubGalleryDisplayImageInfo?.(), 200));

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

  SendButton = document.getElementById(`${SDHubVar.ImgInfo}-SendButton`),
  OutputPanel = document.getElementById(`${SDHubVar.ImgInfo}-Output-Panel`),

  outputDisplay = 'sdhub-gallery-display-output-panel',
  outputFail = 'sdhub-gallery-display-output-fail',

  createTitle = (id, label, copyBtn = false) => {
    const L = SDHubGetTranslation(label) || label,
    C = copyBtn && SDHubGetTranslation(`copy_${label}`),

    att = [
      copyBtn && `id='${SDHubVar.ImgInfo}-${id}-Button'`,
      `class='${SDHubVar.imgInfo}-output-title${copyBtn ? ` ${SDHubVar.imgInfo}-copybutton` : ''}'`,
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
    text = wrapper ? `<div class='${SDHubVar.imgInfo}-output-wrapper'><div class='${SDHubVar.imgInfo}-output-content'>${content}</div></div>` : content,
    extra = model ? ` ${SDHubVar.imgInfo}-models-section` : '';
    return `<div class='${SDHubVar.imgInfo}-output-section${extra}'${empty ? " style='height: 100%'" : ''}>${empty ? '' : title}${text}</div>`;
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
    const failContent = `<div class='${SDHubVar.imgInfo}-output-failed' style='position: absolute; bottom: 0;'>${inputs}</div>`;
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

  let process = inputs
    .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/Seed:\s?(\d+),/gi, (_, seedNumber) => 
      `<span id='${SDHubVar.ImgInfo}-Seed-Button' title='${SDHubGetTranslation("copy_seed")}' onclick='SDHubGalleryCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`
    );

  const negativePromptIndex = process.indexOf('Negative prompt:'),
  stepsIndex = process.indexOf('Steps:'),
  hashesIndex = process.indexOf('Hashes:');

  let promptText = '', negativePromptText = '', paramsText = '', modelOutput = '';

  if (negativePromptIndex !== -1) promptText = process.substring(0, negativePromptIndex).trim();
  else if (stepsIndex !== -1) promptText = process.substring(0, stepsIndex).trim();
  else promptText = process.trim();

  if (negativePromptIndex !== -1 && stepsIndex !== -1 && stepsIndex > negativePromptIndex) {
    negativePromptText = process.slice(negativePromptIndex + 'Negative prompt:'.length, stepsIndex).trim();
  }

  if (stepsIndex !== -1) {
    const paramsRAW = process.slice(stepsIndex).trim();
    paramsText = paramsRAW.replace(/,\s*(Lora hashes|TI hashes):\s*"[^"]+"/g, '').trim();

    const hashes = process.slice(hashesIndex).match(/Hashes:\s*(\{.*?\})(,\s*)?/);
    if (hashes?.[1]) paramsText = paramsText.replace(hashes[0], '').trim();
    if (paramsText.endsWith(',')) paramsText = paramsText.slice(0, -1).trim();

    modelOutput = `<div id='${SDHubVar.ImgInfo}-Spinner-Wrapper'><div id='${SDHubVar.ImgInfo}-Spinner'>${SDHubSVG.spinner()}</div></div>`;

    setTimeout(async () => {
      const modelsBox = OutputPanel.querySelector(`.${SDHubVar.imgInfo}-models-section`);
      if (modelsBox) {
        try {
          const links = await SharedModelsFetch(paramsRAW);
          if (!links?.trim()) return modelsBox.remove();

          modelsBox.innerHTML = links;
        } catch (error) {
          modelsBox.innerHTML = `<div class='${SDHubVar.imgInfo}-output-failed'>Failed to fetch...</div>`;
        }
        setTimeout(() => window.SDHubGalleryImageInfoArrowUpdate(), 0);
      }
    }, 500);

  } else {
    paramsText = process.trim();
  }

  const sections = [
    [titles.prompt, promptText], [titles.negativePrompt, negativePromptText], [titles.params, paramsText], [titles.models, modelOutput],
    [titles.postProcessing, ExtrasInfo], [titles.postProcessing, PostProcessingInfo], [titles.software, window.SharedParserSoftwareInfo],
    [titles.encrypt, EncryptInfo], [titles.sha, Sha256Info], [titles.source, NaiSourceInfo]
  ];

  return sections.filter(([_, content]) => content?.trim()).map(([title, content]) => createSection(title, content)).join('');
}

function SDHubGalleryCopyButtonEvent(e) {
  const OutputRaw = window.SDHubGalleryImageInfoRaw,

  CopyText = (text, target) => {
    const content = target.closest(`.${SDHubVar.imgInfo}-output-section`)?.querySelector(`.${SDHubVar.imgInfo}-output-content`);
    content?.classList.add(`${SDHubVar.imgInfo}-borderpulse`);
    setTimeout(() => content?.classList.remove(`${SDHubVar.imgInfo}-borderpulse`), 2000);
    navigator.clipboard.writeText(text);
  };

  if (e.target?.id) {
    const { id } = e.target,

    stepsStart = OutputRaw.indexOf('Steps:'),
    negStart = OutputRaw.indexOf('Negative prompt:'),
    seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i),

    text = {
      [`${SDHubVar.ImgInfo}-Prompt-Button`]: () => OutputRaw.substring(0, [negStart, stepsStart].find(i => i !== -1) || OutputRaw.length).trim(),
      [`${SDHubVar.ImgInfo}-NegativePrompt-Button`]: () => negStart !== -1 && stepsStart > negStart ? OutputRaw.slice(negStart + 16, stepsStart).trim() : null,
      [`${SDHubVar.ImgInfo}-Params-Button`]: () => stepsStart !== -1 ? OutputRaw.slice(stepsStart).trim() : null,
      [`${SDHubVar.ImgInfo}-Seed-Button`]: () => seedMatch?.[1]?.trim() || null
    }[id]?.();

    if (text) CopyText(text, e.target);
  }
} 

function SDHubGallerySendButton(id) {
  window.scrollTo({ top: 0, behavior: 'instant' });
  setTimeout(() => window.SDHubGalleryCloseImageInfo(), 100);

  if (['txt2img_tab', 'img2img_tab'].includes(id)) {
    const OutputRaw = window.SDHubGalleryImageInfoRaw,
    ADmodel = OutputRaw?.includes('ADetailer model'),
    mahiro = OutputRaw?.includes('mahiro_cfg_enabled: True');

    if (ADmodel) {
      const i = `script_${id.replace('_tab', '')}_adetailer_ad_main_accordion-visible-checkbox`,
      cb = document.getElementById(i);
      if (cb && !cb.checked) cb.click();
    }

    if (mahiro) {
      const i = `#${id.replace('_tab', '')}_script_container span`,
      cb = Array.from(document.querySelectorAll(i)).find(s => s.textContent.trim() === 'Enable Mahiro CFG')?.previousElementSibling;
      if (cb && !cb.checked) cb.click();
    }
  }

  if (document.querySelector('.gradio-container-4-40-0') && id.includes('extras_tab'))
    setTimeout(() => document.getElementById('tab_extras-button').click(), 500);
}