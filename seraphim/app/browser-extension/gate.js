import { normalize, matches, safeUrl } from './policy.js';
const $ = id => document.getElementById(id), kind = new URLSearchParams(location.search).get('kind') || 'social';
const target = safeUrl(location.hash.slice(1));let challenge, manualValue = '', ready = false, submitted = false, previousLength=0;
const request = message => chrome.runtime.sendMessage(message);
function render() {
  const input = normalize($('input').value), expected = normalize(challenge?.passage?.Text ?? '');let correct = 0;
  $('quote').replaceChildren(...Array.from(challenge?.passage?.Text ?? '').map((character, i) => { const span = document.createElement('span');span.textContent = character;span.className = i < input.length ? (input[i] === expected[i] ? 'correct' : 'wrong') : '';if (input[i] === expected[i]) correct++;if(i===input.length-1&&input.length>previousLength&&input[i]===expected[i])span.classList.add('flash');return span; }));
  previousLength=input.length;ready = !!expected && matches(input, expected) && manualValue === $('input').value;
  $('confirm').disabled = !ready || submitted;$('progress').style.width = (expected ? Math.min(100, correct / expected.length * 100) : 0) + '%';
  $('status').textContent = ready ? 'Passage complet · Entrée pour continuer' : `${correct} / ${expected.length} caractères reconnus · collage désactivé`;
}
async function start() {
  if (!target) { $('status').textContent = 'Cette adresse ne peut pas être ouverte.';return; }
  const state = await request({ action: 'status' });document.body.classList.toggle('premium', !!state.premium);$('edition').textContent = state.premium ? 'SERAPHIM' : 'CONTROL';$('logo').src = state.premium ? 'assets/seraphim-logo.png' : 'assets/control-logo-black.png';
  if (!state.active) { if (kind === 'content') { $('status').textContent = 'Seraphim est en veille. Revenez à votre onglet.';return; } location.replace(target);return; }
  $('heading').textContent = kind === 'adult' ? 'Avant de révéler ce contenu.' : kind === 'content' ? 'Un instant avant de révéler.' : 'Votre intention avant le réseau.';
  challenge = await request({ action: 'challenge', target, kind });if (!challenge.passage) { $('status').textContent = challenge.error || 'Seraphim doit être actif pour préparer le passage.';return; }
  $('reference').textContent = challenge.passage.Reference;$('input').maxLength = challenge.passage.Text.length + 20;render();$('input').focus();
}
for (const event of ['paste', 'drop']) $('input').addEventListener(event, e => { e.preventDefault();$('status').textContent = 'Ce passage se recopie manuellement.'; });
$('input').addEventListener('beforeinput', e => { if (e.inputType.includes('Paste') || e.inputType.includes('Drop')) e.preventDefault(); });
$('input').addEventListener('input', e => { if (e.isTrusted) manualValue = $('input').value;render(); });
$('input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault();if (ready) $('confirm').click(); } });
$('confirm').addEventListener('click', async () => {
  if (!ready || submitted) return;submitted = true;render();
  const result = await request({ action: 'verify', target, kind, id: challenge.id, text: $('input').value });
  if (!result.valid) { submitted = false, previousLength=0;$('status').textContent = result.error || 'Le passage doit être complet.';render(); }
});
$('back').addEventListener('click', () => { if (history.length > 1) history.back();else window.close(); });
setInterval(async () => { if (!target || kind === 'content') return;const state = await request({ action: 'status' });if (!state.active) location.replace(target); }, 2500);
start().catch(() => { $('status').textContent = 'Le compagnon est indisponible. Seraphim doit être ouvert.'; });
