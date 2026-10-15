import {safeUrl} from './policy.js';
const target=safeUrl(location.hash.slice(1));
document.getElementById('safe').onclick=()=>chrome.tabs.update({url:'chrome://newtab/'});
document.getElementById('details').onclick=()=>chrome.runtime.sendMessage({action:'threatDetail'});
const host=target?new URL(target).hostname:'';document.getElementById('host').textContent=host||'Adresse invalide';
const eventId=history.state?.eventId||crypto.randomUUID();history.replaceState({eventId},'');
if(host){const state=await chrome.runtime.sendMessage({action:'status'});const result=await chrome.runtime.sendMessage({action:'threatBlocked',host,eventId,session:state.session});document.getElementById('detail').textContent=result.valid?'Hameçonnage signalé · navigation interrompue avant le site.':'Cette adresse a été interrompue. Ouvrez les détails pour vérifier la session et la liste.';}
