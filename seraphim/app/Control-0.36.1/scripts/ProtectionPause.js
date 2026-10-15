/* Device-local commitment pause. The extension owns the real release deadline. */
(() => {
  const key='ControlProtectionPause.v1';
  const phrases=[
    'My attention belongs to me. I can pause, breathe, and choose what matters next.',
    'An urge is a passing moment, not an instruction. I do not need to follow every notification.',
    'I am making room for people, ideas, and moments that I want to remember.',
    'Small choices count. Staying present for one more minute is already progress.',
    'I can be kind to myself and still keep the promise I made to my time.',
    'There is no race to finish. I can take this slowly and make a deliberate choice.'
  ];
  let dialog,interval,sequence=0,completed=0,started=0,ready=false,busy=false;
  async function request(Type,Selected) {
    let result;
    if(HasExtensionStorage) result=await chrome.runtime.sendMessage({Type,Selected});
    else if(HasExtensionBridge()) result=await SendBridgeRequest(Type,{Selected});
    else {
      let state=JSON.parse(localStorage.getItem(key)||'null');
      if(Type==='StartProtectionPause'&&!state?.startedAt) {state={startedAt:Date.now()};localStorage.setItem(key,JSON.stringify(state));}
      if(Type==='CompleteProtectionPause') {
        const latest=MergeRules(JSON.parse(localStorage.getItem('ControlRules')||'null'));
        const Rules=ControlRuleProtocol.rechoose(latest,Selected,state);
        localStorage.setItem('ControlRules',JSON.stringify(Rules));localStorage.removeItem(key);
        result={Success:true,Rules};
      } else result={Success:true,...ControlRuleProtocol.pauseState(state)};
    }
    if(!result?.Success)throw new Error(result?.Error||'Connection unavailable. Reload Control and try again.');
    return result;
  }
  function message(text){dialog.querySelector('[data-pause-message]').textContent=text;}
  function target(){return phrases[sequence%phrases.length];}
  function drawTyping(){
    dialog.querySelector('textarea').setAttribute('aria-label','Type this sentence: '+target());
    const typed=dialog.querySelector('textarea').value;
    const display=dialog.querySelector('[data-typing-target]');display.replaceChildren();
    [...target()].forEach((char,i)=>{const span=document.createElement('span');span.textContent=char;span.className=i<typed.length?(typed[i]===char?'Correct':'Mistake'):i===typed.length?'Current':'';display.append(span);});
    const count=completed+[...typed].filter((c,i)=>c===target()[i]).length;
    dialog.querySelector('[data-typing-score]').textContent=`${count} characters · ${Math.round(count/5/Math.max(1,(Date.now()-started)/60000))} words/min`;
    if(typed===target()) {completed+=typed.length;sequence++;dialog.querySelector('textarea').value='';drawTyping();}
  }
  async function refresh(){
    if(busy||!dialog?.open)return;
    busy=true;
    try {
      const state=await request('ReadProtectionPause');
      const seconds=Math.ceil(state.remaining/1000);
      dialog.querySelector('[data-pause-clock]').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
      dialog.querySelector('.CPPClock').style.setProperty('--progress',`${100*(1-state.remaining/300000)}%`);
      ready=state.ready;
      if(!ready)message(HasControlExtension()?'Your protection stays active while you take this pause.':'Local preview: this countdown does not change your Chrome extension.');
      dialog.querySelector('[data-pause-selection]').hidden=!ready;
      dialog.querySelector('[data-pause-save]').disabled=!ready;
      if(ready) {message('Your pause is complete. Choose which apps should remain protected.');clearInterval(interval);}
    }catch(error){ready=false;dialog.querySelector('[data-pause-save]').disabled=true;message(error.message);}
    finally{busy=false;}
  }
  async function open(){
    if(dialog?.open)return;
    if(!dialog){
      dialog=document.createElement('dialog');dialog.className='CPPDialog';dialog.setAttribute('aria-labelledby','CPPTitle');
      dialog.innerHTML=`<button class="CSButton CPPBack" type="button" data-pause-close aria-label="Return to settings">← Back to settings</button><div class="CPPLayout"><section><p class="CSEyebrow">A MOMENT FOR YOURSELF</p><h2 id="CPPTitle">Pause. Breathe.<br><em>Choose with intention.</em></h2><p>Your apps stay protected during this five-minute pause. You can leave and return: your countdown continues.</p><div class="CPPClock"><strong data-pause-clock>5:00</strong><span>before choosing again</span></div><p data-pause-message role="status">Connecting to your protection settings…</p></section><section class="CPPPractice"><span class="CSBadge">OPTIONAL · MINDFUL TYPING</span><h3>One thought at a time.</h3><p>Type at your own pace. New words keep coming; typing does not shorten the wait.</p><div class="CPPTarget" data-typing-target aria-hidden="true"></div><label for="CPPTyping">Type the sentence shown above</label><textarea id="CPPTyping" rows="3" autocomplete="off" spellcheck="false" placeholder="My attention belongs to me…"></textarea><small data-typing-score>0 characters</small></section></div><form data-pause-selection hidden><h3>Keep the protection you want.</h3><p>Checked apps remain protected. Unchecked apps return to their normal experience.</p><div class="CPPApplications"></div><button class="CSButton CSPrimary" data-pause-save disabled type="submit">Save my selection →</button></form>`;
      document.getElementById('Studio').append(dialog);
      dialog.querySelector('[data-pause-close]').onclick=()=>dialog.close();
      dialog.addEventListener('close',()=>clearInterval(interval));
      dialog.querySelector('textarea').addEventListener('input',drawTyping);
      dialog.querySelector('form').addEventListener('submit',async event=>{
        event.preventDefault();if(!ready||busy)return;
        busy=true;const button=dialog.querySelector('[data-pause-save]');button.disabled=true;
        try{
          const selected=[...dialog.querySelectorAll('input:checked')].map(input=>input.value);
          const result=await request('CompleteProtectionPause',selected);
          ReceiveRulesUpdate(result.Rules);dialog.close();
        }catch(error){message(error.message);button.disabled=false;}
        finally{busy=false;}
      });
    }
    const list=dialog.querySelector('.CPPApplications');list.replaceChildren();
    ApplicationDefinitions.forEach(app=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=app.Key;input.checked=ActiveRules[app.Key].Enabled;label.append(input,document.createTextNode(app.Name));list.append(label);});
    ready=false;dialog.querySelector('[data-pause-selection]').hidden=true;dialog.querySelector('[data-pause-save]').disabled=true;
    started=Date.now();dialog.showModal();drawTyping();
    try{await request('StartProtectionPause');await refresh();if(!ready)interval=setInterval(refresh,1000);}catch(error){message(error.message);}
  }
  document.addEventListener('click',event=>{if(event.target.closest('[data-protection-pause]'))void open();});
  window.addEventListener('control:protection-locked',()=>window.ControlStudio?.open('Settings'));
})();
