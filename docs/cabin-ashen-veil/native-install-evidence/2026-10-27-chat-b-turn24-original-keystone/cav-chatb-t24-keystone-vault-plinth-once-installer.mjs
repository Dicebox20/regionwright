import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-keystone-vault-plinth-native-stage.js').href);
const stage=cfg.disabledPlinthBehavior();
if(!cfg.plinthStageIsSafe(stage))throw Error('unsafe plinth script');
const commit=process.argv.includes('--commit-once-keystone-vault-plinth-dormant');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('No GM world tab');
 const receipt=await p.evaluate(async({stage,commit})=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.version!=='14.367'||game.system.id!=='dnd5e'||game.world?.id!=='cabin-in-the-ashen-veil'||
   !game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Wrong current elected GM');
  const vault=game.scenes.get('tjTpG2RVZNoCqRLh'),plinth=vault?.regions.get('CAVB799A5357A114'),
   keystone=game.items.get('CAVKEYSTONEITEM1'),originalStatus=keystone?.getFlag(ns,'cavKeystoneOriginalSource');
  if(!vault||vault.name!=='H-B02 - Secured Keystone Vault'||
   vault.background.src!=='Maps/cabin-in-the-ashen-veil/h-b02-secured-keystone-vault-approved-v003.png'||
   vault.regions.size!==2||!plinth||plinth.behaviors.size!==0||
   plinth.toObject().shapes.length!==1||
   plinth.toObject().shapes[0].x!==705||plinth.toObject().shapes[0].y!==380||
   plinth.toObject().shapes[0].width!==210||plinth.toObject().shapes[0].height!==190)
   throw Error('Original Vault plinth has changed');
  if(!keystone||keystone.uuid!=='Item.CAVKEYSTONEITEM1'||keystone.type!=='loot'||
   keystone.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'||
   originalStatus?.claimStatus!=='NOT_CLAIMED'||
   originalStatus?.intendedVaultPlinthRegionUuid!==plinth.uuid||
   game.actors.contents.some(a=>a.items.some(i=>i.name==='Keystone')))
    throw Error('Original newly authorized Keystone source not in GM custody');
  if(stage._id!=='CAVVKEYPLINTH001'||stage.disabled!==true||
   stage.flags[ns].cavKeystonePlinthStage.originalKeystoneSourceUuid!==keystone.uuid||
   stage.system.source.includes('createEmbeddedDocuments')||
   stage.system.source.includes('setFlag('))throw Error('Unsafe script or source');
  const v={world:game.world.id,electedGM:game.user.name,
   sceneUuid:vault.uuid,regionUuid:plinth.uuid,
   originalRegionBehaviors:plinth.behaviors.size,
   sourceUuid:keystone.uuid,actorKeystoneCopies:0,stageBehaviorId:stage._id,
   currentVaultRegions:vault.regions.size,
   willRemainDisabled:true};
  if(!commit)return{status:'GM-plinth-native-staging-no-write-preflight-pass',v};
  const made=await plinth.createEmbeddedDocuments('RegionBehavior',[stage],{keepId:true});
  const one=plinth.behaviors.get('CAVVKEYPLINTH001');
  if(made?.length!==1||!one||one.disabled!==true||one.type!=='executeScript'||
    one.system.source!==stage.system.source||
    one.getFlag(ns,'cavKeystonePlinthStage')?.status!=='dormant-vault-still-locked'||
    plinth.behaviors.size!==1)throw Error('Partial plinth install, STOP and do not retry');
  return{status:'one-disabled-original-keystone-vault-plinth-behavior-installed',v,
   installed:{uuid:one.uuid,disabled:one.disabled,sourceChars:one.system.source.length,
    sourceUuid:one.getFlag(ns,'cavKeystonePlinthStage')?.originalKeystoneSourceUuid},
   originalVaultUnchanged:game.scenes.get('tjTpG2RVZNoCqRLh').regions.size===2};
 },{stage,commit});
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t24-keystone-plinth-native-install.json';
 writeFileSync(out,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}finally{await b.close()}