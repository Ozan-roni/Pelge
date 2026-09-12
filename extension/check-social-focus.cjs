const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/scripts/BackgroundService.js'),'utf8');
const fn=name=>source.match(new RegExp('^(?:async )?function '+name+'\\([^]*?^}', 'm'))[0];
async function run(){
 let data={Rules:{SchemaVersion:14,ShowUsageTimer:false,Instagram:{Enabled:false},YouTube:{Enabled:false},Reddit:{Enabled:false,DailyLimitMinutes:25},Facebook:{Enabled:false},X:{Enabled:true,DailyLimitMinutes:10}}},writes=0;
 const context=vm.createContext({structuredClone,chrome:{storage:{sync:{get:async()=>structuredClone(data),set:async patch=>{writes++;data={...data,...structuredClone(patch)};}}}}});
 vm.runInContext(source.slice(source.indexOf('const DefaultRules'),source.indexOf('const ProtectedLaunchHosts'))+fn('MergeRules')+fn('ApplyRequestedSocialFocus')+'\nlet ControlRulesInitialization=null;\n'+fn('EnsureDefaultRules'),context);
 await Promise.all([vm.runInContext('EnsureDefaultRules()',context),vm.runInContext('EnsureDefaultRules()',context)]);
 assert.equal(writes,1,'Concurrent startup runs apply the preset once');
 for(const app of ['X','Reddit','Facebook']){assert.equal(data.Rules[app].Enabled,true);assert.equal(data.Rules[app].DMsOnly,true);assert(data.Rules.ProtectedApplications.includes(app));}
 assert.equal(data.Rules.Reddit.DailyLimitMinutes,25);assert.equal(data.Rules.X.DailyLimitMinutes,10);
 assert.equal(data.Rules.Instagram.Enabled,false);assert.equal(data.Rules.YouTube.Enabled,false);assert.equal(data.Rules.ShowUsageTimer,false);
 assert.equal(data.ControlSocialFocusApplied,1);
 data.Rules.Facebook.Enabled=false;data.Rules.Reddit.DMsOnly=false;
 vm.runInContext('ControlRulesInitialization=null',context);
 await vm.runInContext('EnsureDefaultRules()',context);
 assert.equal(data.Rules.Facebook.Enabled,false,'A later rechoose is not overridden on restart');
 assert.equal(data.Rules.Reddit.DMsOnly,false,'Later filter choices are preserved');
 console.log('PASS: requested social preset applies once, preserves limits/other apps and respects later settings.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
