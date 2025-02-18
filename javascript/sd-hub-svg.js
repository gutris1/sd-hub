var SDHubGalleryImageButtonSVG = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
    width='30px' height='30px'>
    <path d='M4 6H20M4 12H20M4 18H20' stroke='currentColor' stroke-width='2'
      stroke-linecap='round' stroke-linejoin='round'/>
  </svg>
`;

var SDHubGalleryDLSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns='http://www.w3.org/2000/svg'
    width='32' height='32' viewBox='0 0 32 32'>
    <path fill='currentColor' stroke='currentColor' stroke-width='1.8'
      d='M26 24v4H6v-4H4v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4zm0-10
      l-1.41-1.41L17 20.17V2h-2v18.17l-7.59-7.58L6 14l10 10l10-10z'/>
  </svg>
`;

var SDHubGalleryARRSVG = `
  <svg class='sdhub-gallery-cm-svg submenu-arrow' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="arcs">
    <path d="M9 18l6-6-6-6"/>
  </svg>
`;

var SDHubGalleryImageSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="transparent"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.85)">
    <rect x="0.802" y="0.846" width="22.352" height="22.352" rx="2" ry="2"/>
    <circle cx="7.632" cy="7.676" r="1.862"/>
    <polyline points="23.154 15.747 16.946 9.539 3.285 23.198"/>
  </svg>
`;

var SDHubGalleryImageInfoSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
    <path d="M7 9H17M7 13H17M21 20L17.6757 18.3378C17.4237 18.2118 17.2977 18.1488 17.1656 18.1044C17.0484
      18.065 16.9277 18.0365 16.8052 18.0193C16.6672 18 16.5263 18 16.2446 18H6.2C5.07989 18 4.51984 18 4.09202
      17.782C3.71569 17.5903 3.40973 17.2843 3.21799 16.908C3 16.4802 3 15.9201 3 14.8V7.2C3 6.07989 3 5.51984
      3.21799 5.09202C3.40973 4.71569 3.71569 4.40973 4.09202 4.21799C4.51984 4 5.0799 4 6.2 4H17.8C18.9201 4
      19.4802 4 19.908 4.21799C20.2843 4.40973 20.5903 4.71569 20.782 5.09202C21 5.51984 21 6.0799 21 7.2V20Z"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

var SDHubGalleryOpenNewTabSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none" >
    <path d="M20 4L12 12M20 4V8.5M20 4H15.5M19 12.5V16.8C19 17.9201 19 18.4802 18.782 18.908C18.5903 19.2843 18.2843 19.5903
      17.908 19.782C17.4802 20 16.9201 20 15.8 20H7.2C6.0799 20 5.51984 20 5.09202 19.782C4.71569 19.5903 4.40973 19.2843 4.21799
      18.908C4 18.4802 4 17.9201 4 16.8V8.2C4 7.0799 4 6.51984 4.21799 6.09202C4.40973 5.71569 4.71569 5.40973 5.09202 5.21799C5.51984
      5 6.07989 5 7.2 5H11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

var SDHubGallerySendToSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="32px" height="32px" viewBox="0 0 16 16" transform="scale(0.8)">
    <path d="M0 0h4v4H0V0zm0 6h4v4H0V6zm0 6h4v4H0v-4zM6 0h4v4H6V0zm0 6h4v4H6V6zm0 6h4v4H6v-4zm6-12h4v4h-4V0zm0 6h4v4h-4V6zm0 6h4v4h-4v-4z" fill-rule="evenodd"/>
  </svg>
`;

var SDHubGalleryDeleteSVG = `
  <svg class='sdhub-gallery-cm-svg' xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
    <path d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132
      14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013
      8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854
      19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354
      20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

var SDHubGallerySpinnerSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100" height="100">
    <g>
      <animateTransform
        attributeType="XML"
        attributeName="transform"
        type="rotate"
        values="360 24 24;0 24 24"
        dur="1s"
        repeatCount="indefinite"/>
      <path fill="currentColor"
        d="M8,24c0-8.8,7.2-16,16-16c1,0,2,0.1,3,0.3l0.7-3.9C26.5,4.1,25.3,4,24,4C12.9,4,4,13,4,24
        c0,4.8,1.7,9.5,4.8,13.1l3-2.6C9.5,31.6,8,28,8,24z"/>
      <path fill="currentColor"
        d="M39.5,11.3l-3.1,2.5C38.6,16.6,40,20.1,40,24c0,8.8-7.2,16-16,16c-1,0-2-0.1-3-0.3l-0.7,3.8
        c1.3,0.2,2.5,0.3,3.7,0.3c11.1,0,20-8.9,20-20C44,19.4,42.4,14.8,39.5,11.3z"/>
      <polygon fill="currentColor" points="31,7 44,8.7 33.3,19"/>
      <polygon fill="currentColor" points="17,41 4,39.3 14.7,29"/>
    </g>
  </svg>
`;

var SDHubGalleryCloseButtonSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
    width="32px" height="32px" viewBox="0 0 512 512">
    <path fill="currentColor" d="M330.443 256l136.765-136.765c14.058-14.058 14.058-36.85
      0-50.908l-23.535-23.535c-14.058-14.058-36.85-14.058-50.908 0L256 181.557L119.235
      44.792c-14.058-14.058-36.85-14.058-50.908 0L44.792 68.327c-14.058 14.058-14.058
      36.85 0 50.908L181.557 256L44.792 392.765c-14.058 14.058-14.058 36.85 0 50.908l23.535
      23.535c14.058 14.058 36.85 14.058 50.908 0L256 330.443l136.765 136.765c14.058 14.058
      36.85 14.058 50.908 0l23.535-23.535c14.058-14.058 14.058-36.85 0-50.908L330.443 256z"/>
  </svg>
`;

var SDHubGalleryPrevButtonSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
    width="32px" height="32px" viewBox="0 0 24 24">
    <path
      d="m4.431 12.822 13 9A1 1 0 0 0 19 21V3a1
      1 0 0 0-1.569-.823l-13 9a1.003 1.003 0 0 0 0 1.645z"/>
  </svg>
`;

var SDHubGalleryNextButtonSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
    width="32px" height="32px" viewBox="0 0 24 24">
    <path
      d="M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1
      1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886z"/>
  </svg>
`;
