/* Visual effects only: this module never reads conversations or changes protection rules. */
(() => {
  'use strict';
  if (!/(^|\.)instagram\.com$/.test(location.hostname)) return;
  let started = false, loader = null, exitTimer = 0, deadline = 0;
  let active = false, lastPath = location.pathname, pendingConversation = false;
  let lastSearch = null;
  const animations = new Map();
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fade(node, from = .18) {
    if (!node || reduced() || document.documentElement.hasAttribute('data-control-ig-loading')) return;
    animations.get(node)?.cancel();
    const animation = node.animate([{opacity:from},{opacity:1}], {duration:360,easing:'cubic-bezier(.22,.68,.25,1)'});
    animations.set(node, animation);
    const cleanup = () => { if (animations.get(node) === animation) animations.delete(node); };
    animation.onfinish = cleanup;
    animation.oncancel = cleanup;
  }
  function conversationPane() {
    const main = document.querySelector('main');
    const content = main?.querySelector('[role="log"], [contenteditable="true"][role="textbox"], textarea');
    for (let node = content?.parentElement; node && main?.contains(node); node = node.parentElement) {
      const bounds = node.getBoundingClientRect();
      if (bounds.height >= innerHeight * .45 && bounds.width >= 240 && !node.querySelector('a[href^="/direct/t/"]')) return node;
    }
    return null;
  }
  const controlLabel = node => (node.getAttribute('aria-label') || node.getAttribute('title') || node.querySelector('[aria-label]')?.getAttribute('aria-label') || '').trim().toLowerCase();
  function markVoiceComposer() {
    const controls = [...document.querySelectorAll('main button, main [role="button"]')];
    const stop = controls.find(node => /^(stop|stop recording|stop voice recording|arrêter|arrêter l.enregistrement|arrêter l.enregistrement vocal|play recording|pause recording|play voice message|pause voice message|lire l.enregistrement|mettre l.enregistrement en pause)$/i.test(controlLabel(node)));
    if (!stop) {
      document.querySelectorAll('[data-control-ig-voice], [data-control-ig-voice-track], [data-control-ig-voice-action], [data-control-ig-voice-fill]').forEach(node => {
        for (const attr of [...node.attributes]) if (attr.name.startsWith('data-control-ig-voice')) node.removeAttribute(attr.name);
      });
      return;
    }
    for (let row = stop.parentElement, depth = 0; row && depth < 7; row = row.parentElement, depth++) {
      const bounds = row.getBoundingClientRect();
      if (bounds.height > 180) break;
      if (bounds.bottom < innerHeight * .5) continue;
      const buttons = [...row.querySelectorAll('button, [role="button"]')];
      const cancel = buttons.find(node => /^(cancel|discard|delete|annuler|supprimer)( (voice message|recording|audio|le message vocal|l.enregistrement))?$/i.test(controlLabel(node)));
      const send = buttons.find(node => /^(send|send voice message|send audio|envoyer|envoyer le message vocal|envoyer l.audio)$/i.test(controlLabel(node)));
      if (!cancel || !send) continue;
      row.setAttribute('data-control-ig-voice', 'true');
      for (const [node, action] of [[stop,'stop'],[cancel,'cancel'],[send,'send']]) node.setAttribute('data-control-ig-voice-action',action);
      // Style the native recording capsule, keeping its waveform, timer and handlers intact.
      let track = stop.parentElement;
      while (track?.parentElement && track.parentElement !== row && !track.parentElement.contains(cancel) && !track.parentElement.contains(send)) track = track.parentElement;
      if (track && track !== row && !track.contains(cancel) && !track.contains(send)) {
        track.setAttribute('data-control-ig-voice-track', 'true');
        for (const node of track.querySelectorAll('div, [role="progressbar"]')) {
          if (node.closest('button,[role="button"]') || node.querySelector('button,[role="button"]')) continue;
          const box = node.getBoundingClientRect(), rgb = getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number);
          if (box.width > 80 && box.height > 16 && rgb?.length >= 3 && rgb[2] > rgb[0] + 50 && rgb[2] > rgb[1] + 30) node.setAttribute('data-control-ig-voice-fill','true');
        }
      }
      return;
    }
  }
  function refresh() {
    if (!active) return;
    if (lastPath !== location.pathname) {
      lastPath = location.pathname;
      pendingConversation = /^\/direct\/t\//.test(lastPath);
    }
    if (pendingConversation) {
      const pane = conversationPane();
      if (pane) { fade(pane); pendingConversation = false; }
    }
    const search = document.querySelector('[data-control-ig-search-panel="true"]');
    const visibleSearch = search?.getBoundingClientRect().height > 0 ? search : null;
    if (visibleSearch !== lastSearch) { fade(visibleSearch, .35); lastSearch = visibleSearch; }
    if (location.pathname.startsWith('/direct/')) markVoiceComposer();
  }
  document.addEventListener('focusin', event => {
    if (!active || !(event.target instanceof HTMLInputElement)) return;
    const field = event.target;
    if (field.type === 'search' || /search|recherch/i.test(field.getAttribute('aria-label') || field.placeholder)) {
      fade(field.closest('[data-control-ig-search-panel]') || field.parentElement, .4);
    }
  });
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
    if (!loader) {
      if (immediate) {
        clearTimeout(exitTimer);
        document.getElementById('ControlInstagramLoading')?.remove();
        document.documentElement.removeAttribute('data-control-ig-loading');
      }
      return;
    }
    const current = loader;
    loader = null;
    clearTimeout(deadline);
    current.dataset.state = 'leaving';
    current.setAttribute('aria-hidden', 'true');
    const remove = () => {
      current.remove();
      document.documentElement.removeAttribute('data-control-ig-loading');
      clearTimeout(exitTimer);
    };
    if (immediate || reduced()) remove();
    else {
      // Reveal the complete native app (including navigation and headers) under the fading splash.
      document.documentElement.setAttribute('data-control-ig-loading', 'revealing');
      current.addEventListener('transitionend', event => { if (event.target === current && event.propertyName === 'opacity') remove(); });
      exitTimer = setTimeout(remove, 800);
    }
  }

  function pageReady() {
    if (document.querySelector('#ControlRouteBlocker, #ControlExtendedBlocker')) return true;
    return Boolean(document.querySelector('main a[href], main button, main [role="button"], main textarea, main [contenteditable="true"], main article, input[type="password"]'));
  }

  function update({enabled}) {
    active = enabled;
    if (!enabled) {
      finishLoading(true);
      clearTimeout(exitTimer);
      document.getElementById('ControlInstagramLoading')?.remove();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      pendingConversation = false;
      lastSearch = null;
      lastPath = location.pathname;
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
        const logo = chrome.runtime.getURL('assets/InstagramColor.svg');
        loader.innerHTML = '<div class="ControlIgLoadingScene" aria-hidden="true"><div class="ControlIgLoadingMark"><img alt=""><i></i></div></div><span>Instagram</span><small>A little space for your conversations</small>';
        loader.querySelectorAll('img').forEach(img => { img.src = logo; });
        loader.style.setProperty('--ControlIgLoadingLogo', `url("${logo}")`);
        document.documentElement.setAttribute('data-control-ig-loading', 'pending');
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
  window.ControlInstagramVisuals = {update, lightTheme, refresh};
})();
