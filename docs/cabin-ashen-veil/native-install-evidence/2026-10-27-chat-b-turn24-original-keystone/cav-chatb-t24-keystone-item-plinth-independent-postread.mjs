import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import{writeFileSync}from'node:fs';
const itemCfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-original-keystone-item-source.js').href);
const stageCfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-keystone-vault-plinth-native-stage.js').href);
const expected=stageCfg.disabledPlinthBehavior(),sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('GM world tab missing');
const z=await p.evaluate(()=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('GM world mismatch');
 const vault=game.scenes.get('tjTpG2RVZNoCqRLh'),
 plinth=vault?.regions.get('CAVB799A5357A114'),b=plinth?.behaviors.get('CAVVKEYPLINTH001'),
 item=game.items.get('CAVKEYSTONEITEM1'),
 inner=game.scenes.get('CN5fkK2QLUELBGGR'),
 refuge=game.scenes.get('ywpIpQDrkMLIgUP0'),sg=game.scenes.get('CAVSG01Scene0001');
 return{
  world:game.world.id,gm:game.user.name,
  vaultRegions:vault.regions.size,plinthUuid:plinth.uuid,
  plinthBehaviorCount:plinth.behaviors.size,
  plinthBehavior:{uuid:b?.uuid,type:b?.type,disabled:b?.disabled,events:b?Array.from(b.system.events):[],
  script:b?.system?.source,flag:b?.getFlag(ns,'cavKeystonePlinthStage')},
  item:{uuid:item?.uuid,name:item?.name,type:item?.type,description:item?.system?.description.value,
   quantity:item?.system?.quantity,folder:item?.folder?.id,ownership:item?.ownership,
   flags:item?.flags?.[ns]},
  worldKeystoneCount:game.items.contents.filter(i=>i.name==='Keystone').length,
  actorKeystoneCopies:game.actors.contents.flatMap(a=>a.items.filter(i=>i.name==='Keystone')).length,
  innerDisabled:['CAVUNDKEYBEH0001','CAVUNDLEVBEH0001','CAVUNDOUTTEL0001'].map((id,j)=>
   inner.regions.get(['CAVB67AABD1B35C6','CAVUNDLEVER00001','CAVUNDCROSS00001'][j])?.behaviors.get(id)?.disabled===true),
  refugeReturnDisabled:refuge.regions.get('CAVREFRETURN0001')?.behaviors.get('CAVREFBACKTEL001')?.disabled===true,
  originalVaultDaisStillPresent:vault.regions.get('CAVB799A5357A114')?.toObject().shapes[0].x===705,
  originalCrookedChasesDisabled:game.scenes.get('CAVAQ01Scene0001').regions.get('woZ98KXx0RsWIPpl').behaviors.get('CAVAQCHASETRIG01')?.disabled===true&&
   sg.regions.get('CAVSG01CHASETRG1')?.behaviors.get('CAVSG01CHASEBEH1')?.disabled===true&&
   sg.regions.get('CAVSG01SILVERKEY')?.behaviors.get('CAVSG01SILVRBEH1')?.disabled===true
 };
});
const a=z.plinthBehavior,f=z.item?.flags?.['cavKeystoneOriginalSource'];
const result={status:'Keystone-item-and-Vault-plinth-native-independent-GM-proof',
 gm:z.gm,world:z.world,sourceItemUuid:z.item?.uuid,sourceStatus:z.item?.flags?.cabinPuzzleItem?.status,
 sourceNewAuthority:z.item?.flags?.cabinPuzzleItem?.source,
 sourceDescriptionSHA256:sha(z.item?.description||''),
 plinthRegionUuid:z.plinthUuid,behaviorUuid:a.uuid,behaviorDisabled:a.disabled,
 scriptSHA256:sha(a.script||''),expectedScriptSHA256:sha(expected.system.source),
 actorKeystoneCopies:z.actorKeystoneCopies,worldKeystoneCount:z.worldKeystoneCount,
 allInnerBehaviorsDisabled:z.innerDisabled.every(Boolean)&&z.refugeReturnDisabled,
 originalCrookedChasesDeferred:z.originalCrookedChasesDisabled,
 pass:z.vaultRegions===2&&z.plinthBehaviorCount===1&&
  z.plinthUuid===itemCfg.ORIGINAL_PLINTH_UUID&&
  a.uuid==='Scene.tjTpG2RVZNoCqRLh.Region.CAVB799A5357A114.RegionBehavior.CAVVKEYPLINTH001'&&
  a.type==='executeScript'&&a.disabled===true&&
  a.script===expected.system.source&&
  a.flag?.status==='dormant-vault-still-locked'&&
  a.flag?.originalKeystoneSourceUuid===itemCfg.ITEM_UUID&&
  a.flag?.nativeActorRewardEnabled===false&&
  z.item?.uuid===itemCfg.ITEM_UUID&&z.item?.type==='loot'&&
  z.item?.quantity===1&&z.item?.folder===itemCfg.FOLDER_ID&&
  z.item?.description===itemCfg.DESCRIPTION&&z.item?.ownership?.default===0&&
  z.item.flags?.cabinPuzzleItem?.status==='GM_LIBRARY_ONLY'&&
  z.item.flags.cabinPuzzleItem?.source===itemCfg.OWNER_AUTHORITY&&
  f?.claimStatus==='NOT_CLAIMED'&&
  f?.intendedVaultPlinthRegionUuid===z.plinthUuid&&
  z.worldKeystoneCount===1&&z.actorKeystoneCopies===0&&
  z.innerDisabled.every(Boolean)&&z.refugeReturnDisabled&&
  z.originalVaultDaisStillPresent&&z.originalCrookedChasesDisabled
};
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t24-keystone-item-plinth-independent-postread.json';
writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
if(!result.pass)throw Error('Keystone/plinth independent GM proof failed');
}finally{await b.close()}