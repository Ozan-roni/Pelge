const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/scripts/ExtendedFilters.js'),'utf8');
const fn=name=>source.match(new RegExp('^function '+name+'\\([^]*?^}', 'm'))[0];
const context=vm.createContext({location:{hostname:'www.reddit.com',pathname:'/'},document:{querySelectorAll:()=>[]},structuredClone,URL});
vm.runInContext(source.slice(0,source.indexOf('let ControlExtendedRules'))+fn('ControlExtendedGetApplication')+fn('ControlExtendedFocusRoute')+fn('ControlExtendedApplyMessagesOnly')+fn('ControlExtendedFilterSocialApp')+';let notice="";function ControlExtendedShowBlocker(title){notice=title;}',context);
for(const [host,app] of [['www.reddit.com','Reddit'],['old.reddit.com','Reddit'],['www.threads.com','Threads'],['threads.net','Threads'],['m.facebook.com','Facebook'],['facebook.com.evil.test',null]]){
  context.location.hostname=host;assert.equal(vm.runInContext('ControlExtendedGetApplication()',context),app);
}
for(const [app,route,rules,expected] of [
 ['Reddit','/',{HomeFeed:true},true],['Reddit','/r/popular/',{Popular:true},true],['Reddit','/message/inbox',{},false],
 ['Threads','/',{ForYou:true},true],['Threads','/@person',{},false],
 ['Facebook','/reel/123',{Reels:true},true],['Facebook','/messages/t/123',{DMsOnly:true},false],['Facebook','/settings',{DMsOnly:true},false],['Facebook','/',{DMsOnly:true},true]
]){context.location.pathname=route;context.rules=rules;assert.equal(vm.runInContext(`ControlExtendedFilterSocialApp('${app}',rules)`,context),expected);}
for(const app of ['Reddit','Threads','Facebook']) assert.equal(vm.runInContext(`ControlExtendedDefaultRules.${app}.Enabled`,context),false);
vm.runInContext(fn('ControlExtendedMergeRules')+fn('ApplyControlExtendedInstagramDirectMessagesOnlyRules')+fn('ApplyControlExtendedYouTubeShortsOnlyRules'),context);
assert.equal(vm.runInContext('ControlExtendedMergeRules({SchemaVersion:14,Instagram:{DailyLimitMinutes:45}}).Instagram.DailyLimitMinutes',context),45,'Keep chosen limits');
assert.equal(vm.runInContext('ControlExtendedMergeRules({SchemaVersion:14,Instagram:{DailyLimitMinutes:0}}).Instagram.DailyLimitMinutes',context),0,'Keep explicit unlimited');
assert.equal(vm.runInContext('ControlExtendedMergeRules({SchemaVersion:14}).Reddit.DailyLimitMinutes',context),0,'New app is unlimited');
for(const file of ['Dashboard.js','BackgroundService.js','ExtendedFilters.js']) {
  const defaults = fs.readFileSync(path.join(__dirname,'../dist/scripts',file),'utf8').match(/DailyLimitMinutes: (\d+)/g);
  assert.equal(defaults.length,8,file+' defines eight app defaults');
  for(const value of defaults) assert.equal(value,'DailyLimitMinutes: 0',file+' defaults to unlimited');
}
console.log('PASS: app domains, opt-in defaults, feed rules, messaging exceptions and unlimited defaults in all three runtimes.');

for (const [app,host,blocked,allowed] of [
 ['X','x.com',['/','/home','/explore','/search','/person','/person/status/123','/i/lists/123','/messages-feed'],['/messages','/messages/123','/i/chat','/i/chat/123','/settings/privacy','/i/flow/login','/account/access']],
 ['X','twitter.com',['/home','/explore'],['/messages','/login']],
 ['Reddit','www.reddit.com',['/','/r/all','/r/popular','/r/example','/r/example/comments/123','/user/example','/search','/messageboard'],['/message/inbox','/message/sent','/chat','/settings','/prefs','/login','/register','/password']],
 ['Reddit','old.reddit.com',['/','/r/example'],['/message/inbox','/prefs']],
 ['Reddit','chat.reddit.com',[],['/','/room/123']],
 ['Facebook','www.facebook.com',['/','/home.php','/reels','/watch','/stories','/groups/123','/profile.php','/marketplace','/gaming','/search','/messages-feed'],['/messages','/messages/t/123','/settings','/settings.php','/login.php','/checkpoint','/recover/initiate','/two_step_verification']],
 ['Facebook','m.facebook.com',['/watch'],['/messages','/login.php']]
]) {
 for (const [paths,expected] of [[blocked,true],[allowed,false]]) for (const route of paths) {
  context.app=app;context.location={hostname:host,pathname:route,href:`https://${host}${route}`};
  assert.equal(vm.runInContext('ControlExtendedApplyMessagesOnly(app)',context),expected,`${host}${route}`);
 }
}
const links=['https://x.com/home','/i/chat/123','https://twitter.com/messages','/settings','https://example.com'];
const nav=links.map(href=>({hidden:false,getAttribute:()=>href,setAttribute(){this.hidden=true;},removeAttribute(){this.hidden=false;}}));
context.location={hostname:'x.com',pathname:'/messages',href:'https://x.com/messages'};
context.document.querySelectorAll=selector=>selector.includes('nav a')?nav:nav.filter(n=>n.hidden);
vm.runInContext('ControlExtendedApplyMessagesOnly("X")',context);
assert.deepEqual(nav.map(n=>n.hidden),[true,false,false,false,false],'Hide only feed navigation, preserving absolute message links and external links');
console.log('PASS: social messages-only routes, authentication, legacy hosts, chat and navigation boundaries.');
