import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import{writeFileSync}from'node:fs';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-original-keystone-item-source.js').href);
const m=cfg.makeKeystoneWorldTemplate();
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('GM page missing');
 const state=await p.evaluate(()=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
   !game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('GM');
 const i=game.items.get('CAVKEYSTONEITEM1'),
  p=game.scenes.get('tjTpG2RVZNoCqRLh')?.regions.get('CAVB799A5357A114'),
  wall=game.scenes.get('CN5fkK2QLUELBGGR')?.regions.get('CAVB67AABD1B35C6'),
  lever=game.scenes.get('CN5fkK2QLUELBGGR')?.regions.get('CAVUNDLEVER00001'),
  inner=game.scenes.get('CN5fkK2QLUELBGGR')?.regions.get('CAVUNDCROSS00001'),
  outerBack=game.scenes.get('ywpIpQDrkMLIgUP0')?.regions.get('CAVREFRETURN0001'),
  actorCopies=game.actors.contents.flatMap(a=>a.items.filter(x=>x.name==='Keystone').map(x=>({actor:a.id,item:x.id})));
 return{world:game.world.id,gm:game.user.name,
  item:{uuid:i?.uuid,name:i?.name,type:i?.type,img:i?.img,folder:i?.folder?.id,
   quantity:i?.system?.quantity,description:i?.system?.description?.value,
   identified:i?.system?.identified,identifier:i?.system?.identifier,
   ownership:i?.ownership,original:i?.flags?.[ns]},
  itemNameMatches:game.items.contents.filter(i=>i.name==='Keystone').length,
  actorCopies,originalPlinth:p?.uuid,plinthBehaviors:p?.behaviors.size,
  keystoneRecessDisabled:wall?.behaviors.get('CAVUNDKEYBEH0001')?.disabled===true,
  leverDisabled:lever?.behaviors.get('CAVUNDLEVBEH0001')?.disabled===true,
  innerTeleportDisabled:inner?.behaviors.get('CAVUNDOUTTEL0001')?.disabled===true,
  refugeReturnDisabled:outerBack?.behaviors.get('CAVREFBACKTEL001')?.disabled===true};
 });
 const q=state.item,fl=q.original;
 const report={status:'original-Keystone-world-source-independent-elected-gm-readback',
   world:state.world,gm:state.gm,uuid:q.uuid,
   itemQuantity:q.quantity,ownerAuthorised:fl?.cabinPuzzleItem?.source,
   libraryOnly:fl?.cabinPuzzleItem?.status,
   actorCopies:state.actorCopies.length,worldKeystoneMatches:state.itemNameMatches,
   vaultPlinth:state.originalPlinth,plinthBehaviors:state.plinthBehaviors,
   itemDescriptionSHA256:sha(q.description||''),
   sourceDescriptionSHA256:sha(m.system.description.value),
   originalInnerPortalsDisabled:state.keystoneRecessDisabled&&state.leverDisabled&&state.innerTeleportDisabled&&state.refugeReturnDisabled,
   pass:q.uuid===cfg.ITEM_UUID&&q.name==='Keystone'&&q.type==='loot'&&
    q.img===m.img&&q.folder===m.folder&&q.quantity===1&&
    q.description===m.system.description.value&&q.identified===true&&
    q.identifier===m.system.identifier&&q.ownership?.default===0&&
    fl?.cabinPuzzleItem?.status==='GM_LIBRARY_ONLY'&&
    fl.cabinPuzzleItem.source===cfg.OWNER_AUTHORITY&&
    fl.cavKeystoneOriginalSource?.claimStatus==='NOT_CLAIMED'&&
    fl.cavKeystoneOriginalSource?.intendedVaultPlinthRegionUuid===cfg.ORIGINAL_PLINTH_UUID&&
    state.itemNameMatches===1&&state.actorCopies.length===0&&
    state.originalPlinth===cfg.ORIGINAL_PLINTH_UUID&&state.plinthBehaviors===0&&
    state.keystoneRecessDisabled&&state.leverDisabled&&state.innerTeleportDisabled&&state.refugeReturnDisabled
 };
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t24-keystone-item-independent-postread.json';
 writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(!report.pass)throw Error('Keystone source independent GM audit failed');
}finally{await b.close()}