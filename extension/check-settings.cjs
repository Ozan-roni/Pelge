const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../dist/scripts',name),'utf8');
class Node {
  constructor(){this.attrs=new Map();this.classList=new Classes();this.removed=false;}
  setAttribute(k,v){this.attrs.set(k,v);}
  getAttribute(k){return this.attrs.get(k)??null;}
  removeAttribute(k){this.attrs.delete(k);}
  hasAttribute(k){return this.attrs.has(k);}
  closest(){return this;}
  remove(){this.removed=true;}
}
class Classes extends Set {
  remove(...values){values.forEach(v=>this.delete(v));}
  toggle(v,on){on?this.add(v):this.delete(v);}
}
async function test(){
  const root=new Node(),tweet=new Node(),timer=new Node(),listeners=[];
  tweet.setAttribute('aria-hidden','false');tweet.setAttribute('inert','original');
  const initial={SchemaVersion:14,ShowUsageTimer:false,X:{Enabled:true,ForYou:false,Videos:true,SearchProfilesOnly:true,DailyLimitMinutes:0}};
  const context=vm.createContext({
    structuredClone,URL,URLSearchParams,Date,Element:Node,HTMLAnchorElement:Node,
    location:{hostname:'x.com',pathname:'/person',search:'',href:'https://x.com/person'},
    document:{documentElement:root,addEventListener(){},getElementById:id=>id==='ControlUsageTimer'&&!timer.removed?timer:null,
      querySelectorAll:selector=>selector.includes('video,')?[tweet]:selector.includes('data-control-extended-hidden')&&tweet.hasAttribute('data-control-extended-hidden')?[tweet]:[]},
    sessionStorage:{getItem:()=>null},
    window:{clearTimeout(){},setTimeout(){},clearInterval(){},setInterval(){},addEventListener(){}},
    MutationObserver:class{observe(){}},
    chrome:{storage:{sync:{get:async()=>({Rules:initial})},local:{get:async()=>({})},onChanged:{addListener:fn=>listeners.push(fn)}}}
  });
  vm.runInContext(read('ExtendedFilters.js'),context);
  await new Promise(resolve=>setImmediate(resolve));
  vm.runInContext('ControlExtendedApplyFilters()',context);
  assert(root.classList.has('ControlXHideVideos'));
  assert(tweet.hasAttribute('data-control-extended-hidden'));
  for(const host of ['x.com','twitter.com','mobile.twitter.com']){
    context.location.hostname=host;
    listeners[0]({Rules:{newValue:{...initial,ShieldAll:true,GrayscaleMode:true,ShowUsageTimer:true,X:{...initial.X,Enabled:false,DailyLimitMinutes:1}}}},'sync');
    vm.runInContext('ControlExtendedApplyFilters()',context);
    assert(![...root.classList].some(v=>v.startsWith('Control')));
    assert(!tweet.hasAttribute('data-control-extended-hidden'));
    assert.equal(tweet.getAttribute('aria-hidden'),'false');
    assert.equal(tweet.getAttribute('inert'),'original');
    assert(timer.removed);
  }
  listeners[0]({Rules:{newValue:initial}},'sync');
  vm.runInContext('ControlExtendedApplyFilters()',context);
  assert(tweet.hasAttribute('data-control-extended-hidden'),'Re-enable reapplies saved choice');
  listeners[0]({Rules:{newValue:{...initial,X:{...initial.X,Videos:false}}}},'sync');
  vm.runInContext('ControlExtendedApplyFilters()',context);
  assert(!tweet.hasAttribute('data-control-extended-hidden'),'Individual video toggle restores content');
  // An older async usage read must never win after a newer allowance.
  vm.runInContext('ControlExtendedShowBlocker = () => {};',context);
  context.chrome.storage.local.get=async()=>({UsageState:{Days:{[vm.runInContext('ControlExtendedGetLocalDateKey()',context)]:{X:45*60*1000}}}});
  vm.runInContext('ControlExtendedRules.X.DailyLimitMinutes=30',context);
  await vm.runInContext('ControlExtendedRefreshLimit()',context);
  assert.equal(vm.runInContext('ControlExtendedLimitReached',context),true);
  vm.runInContext('ControlExtendedRules.X.DailyLimitMinutes=60',context);
  await vm.runInContext('ControlExtendedRefreshLimit()',context);
  assert.equal(vm.runInContext('ControlExtendedLimitReached',context),false);
  let finishOldRead;
  context.chrome.storage.local.get=()=>new Promise(resolve=>{finishOldRead=resolve;});
  vm.runInContext('ControlExtendedRules.X.DailyLimitMinutes=30',context);
  const oldRead=vm.runInContext('ControlExtendedRefreshLimit()',context);
  vm.runInContext('ControlExtendedRules.X.DailyLimitMinutes=0',context);
  await vm.runInContext('ControlExtendedRefreshLimit()',context);
  finishOldRead({UsageState:{Days:{[vm.runInContext('ControlExtendedGetLocalDateKey()',context)]:{X:90*60*1000}}}});
  await oldRead;
  assert.equal(vm.runInContext('ControlExtendedLimitReached',context),false,'Unlimited survives a stale usage response');
  const protocolContext=vm.createContext({structuredClone});
  vm.runInContext(read('RuleProtocol.js'),protocolContext);
  const protocol=protocolContext.ControlRuleProtocol;
  const defaults={X:{Enabled:true,Videos:true,DailyLimitMinutes:0},Instagram:{Enabled:true,DMsOnly:true,Reels:true},YouTube:{Enabled:true,Shorts:true,VideoOnly:true}};
  const patch=protocol.validate({X:{Enabled:false}},defaults);
  const result=protocol.apply(defaults,patch);
  assert.equal(result.X.Enabled,false);
  assert.deepEqual(JSON.parse(JSON.stringify(result.Instagram)),defaults.Instagram);
  assert.equal(protocol.apply(defaults,{Instagram:{Reels:false}}).Instagram.DMsOnly,false);
  assert.throws(()=>protocol.validate({X:{DailyLimitMinutes:-1}},defaults));
  assert.throws(()=>protocol.validate({X:{DailyLimitMinutes:1441}},defaults));
  assert.throws(()=>protocol.validate(JSON.parse('{"__proto__":{}}'),defaults));
  const background=read('BackgroundService.js');
  let stored={SchemaVersion:14,X:{Enabled:true},Instagram:{Enabled:false},YouTube:{Enabled:false,Shorts:false}};
  const worker=vm.createContext({structuredClone,URL,chrome:{storage:{sync:{get:async()=>({Rules:structuredClone(stored)}),set:async value=>{stored=structuredClone(value.Rules);}}}}});
  const definition=name=>background.match(new RegExp('^function '+name+'\\([^]*?^}', 'm'))[0];
  vm.runInContext(read('RuleProtocol.js')+background.slice(background.indexOf('const DefaultRules'),background.indexOf('const ProtectedLaunchHosts'))+definition('MergeRules')+'\nlet RuleWriteTask=Promise.resolve();\n'+definition('UpdateRulesPatch'),worker);
  await assert.rejects(vm.runInContext('UpdateRulesPatch({X:{Enabled:false}})',worker),/Rechoose/);
  await Promise.all([vm.runInContext('UpdateRulesPatch({X:{Videos:false}})',worker),vm.runInContext('UpdateRulesPatch({TikTok:{DailyLimitMinutes:45}})',worker)]);
  assert.equal(stored.X.Enabled,true,'Direct disabling must be rejected');
  assert.equal(stored.X.Videos,false,'Individual filters remain editable');
  const allApps={};for(const app of ['Instagram','X','Snapchat','TikTok','YouTube','Reddit','Threads','Facebook'])allApps[app]={Enabled:true};
  assert.throws(()=>protocol.rechoose(allApps,[],{startedAt:1000},300999),/not complete/);
  const released=protocol.rechoose(allApps,['Instagram'],{startedAt:1000},301000);
  assert.equal(released.X.Enabled,false);
  assert.equal(released.Instagram.Enabled,true);
  assert.throws(()=>protocol.rechoose(allApps,[],null,999999),/not complete/);
  assert.throws(()=>protocol.rechoose(allApps,['BadApp'],{startedAt:1000},301000),/Invalid/);
  assert.equal(stored.TikTok.DailyLimitMinutes,45);
  assert.equal(stored.Instagram.Enabled,false,'No forced Instagram re-enable');
  assert.equal(stored.YouTube.Enabled,false,'No forced YouTube re-enable');
  assert.equal(stored.YouTube.Shorts,false,'No forced Shorts lock');
  console.log('PASS: X/twitter live disable, CSS/DOM restoration, global shield override, timer removal, re-enable, video toggle, isolated patches and invalid setting rejection.');
}
test().catch(error=>{console.error(error);process.exitCode=1;});
