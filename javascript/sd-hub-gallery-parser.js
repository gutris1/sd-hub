async function SDHubGalleryParser() {
  const RawOutput = document.querySelector('#SDHub-Gallery-Info-GenInfo textarea');
  const HTMLPanel = document.getElementById('SDHub-Gallery-Info-HTML');
  const ImagePanel = document.getElementById('SDHub-Gallery-Info-Image');
  const img = ImagePanel.querySelector('img');

  if (!img) {
    HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML('');
    return;
  }

  img.onclick = () => SDHubGalleryImageViewer('s');
  img.onload = () => img.style.opacity = '1';

  const output = await SharedImageParser(img);
  window.SDHubGalleryInfoRawOutput = RawOutput.value = output;
  updateInput(RawOutput);
  HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML(output);

  document.querySelectorAll('.sdhub-gallery-info-output-section').forEach(s => {
    const bg = 'var(--input-background-fill)';
    const t = s.querySelector('.sdhub-gallery-info-output-title');
    const w = s.querySelector('.sdhub-gallery-info-output-wrapper');
    if (!t || !w) return;
    const c = t.classList.contains('sdhub-gallery-info-copybutton');
    w.onmouseenter = () => w.style.background = t.style.background = bg;
    w.onmouseleave = () => w.style.background = t.style.background = '';
    t.onmouseenter = () => !c ? (t.style.background = w.style.background = bg) : (w.style.background = bg);
    t.onmouseleave = () => !c ? (t.style.background = w.style.background = '') : (w.style.background = '');
  });
}

async function SDHubGalleryPlainTextToHTML(inputs) {
  const { SharedParserEncryptInfo: EncryptInfo, SharedParserSha256Info: Sha256Info, 
          SharedParserNaiSourceInfo: NaiSourceInfo, SharedParserSoftwareInfo: SoftwareInfo
        } = window;

  const SendButton = document.getElementById('SDHub-Gallery-Info-SendButton');
  const OutputPanel = document.getElementById('SDHub-Gallery-Info-Output-Panel');

  const outputDisplay = 'sdhub-gallery-display-output-panel';
  const outputFail = 'sdhub-gallery-display-output-fail';

  const createTitle = (id, label, copyBtn = false) => {
    const l = copyBtn ? SDHubGetTranslation(label) : label;
    const att = [
      copyBtn && `id='SDHub-Gallery-Info-${id}-Button'`,
      `class='sdhub-gallery-info-output-title${copyBtn ? ' sdhub-gallery-info-copybutton' : ''}'`,
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
    const empty = title === 'nothing';
    const wrapper = title !== titles.models && !empty;
    const text = wrapper ? `<div class='sdhub-gallery-info-output-wrapper'><div class='sdhub-gallery-info-output-content'>${content}</div></div>` : content;
    return `<div class='sdhub-gallery-info-output-section'${empty ? " style='height: 100%'" : ''}>${empty ? '' : title}${text}</div>`;
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
    const failContent = `<div class='sdhub-gallery-info-output-failed' style='position: absolute; bottom: 0;'>${inputs}</div>`;
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
      `<span id='SDHub-Gallery-Info-Seed-Button' title='${SDHubGetTranslation("copy_seed")}' onclick='SDHubGalleryCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`
    );

  const negativePromptIndex = process.indexOf('Negative prompt:');
  const stepsIndex = process.indexOf('Steps:');
  const hashesIndex = process.indexOf('Hashes:');

  let promptText = '';
  let negativePromptText = '';
  let paramsText = '';
  let modelOutput = '';

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

    const modelId = 'SDHub-Gallery-Info-Model-Output';
    modelOutput = `<div id='${modelId}'>${SDHubGallerySpinnerSVG.replace(/<svg\b([^>]*)>/, '<svg id="SDHub-Gallery-Info-Spinner" $1>')}</div>`;

    const boxModels = document.getElementById(modelId);
    if (boxModels) boxModels.innerHTML = modelOutput;

    setTimeout(async () => {
      const modelsBox = document.getElementById(modelId);
      if (!modelsBox) return;

      try {
        const links = await SharedModelsFetch(paramsRAW);
        modelsBox.classList.add('sdhub-gallery-info-display-model-output');
        modelsBox.innerHTML = links;
        setTimeout(() => modelsBox.classList.remove('sdhub-gallery-info-display-model-output'), 2000);
      } catch (error) {
        modelsBox.innerHTML = '<div class="sdhub-gallery-info-output-failed">Failed to fetch...</div>';
      }
      setTimeout(() => window.SDHubGalleryImageInfoArrowScrolling(), 0);
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

function SDHubGallerySendButton(Id) {
  let OutputRaw = window.SDHubGalleryInfoRawOutput;
  let ADmodel = OutputRaw?.includes('ADetailer model');
  let cb = document.getElementById(`script_${Id}_adetailer_ad_main_accordion-visible-checkbox`);
  if (ADmodel) cb?.checked === false && cb.click();
}