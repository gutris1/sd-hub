async function SDHubGalleryParser() {
  const RawOutput = document.querySelector(`#${SDHubiI}-Geninfo textarea`),
        HTMLPanel = document.getElementById(`${SDHubiI}-HTML`),
        ImagePanel = document.getElementById(`${SDHubiI}-img`),
        img = ImagePanel.querySelector('img');

  if (!img) {
    HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML('');
    return;
  }

  img.onclick = () => SDHubGalleryImageViewer('s');
  img.onload = () => img.style.opacity = '1';

  const output = await SharedImageParser(img);
  window.SDHubGalleryImageInfoRaw = RawOutput.value = output;
  updateInput(RawOutput);
  HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML(output);

  document.querySelectorAll(`.${sdhubii}-output-section`).forEach(s => {
    const bg = 'var(--input-background-fill)',
          t = s.querySelector(`.${sdhubii}-output-title`),
          w = s.querySelector(`.${sdhubii}-output-wrapper`);
    if (!t || !w) return;
    const c = t.classList.contains(`${sdhubii}-copybutton`);
    w.onmouseenter = () => w.style.background = t.style.background = bg;
    w.onmouseleave = () => w.style.background = t.style.background = '';
    t.onmouseenter = () => !c ? (t.style.background = w.style.background = bg) : (w.style.background = bg);
    t.onmouseleave = () => !c ? (t.style.background = w.style.background = '') : (w.style.background = '');
  });
}

async function SDHubGalleryPlainTextToHTML(inputs) {
  const { SharedParserEncryptInfo: EncryptInfo, SharedParserSha256Info: Sha256Info, 
          SharedParserNaiSourceInfo: NaiSourceInfo, SharedParserSoftwareInfo: SoftwareInfo
        } = window,

        SendButton = document.getElementById(`${SDHubiI}-SendButton`),
        OutputPanel = document.getElementById(`${SDHubiI}-Output-Panel`),

        outputDisplay = 'sdhub-gallery-display-output-panel',
        outputFail = 'sdhub-gallery-display-output-fail';

  const createTitle = (id, label, copyBtn = false) => {
    const l = copyBtn ? SDHubGetTranslation(label) : label,
          att = [
      copyBtn && `id='${SDHubiI}-${id}-Button'`,
      `class='${sdhubii}-output-title${copyBtn ? ` ${sdhubii}-copybutton` : ''}'`,
      copyBtn && `title='${SDHubGetTranslation(`copy_${label}`)}'`,
      copyBtn && `onclick='SDHubGalleryCopyButtonEvent(event)'`
    ].filter(Boolean).join(' ');
    return `<div ${att}>${l}</div>`;
  };

  const titles = {
    prompt: createTitle('Prompt', 'prompt', true),
    negativePrompt: createTitle('NegativePrompt', 'negative_prompt', true),
    params: createTitle('Params', 'parameters', true),
    encrypt: createTitle('Encrypt', 'Encrypt'),
    sha: createTitle('Sha256', 'EncryptPwdSha'),
    software: createTitle('Software', 'Software'),
    source: createTitle('Source', 'Source'),
    models: ''
  };

  const createSection = (title, content) => {
    if (!content?.trim()) return '';
    const empty = title === 'nothing',
          wrapper = title !== titles.models && !empty,
          text = wrapper ? `<div class='${sdhubii}-output-wrapper'><div class='${sdhubii}-output-content'>${content}</div></div>` : content;
    return `<div class='${sdhubii}-output-section'${empty ? " style='height: 100%'" : ''}>${empty ? '' : title}${text}</div>`;
  };

  if (!inputs?.trim()) {
    OutputPanel.classList.remove(outputDisplay, outputFail);
    SendButton.classList.remove(outputDisplay);
    return '';
  }

  OutputPanel.classList.add(outputDisplay);

  if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
    OutputPanel.classList.add(outputFail);
    SendButton.classList.remove(outputDisplay);
    const failContent = `<div class='${sdhubii}-output-failed' style='position: absolute; bottom: 0;'>${inputs}</div>`;
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
      `<span id='${SDHubiI}-Seed-Button' title='${SDHubGetTranslation("copy_seed")}' onclick='SDHubGalleryCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`
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

    const modelId = `${SDHubiI}-Model-Output`;
    modelOutput = `<div id='${modelId}'>${SDHubGallerySVG_Spinner.replace(/<svg\b([^>]*)>/, `<svg id='${SDHubiI}-Spinner' $1>`)}</div>`;

    const boxModels = document.getElementById(modelId);
    if (boxModels) boxModels.innerHTML = modelOutput;

    setTimeout(async () => {
      const modelsBox = document.getElementById(modelId);
      if (!modelsBox) return;

      try {
        const links = await SharedModelsFetch(paramsRAW);
        modelsBox.classList.add(`${sdhubii}-display-model-output`);
        modelsBox.innerHTML = links;
        setTimeout(() => modelsBox.classList.remove(`${sdhubii}-display-model-output`), 2000);
      } catch (error) {
        modelsBox.innerHTML = `<div class='${sdhubii}-output-failed'>Failed to fetch...</div>`;
      }
      setTimeout(() => window.SDHubGalleryImageInfoArrowUpdate(), 0);
    }, 500);

  } else {
    paramsText = process.trim();
  }

  const sections = [
    [titles.prompt, promptText], [titles.negativePrompt, negativePromptText], [titles.params, paramsText],
    [titles.software, SoftwareInfo], [titles.models, modelOutput], [titles.encrypt, EncryptInfo],
    [titles.sha, Sha256Info], [titles.source, NaiSourceInfo]
  ];

  return sections.filter(([_, content]) => content?.trim()).map(([title, content]) => createSection(title, content)).join('');
}

function SDHubGalleryCopyButtonEvent(e) {
  let OutputRaw = window.SDHubGalleryImageInfoRaw;

  const CopyText = (text, target) => {
    const content = target.closest(`.${sdhubii}-output-section`)?.querySelector(`.${sdhubii}-output-content`);
    content?.classList.add(`${sdhubii}-borderpulse`);
    setTimeout(() => content?.classList.remove(`${sdhubii}-borderpulse`), 2000);
    navigator.clipboard.writeText(text);
  };

  if (e.target?.id) {
    const { id } = e.target,
          stepsStart = OutputRaw.indexOf('Steps:'),
          negStart = OutputRaw.indexOf('Negative prompt:'),
          seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i);

    const text = {
      [`${SDHubiI}-Prompt-Button`]: () => OutputRaw.substring(0, [negStart, stepsStart].find(i => i !== -1) || OutputRaw.length).trim(),
      [`${SDHubiI}-NegativePrompt-Button`]: () => negStart !== -1 && stepsStart > negStart ? OutputRaw.slice(negStart + 16, stepsStart).trim() : null,
      [`${SDHubiI}-Params-Button`]: () => stepsStart !== -1 ? OutputRaw.slice(stepsStart).trim() : null,
      [`${SDHubiI}-Seed-Button`]: () => seedMatch?.[1]?.trim() || null
    }[id]?.();

    if (text) CopyText(text, e.target);
  }
}

function SDHubGallerySendButton(Id) {
  let OutputRaw = window.SDHubGalleryImageInfoRaw,
      ADmodel = OutputRaw?.includes('ADetailer model'),
      cb = document.getElementById(`script_${Id}_adetailer_ad_main_accordion-visible-checkbox`);
  if (ADmodel) cb?.checked === false && cb.click();
}