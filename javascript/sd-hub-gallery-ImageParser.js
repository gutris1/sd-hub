async function SDHubGalleryParser() {
  const RawOutput = gradioApp().querySelector('#SDHubimgInfoGenInfo textarea');
  const HTMLPanel = gradioApp().getElementById('SDHubimgInfoHTML');
  const ImagePanel = gradioApp().getElementById('SDHubimgInfoImage');
  const img = ImagePanel.querySelector('img');

  if (!img) {
    HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML('');
    ImagePanel.style.boxShadow = '';
    return;
  }

  ImagePanel.style.cssText += 'box-shadow: inset 0 0 0 0 !important;';
  img.onload = SDHubImageInfoClearButton;
  img.onclick = () => SDHubGalleryImageViewer('s');

  const output = await SDImageParser(img);
  RawOutput.value = output;
  updateInput(RawOutput);
  HTMLPanel.classList.add('prose');
  HTMLPanel.innerHTML = await SDHubGalleryPlainTextToHTML(output);
}

async function SDHubGalleryPlainTextToHTML(inputs) {
  const EncryptInfo = window.SDImageParserEncryptInfo;
  const Sha256Info = window.SDImageParserSha256Info;
  const NaiSourceInfo = window.SDImageParserNaiSourceInfo;
  const SoftwareInfo = window.SDImageParserSoftwareInfo;
  const SendButton = document.getElementById('SDHubimgInfoSendButton');
  const OutputPanel = document.getElementById('SDHubimgInfoOutputPanel');
  const titlestyle = `display: block; margin-bottom: 2px; color: var(--primary-400);`;

  let outputHTML = '';
  let promptText = '';
  let negativePromptText = '';
  let paramsText = '';
  let modelBox = '';

  let titlePrompt = `
    <button id='SDHub-promptButton' class='sdhubimginfo-copybuttons'
      title='${SDHubGetTranslation("copy_prompt")}'
      onclick='SDHubGalleryCopyButtonEvent(event)'>
      ${SDHubGetTranslation('prompt')}
    </button>
  `;

  let titleNegativePrompt = `
    <button id='SDHub-negativePromptButton' class='sdhubimginfo-copybuttons
      title='${SDHubGetTranslation("copy_negative_prompt")}'
      onclick='SDHubGalleryCopyButtonEvent(event)'>
      ${SDHubGetTranslation('negative_prompt')}
    </button>
  `;

  let titleParams = `
    <button id='SDHub-paramsButton' class='sdhubimginfo-copybuttons'
      title='${SDHubGetTranslation("copy_parameters")}'
      onclick='SDHubGalleryCopyButtonEvent(event)'>
      ${SDHubGetTranslation('parameters')}
    </button>
  `;

  const titleModels = '';
  const titleEncrypt = `<b style='${titlestyle};'>Encrypt</b>`;
  const titleSha = `<b style='${titlestyle};'>EncryptPwdSha</b>`;
  const titleSoftware = `<b style='${titlestyle};'>Software</b>`;
  const titleSource = `<b style='${titlestyle};'>Source</b>`;
  const br = /\n/g;

  function SDHubGalleryHTMLOutput(title, content) {
    return `<div class="sdhubimginfo-outputsection"><p>${title}${content}</p></div>`;
  }

  if (inputs === undefined || inputs === null || inputs.trim() === '') {
    OutputPanel.style.transition = 'none';
    OutputPanel.style.opacity = '0';
    OutputPanel.classList.remove('show');
    SendButton.style.display = 'none';

  } else {
    OutputPanel.classList.add('show');
    OutputPanel.style.transition = '';
    OutputPanel.style.opacity = '1';

    if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
      titlePrompt = '';
      SendButton.style.display = 'none';
      outputHTML = SDHubGalleryHTMLOutput('', inputs);

    } else if (inputs.trim().startsWith('OPPAI:')) {
      const sections = [
        { title: titleEncrypt, content: EncryptInfo },
        { title: titleSha, content: Sha256Info }
      ];

      sections.forEach(section => {
        if (section.content && section.content.trim() !== '') outputHTML += SDHubGalleryHTMLOutput(section.title, section.content);
      });

      outputHTML += SDHubGalleryHTMLOutput('', inputs);

    } else {
      SendButton.style.display = 'grid';
      inputs = inputs.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(br, '<br>');
      inputs = inputs.replace(/Seed:\s?(\d+),/gi, function(match, seedNumber) {
        return `
          <a id='SDHub-seedButton'
            title='${SDHubGetTranslation("copy_seed")}'
            onclick='SDHubGalleryCopyButtonEvent(event)'>
            Seed
          </a>: ${seedNumber},`;
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

        modelBox = `
          <div id='SDHubimgInfoModelOutput' class='sdhubimginfo-modelBox'>
            <svg xmlns='http://www.w3.org/2000/svg'x='0px' y='0px' width='100' height='100' viewBox='0 0 48 48' id='refresh-spinner'>
              <path fill='var(--primary-400)' d='M8,24c0-8.8,7.2-16,16-16c1,0,2,0.1,3,0.3l0.7-3.9C26.5,4.1,25.3,4,24,4C12.9,4,4,13,4,24
                c0,4.8,1.7,9.5,4.8,13.1l3-2.6C9.5,31.6,8,28,8,24z'/>
              <path fill='var(--primary-400)' d='M39.5,11.3l-3.1,2.5C38.6,16.6,40,20.1,40,24c0,8.8-7.2,16-16,16c-1,0-2-0.1-3-0.3l-0.7,3.8
                c1.3,0.2,2.5,0.3,3.7,0.3c11.1,0,20-8.9,20-20C44,19.4,42.4,14.8,39.5,11.3z'/>
              <polygon fill='var(--primary-400)' points='31,7 44,8.7 33.3,19'/>
              <polygon fill='var(--primary-400)' points='17,41 4,39.3 14.7,29'/>
            </svg>
          </div>
        `;

        setTimeout(() => {
          const SDHubimgInfoModelOutput = document.getElementById('SDHubimgInfoModelOutput');
          if (SDHubimgInfoModelOutput) {
            const SDHubimgInfoModelBox = SDHubimgInfoModelOutput.closest('.sdhubimginfo-outputsection');
            if (SDHubimgInfoModelBox) SDHubimgInfoModelBox.classList.add('sdhubimginfo-modelBox');
            SDHubimgInfoModelOutput.innerHTML = modelBox;
          }
        }, 0);

        setTimeout(async () => {
          const fetchTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000));

          try {
            const ModelOutputFetched = await Promise.race([SDImageParserFetchModelOutput(paramsRAW), fetchTimeout]);
            const SDHubimgInfoModelOutput = document.getElementById('SDHubimgInfoModelOutput');
            if (SDHubimgInfoModelOutput) {
              SDHubimgInfoModelOutput.classList.add('sdhubimginfo-display-model-output');
              SDHubimgInfoModelOutput.innerHTML = ModelOutputFetched;
              setTimeout(() => SDHubimgInfoModelOutput.classList.remove('sdhubimginfo-display-model-output'), 2000);
            }
          } catch (error) {
            if (error.message === 'Timeout') {
              const SDHubimgInfoModelOutput = document.getElementById('SDHubimgInfoModelOutput');
              if (SDHubimgInfoModelOutput) SDHubimgInfoModelOutput.innerHTML = 'Failed to fetch...';
            }
          }
        }, 500);

        if (hashesEX && hashesEX[1]) paramsText = paramsText.replace(hashesEX[0], '').trim();
        if (paramsText.endsWith(',')) paramsText = paramsText.slice(0, -1).trim();
      } else paramsText = inputs.trim();

      const sections = [
        { title: titlePrompt, content: promptText },
        { title: titleNegativePrompt, content: negativePromptText },
        { title: titleParams, content: paramsText },
        { title: titleSoftware, content: SoftwareInfo },
        { title: titleModels, content: modelBox },
        { title: titleEncrypt, content: EncryptInfo },
        { title: titleSha, content: Sha256Info },
        { title: titleSource, content: NaiSourceInfo }
      ];

      sections.forEach(section => {
        if (section.content && section.content.trim() !== '') outputHTML += SDHubGalleryHTMLOutput(section.title, section.content);
      });
    }
  }

  return `${outputHTML}`;
}

function SDHubGallerySendButton(Id) {
  let OutputRaw = window.SDImageParserRawOutput;
  let ADmodel = OutputRaw?.includes('ADetailer model');
  let cb = gradioApp().getElementById(`script_${Id}_adetailer_ad_main_accordion-visible-checkbox`);
  if (ADmodel) cb?.checked === false && cb.click();
}

function SDHubGalleryCopyButtonEvent(e) {
  let OutputRaw = window.SDImageParserRawOutput;

  const CopyText = (text, target) => {
    const section = target.closest('.sdhubimginfo-outputsection');
    section.classList.add('sdhubimginfo-borderpulse');
    setTimeout(() => section.classList.remove('sdhubimginfo-borderpulse'), 2000);
    navigator.clipboard.writeText(text);
  };

  if (e.target?.id) {
    const { id } = e.target;
    const stepsStart = OutputRaw.indexOf('Steps:');
    const negStart = OutputRaw.indexOf('Negative prompt:');
    const seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i);

    const text = {
      'SDHub-promptButton': () => OutputRaw.substring(0, [negStart, stepsStart].find(i => i !== -1) || OutputRaw.length).trim(),
      'SDHub-negativePromptButton': () => negStart !== -1 && stepsStart > negStart ? OutputRaw.slice(negStart + 16, stepsStart).trim() : null,
      'SDHub-paramsButton': () => stepsStart !== -1 ? OutputRaw.slice(stepsStart).trim() : null,
      'SDHub-seedButton': () => seedMatch?.[1]?.trim() || null
    }[id]?.();

    if (text) CopyText(text, e.target);
  }
}
