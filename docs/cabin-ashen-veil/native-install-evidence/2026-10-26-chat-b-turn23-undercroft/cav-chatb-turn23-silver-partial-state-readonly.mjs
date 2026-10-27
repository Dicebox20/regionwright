import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('Exact GM tab unavailable');
 const state=await page.evaluate(()=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM?.id!==game.user.id)
    throw Error('Wrong GM');
  const sg=game.scenes.get('CAVSG01Scene0001');
  const silver=sg.regions.get('CAVSG01SILVERKEY');
  const behavior=silver.behaviors.get('CAVSG01SILVRBEH1');
  return{world:game.world.id,gm:game.user.name,
   behavior:{id:behavior.id,disabled:behavior.disabled,type:behavior.type,
    events:Array.from(behavior.system.events),source:behavior.system.source},
   installation:silver.getFlag(ns,'cavLateSilverRecoveryInstallation')??null,
   claim:silver.getFlag(ns,'cavLateSecondChaseSilverKeyClaim')??null,
   drop:sg.regions.get('CAVSG01CHASETRG1').getFlag(ns,'cavLateSecondChaseKeyDrop')??null,
   firstDisabled:game.scenes.get('CAVAQ01Scene0001').regions.get('woZ98KXx0RsWIPpl').behaviors.get('CAVAQCHASETRIG01').disabled,
   lateDisabled:sg.regions.get('CAVSG01CHASETRG1').behaviors.get('CAVSG01CHASEBEH1').disabled,
   actorSilver:game.actors.contents.flatMap(a=>a.items.filter(i=>i.name==='Silver Tiny Key').map(i=>({actor:a.id,id:i.id})))};
 });
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn23-silver-partial-state-readonly.json';
 writeFileSync(path,JSON.stringify(state,null,2));
 console.log(JSON.stringify({...state,behavior:{...state.behavior,sourceLength:state.behavior.source.length,source:undefined}}));
}finally{await browser.close()}