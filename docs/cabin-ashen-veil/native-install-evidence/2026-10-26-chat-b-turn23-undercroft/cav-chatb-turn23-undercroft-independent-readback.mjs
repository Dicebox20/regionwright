import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-inner-undercroft-native-staging.js').href);
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 const z=await p.evaluate(({stages})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');
 const rows=stages.map(q=>{
  const scene=game.scenes.get(q.sceneId),r=scene.regions.get(q.id),v=q.behaviorId?r?.behaviors.get(q.behaviorId):null;
  const shape=r?.toObject().shapes?.[0];
  return{kind:q.kind,id:q.id,uuid:r?.uuid,shape,
   behaviorId:v?.id,behaviorType:v?.type,disabled:v?.disabled??null,
   behaviorCount:r?.behaviors.size,destinations:v?.system?.destinations?Array.from(v.system.destinations):null,
   flag:r?.getFlag(ns,'cavInnerKeystonePhysical')?.status??null,
   exactShape:!!shape&&shape.type==='rectangle'&&
    shape.x===q.rect.x&&shape.y===q.rect.y&&
    shape.width===q.rect.width&&shape.height===q.rect.height};
 });
 const sg=game.scenes.get('CAVSG01Scene0001'),silver=sg.regions.get('CAVSG01SILVERKEY');
 return{world:game.world.id,gm:game.user.name,
  outerCount:game.scenes.get('CN5fkK2QLUELBGGR').regions.size,
  refugeCount:game.scenes.get('ywpIpQDrkMLIgUP0').regions.size,
  originalOuterStairPassive:game.scenes.get('CN5fkK2QLUELBGGR').regions.get('CAVBB3383706E610').behaviors.size===0,
  originalRefugeArrivalPassive:game.scenes.get('ywpIpQDrkMLIgUP0').regions.get('CAVB74BDED08299D').behaviors.size===0,
  originalRefugeObservationPassive:game.scenes.get('ywpIpQDrkMLIgUP0').regions.get('CAVB49066EB37281').behaviors.size===0,
  rows,keystoneSourceExists:game.items.contents.some(i=>/keystone/i.test(i.name)),
  crookedFirstDisabled:game.scenes.get('CAVAQ01Scene0001').regions.get('woZ98KXx0RsWIPpl').behaviors.get('CAVAQCHASETRIG01').disabled,
  crookedSecondDisabled:sg.regions.get('CAVSG01CHASETRG1').behaviors.get('CAVSG01CHASEBEH1').disabled,
  silverDormant:silver.behaviors.get('CAVSG01SILVRBEH1').disabled,
  silverRestore:silver.getFlag(ns,'cavLateSilverRecoveryInstallation')?.status,
  silverClaim:silver.getFlag(ns,'cavLateSecondChaseSilverKeyClaim')??null,
  actorSilverCopies:game.actors.contents.flatMap(a=>a.items.filter(i=>i.name==='Silver Tiny Key')).length};
 },{stages:cfg.STAGES});
 const out={...z,pass:z.outerCount===5&&z.refugeCount===3&&
  z.originalOuterStairPassive&&z.originalRefugeArrivalPassive&&z.originalRefugeObservationPassive&&
  z.rows.length===5&&z.rows.every((row,i)=>row.exactShape&&
   (cfg.STAGES[i].behaviorId?row.disabled===true&&row.behaviorCount===1:
     row.behaviorCount===0)&&
   (cfg.STAGES[i].original||row.flag==='dormant-no-original-keystone')&&
   (!cfg.STAGES[i].destination||JSON.stringify(row.destinations)===
    JSON.stringify([cfg.STAGES[i].destination])))&&
  !z.keystoneSourceExists&&z.crookedFirstDisabled&&z.crookedSecondDisabled&&z.silverDormant&&
  z.silverRestore==='restored-original-dormant-per-owner-deferral'&&
  z.silverClaim===null&&z.actorSilverCopies===0};
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn23-undercroft-independent-readback.json';
 writeFileSync(path,JSON.stringify(out,null,2));console.log(JSON.stringify(out).slice(0,6000));
 if(!out.pass)throw Error('Independent puzzle/native/Crooked deferral readback failed');
}finally{await b.close()}