chrome.runtime.sendMessage({ action: 'status' }).then(state => {
  document.body.classList.remove('loading');document.body.classList.toggle('active',!!state.active);document.body.classList.toggle('premium', !!state.premium);document.getElementById('status').textContent = state.active ? 'Session active.' : 'En veille.';
  document.getElementById('detail').textContent = !state.connected ? 'Seraphim est fermé. Le compagnon laisse les ouvertures libres.' : state.active ? 'Passages et filtrage suivent vos choix dans l’application.' : 'Activez Seraphim sur le PC pour commencer une session.';
});
document.getElementById('open').addEventListener('click', () => chrome.runtime.sendMessage({ action: 'openApp' }));

document.getElementById('tools').addEventListener('click',()=>chrome.runtime.sendMessage({action:'controlTools'}));
