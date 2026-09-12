/* Visual effects only: this module never reads conversations or changes protection rules. */
(() => {
  'use strict';
  if (!/(^|\.)instagram\.com$/.test(location.hostname)) return;
  let started = false, loader = null, exitTimer = 0, deadline = 0;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lightTheme() {
    const token = getComputedStyle(document.documentElement).getPropertyValue('--ig-primary-background');
    const channels = token.match(/[\d.]+/g)?.map(Number);
    if (channels?.length >= 3) return channels[0] * .299 + channels[1] * .587 + channels[2] * .114 > 150;
    if (document.documentElement.classList.contains('ControlInstagramPolished')) {
      return document.documentElement.classList.contains('ControlInstagramLight');
    }
    const color = document.body && getComputedStyle(document.body).backgroundColor;
    const match = color?.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match && match[4] !== '0') return Number(match[1]) + Number(match[2]) + Number(match[3]) > 450;
    return !matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function finishLoading(immediate = false) {
    if (!loader) return;
    const current = loader;
    loader = null;
    clearTimeout(deadline);
    current.dataset.state = 'leaving';
    current.setAttribute('aria-hidden', 'true');
    const remove = () => current.remove();
    if (immediate || reduced()) remove();
    else {
      current.addEventListener('transitionend', event => { if (event.target === current && event.propertyName === 'opacity') remove(); });
      exitTimer = setTimeout(remove, 650);
    }
  }

  function pageReady() {
    if (document.querySelector('#ControlRouteBlocker, #ControlExtendedBlocker')) return true;
    return Boolean(document.querySelector('main a[href], main button, main [role="button"], main textarea, main [contenteditable="true"], main article, input[type="password"]'));
  }

  function update({enabled}) {
    if (!enabled) {
      finishLoading(true);
      clearTimeout(exitTimer);
      document.getElementById('ControlInstagramLoading')?.remove();
      return;
    }
    if (!started) {
      started = true;
      // Never replay a splash over a ready inbox, a login form, or SPA navigation.
      if (!pageReady() && !/^\/(accounts|challenge|oauth)(\/|$)/.test(location.pathname)) {
        loader = document.createElement('div');
        loader.id = 'ControlInstagramLoading';
        loader.dataset.theme = lightTheme() ? 'light' : 'dark';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-label', 'Instagram is loading');
        const logo = chrome.runtime.getURL('assets/Instagram.svg');
        loader.innerHTML = '<div class="ControlIgLoadingScene" aria-hidden="true"><div class="ControlIgLoadingMark"><img alt=""><i></i></div><img class="ControlIgLoadingReflection" alt=""></div><span>Instagram</span><small>A little space for your conversations</small>';
        loader.querySelectorAll('img').forEach(img => { img.src = logo; });
        loader.style.setProperty('--ControlIgLoadingLogo', `url("${logo}")`);
        document.documentElement.append(loader);
        // Slow or failed Instagram requests must never leave the page covered.
        deadline = setTimeout(() => finishLoading(), 6000);
      }
    }
    if (loader) {
      loader.dataset.theme = lightTheme() ? 'light' : 'dark';
      if (pageReady()) finishLoading();
    }

  }

  document.addEventListener('visibilitychange', () => { if(document.hidden)finishLoading(true); });
  window.ControlInstagramVisuals = {update, lightTheme};
})();
