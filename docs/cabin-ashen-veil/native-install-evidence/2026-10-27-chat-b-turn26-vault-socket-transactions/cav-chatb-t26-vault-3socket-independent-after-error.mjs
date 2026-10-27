import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const ns='dicebox-campaign-helper';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-vault-socket-native-transactions.js').href);
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('No current GM world tab');
 const live=await p.evaluate(({descriptors})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users.activeGM?.id!==game.user.id)
 throw Error('Wrong elected GM');
 const sc=game.scenes.get('G6NMonfCwMvNzipL'),
  v=game.scenes.get('tjTpG2RVZNoCqRLh');
 const results=descriptors.map(x=>{
  const reg=sc.regions.get(x.regionId),beh=reg?.behaviors.get(x.behaviorId);
  return{kind:x.kind,region:reg?.uuid,regionStatus:reg?.getFlag(ns,'cavLateVaultWorkshopFixture')?.status,
   regionLedger:reg?.getFlag(ns,'cavLateVaultSocketTransactionV1')??null,
   behavior:beh?.uuid,disabled:beh?.disabled,type:beh?.type,
   events:Array.from(beh?.system?.events||[]),
   source:beh?.system?.source??null,flags:beh?.getFlag(ns,'cavVaultSocketTransactionStage')??null};
 });
 return{world:game.world.id,gm:game.user.name,workshopRegions:sc.regions.size,
  vaultRegions:v.regions.size,results,
  benchDisabled:sc.regions.get('CAVBABA9513F73A3')?.behaviors.get('CAVVTURNBEH00001')?.disabled===true,
  portalOutDisabled:sc.regions.get('CAVVAULTDOOR0001')?.behaviors.get('CAVVOUTTEL000001')?.disabled===true,
  portalReturnDisabled:v.regions.get('CAVVAULTBACK0001')?.behaviors.get('CAVVBACKTEL00001')?.disabled===true,
  vaultPlinthDisabled:v.regions.get('CAVB799A5357A114')?.behaviors.get('CAVVKEYPLINTH001')?.disabled===true,
  foyerReturnActive:sc.regions.get('CAVBASEMENTRET01')?.behaviors.get('CAVBASEMENTPRT01')?.disabled===false,
  originalItemCopies:game.actors.contents.flatMap(a=>a.items.contents.filter(i=>
   ['Uncharged Gondian Power Source','Gond Emblem Half','Sune Emblem Half','Keystone'].includes(i.name))
   .map(i=>({actorId:a.id,itemId:i.id,name:i.name}))),
  originalLibrary:['pbmUZPfC3WnsBRgi','o9G3UJjEe2QX1ZH0','t9uCIpsKeSvtC31w','CAVKEYSTONEITEM1']
   .map(id=>{const i=game.items.get(id);return{uuid:i?.uuid,status:i?.getFlag(ns,'cabinPuzzleItem')?.status}}),
  firstChaseDisabled:game.scenes.get('CAVAQ01Scene0001')?.regions.get('woZ98KXx0RsWIPpl')?.behaviors.get('CAVAQCHASETRIG01')?.disabled===true,
  secondChaseDisabled:game.scenes.get('CAVSG01Scene0001')?.regions.get('CAVSG01CHASETRG1')?.behaviors.get('CAVSG01CHASEBEH1')?.disabled===true};
 },{descriptors:Object.entries(cfg.SOCKETS).map(([kind,x])=>({kind,...x}))});
 const results=live.results.map(x=>{
  const wanted=cfg.nativeSocketTransactionUpdate(x.kind);
  return{kind:x.kind,region:x.region,behavior:x.behavior,disabled:x.disabled,
   sourceMatches:x.source===wanted['system.source'],
   sourceSha256:sha(x.source||''),expectedSha256:sha(wanted['system.source']),
   eventList:x.events,stage:x.flags,ledger:x.regionLedger,
   regionStage:x.regionStatus,
   verified:x.disabled===true&&x.type==='executeScript'&&
    x.source===wanted['system.source']&&
    x.events.join('|')==='tokenMoveIn|tokenMoveWithin'&&
    x.flags?.status==='source-installed-disabled-pending-original-producer'&&
    x.flags?.itemSourceUuid===cfg.SOCKETS[x.kind].worldItem&&
    x.regionStatus==='dormant-uncommissioned'&&x.regionLedger===null};
 });
 const pass=live.workshopRegions===8&&live.vaultRegions===3&&
  results.length===3&&results.every(x=>x.verified)&&
  live.benchDisabled&&live.portalOutDisabled&&live.portalReturnDisabled&&
  live.vaultPlinthDisabled&&live.foyerReturnActive&&live.originalItemCopies.length===0&&
  live.originalLibrary.every(x=>x.status==='GM_LIBRARY_ONLY')&&
  live.firstChaseDisabled&&live.secondChaseDisabled;
 const report={status:'independent-GM-after-installer-postwrite-script-exception',
  pass,world:live.world,gm:live.gm,results,workshopRegions:live.workshopRegions,
  vaultRegions:live.vaultRegions,originalItems:live.originalLibrary,
  actorItemCopies:live.originalItemCopies,
  unchanged:{turn:live.benchDisabled,outbound:live.portalOutDisabled,
   return:live.portalReturnDisabled,keystonePlinth:live.vaultPlinthDisabled,
   foyerReturn:live.foyerReturnActive,firstChase:live.firstChaseDisabled,
   secondChase:live.secondChaseDisabled}};
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t26-vault-three-transaction-sources-independent-postread.json';
 writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report).slice(0,6000));
 if(!pass)throw Error('Partial transaction source update: reconcile before further modifications');
}finally{await b.close()}