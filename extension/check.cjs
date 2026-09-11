const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/scripts/ExtendedFilters.js'),'utf8');
const fn=name=>source.match(new RegExp('^function '+name+'\\([^]*?^}', 'm'))[0];
const context=vm.createContext({location:{hostname:'www.reddit.com',pathname:'/'},document:{querySelectorAll:()=>[]},structuredClone});
vm.runInContext(source.slice(0,source.indexOf('let ControlExtendedRules'))+fn('ControlExtendedGetApplication')+fn('ControlExtendedFilterSocialApp')+';let notice="";function ControlExtendedShowBlocker(title){notice=title;}',context);
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
