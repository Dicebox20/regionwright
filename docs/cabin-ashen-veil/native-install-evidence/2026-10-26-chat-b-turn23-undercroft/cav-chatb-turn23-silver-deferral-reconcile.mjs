import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const bmod=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-silver-original-recovery-native.js').href);
const legacy=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-sg01-staged-regions.js').href);
const newSource=bmod.nativeSilverRecoverySource(),oldSource=legacy.sourceForSG01('silver-marker');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('Wrong page');
 const result=await page.evaluate(async ({newSource,oldSource})=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.version!=='14.367'||game.world.id!=='cabin-in-the-ashen-veil'||
   !game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Not elected GM');
  const sg=game.scenes.get('CAVSG01Scene0001'),r=sg.regions.get('CAVSG01SILVERKEY'),
   chase=sg.regions.get('CAVSG01CHASETRG1'),behavior=r.behaviors.get('CAVSG01SILVRBEH1'),
   reservation=r.getFlag(ns,'cavLateSilverRecoveryInstallation');
  if(behavior.disabled!==false||behavior.system.source.trim()!==newSource.trim()||
    reservation?.status!=='reserved'||r.getFlag(ns,'cavLateSecondChaseSilverKeyClaim')||
    chase.getFlag(ns,'cavLateSecondChaseKeyDrop')||
    chase.behaviors.get('CAVSG01CHASEBEH1').disabled!==true||
    game.actors.contents.some(a=>a.items.some(i=>i.name==='Silver Tiny Key')))
    throw Error('Silver partial state does not match safe rollback proof');
  // Single dedicated rollback: disable first, then restore exact original dormant script and native event list.
  await behavior.update({disabled:true});
  if(behavior.disabled!==true)throw Error('Could not disable partial Silver, STOP');
  await behavior.update({name:'silver-marker — DISABLED, upstream blocked',
    'system.source':oldSource,'system.events':['tokenMoveIn','tokenMoveWithin']});
  if(behavior.disabled!==true||behavior.system.source.trim()!==oldSource.trim()||
   Array.from(behavior.system.events).join('|')!=='tokenMoveIn|tokenMoveWithin')
    throw Error('Partial Silver original restoration, STOP and reconcile');
  await r.setFlag(ns,'cavLateSilverRecoveryInstallation',{
   status:'restored-original-dormant-per-owner-deferral',
   note:'Owner directed defer Crooked Man work; attempted guarded Silver installer had reserved before reporting postupdate error; independently verified zero reward and restored old source.',
   originalSilverSourceUuid:'Item.IY8fuUG5P0yWIZIh',
   foundryWriter:'elected-GM',
   replayForbidden:true});
  return{status:'native-silver-original-dormant-restored-after-partial-attempt',
   world:game.world.id,originalRegion:r.uuid,originalBehavior:behavior.uuid,
   currentDisabled:behavior.disabled,sourceMatchesLegacy:behavior.system.source.trim()===oldSource.trim(),
   events:Array.from(behavior.system.events),
   retainedReconciliation:r.getFlag(ns,'cavLateSilverRecoveryInstallation'),
   firstDisabled:game.scenes.get('CAVAQ01Scene0001').regions.get('woZ98KXx0RsWIPpl').behaviors.get('CAVAQCHASETRIG01').disabled,
   lateDisabled:chase.behaviors.get('CAVSG01CHASEBEH1').disabled,
   silverClaim:r.getFlag(ns,'cavLateSecondChaseSilverKeyClaim')??null,
   drop:chase.getFlag(ns,'cavLateSecondChaseKeyDrop')??null};
 },{newSource,oldSource});
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn23-silver-deferral-reconcile.json';
 writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close()}