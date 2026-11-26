const paths = {
  pin: '<circle cx="12" cy="9" r="2.5"/><path d="M18.5 9c0 5-6.5 12-6.5 12S5.5 14 5.5 9a6.5 6.5 0 0 1 13 0z"/>',
  notebook: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 3v18m3-13h4m-4 4h4"/>',
  'arrow-up-right': '<path d="M5 19 19 5M7 5h12v12"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7zm-9 5 9 5 9-5m-9 5v10"/>',
  facade: '<path d="M3 21h18M5 21V6l8-3v18m0-13 6 2v11M8 9v2m2-3v2m-2 4v2m2-3v2m6-2v2"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zm-9 10 9 5 9-5M3 17l9 5 9-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  sunset: '<path d="M2 17h20M4 21h16M7 16a5 5 0 0 1 10 0M12 3v4M3 9l3 2m15-2-3 2"/>',
  moon: '<path d="M20 15.2A8.8 8.8 0 0 1 8.8 4a8.9 8.9 0 1 0 11.2 11.2Z"/>',
  expand: '<path d="M4 9V4h5m6 0h5v5m0 6v5h-5M4 15v5h5"/>',
  contract: '<path d="M9 4v5H4m16 0h-5V4m0 16v-5h5M4 15h5v5"/>',
  orbit:
    '<ellipse cx="12" cy="13" rx="10" ry="4" transform="rotate(-18 12 13)"/><circle cx="12" cy="12" r="6.5"/><circle cx="20" cy="8.5" r="1.5" fill="currentColor"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1.7 7.5M4 4v6h6"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
};

export function setIcon(element, name) {
  element.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name]}</svg>`;
}
