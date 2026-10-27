import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import{writeFileSync}from'node:fs';
const base='C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/';
const cfg=await import(pathToFileURL(base+'studio-cav-late-vault-socket-native-transactions.js').href);
const staged=await import(pathToFileURL(base+'studio-cav-late-vault-workshop-native-staging.js').href);
const sha=s=>createHash('sha256').update(s).digest('hex');
const commit=process.argv.includes('--commit-once-disabled-authentic-socket-native-sources');
const manifest=Object.entries(cfg.SOCKETS).map(([kind,c])=>{
 const f=staged.FIXTURES.find(x=>x.kind===kind);
 if(!f||f.id!==c.regionId||f.behaviorId!==c.behaviorId)
  throw Error('T25 original fixture mapping drift');
 const desired=cfg.nativeSocketTransactionUpdate(kind);
 const old=staged.nativeBehavior(f);
 return{kind,...c,desired,oldSource:old.system.source,
  sourceSHA256:sha(desired['system.source'])};
});
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(q=>q.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('No exact Foundry game tab');
 const data=await p.evaluate(async({manifest,commit})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users.activeGM?.id!==game.user.id)
  throw Error('Wrong elected GM world');
 const w=game.scenes.get('G6NMonfCwMvNzipL');
 const vault=game.scenes.get('tjTpG2RVZNoCqRLh');
 const foyer=game.scenes.get('CAVHG02Scene0001')?.regions.get('CAVFOYERBASEDR01');
 if(!w||w.name!=='H-B01 - Allens Basement Workshop'||w.regions.size!==8||
 !vault||vault.regions.size!==3||
 w.regions.get('CAVBABA9513F73A3')?.behaviors.get('CAVVTURNBEH00001')?.disabled!==true||
 w.regions.get('CAVVAULTDOOR0001')?.behaviors.get('CAVVOUTTEL000001')?.disabled!==true||
 vault.regions.get('CAVVAULTBACK0001')?.behaviors.get('CAVVBACKTEL00001')?.disabled!==true||
 vault.regions.get('CAVB799A5357A114')?.behaviors.get('CAVVKEYPLINTH001')?.disabled!==true||
 w.regions.get('CAVBASEMENTRET01')?.behaviors.get('CAVBASEMENTPRT01')?.disabled!==false||
 !foyer||foyer.behaviors.get('CAVFOYERBASPORT1')?.disabled!==true)
 throw Error('Original locked Vault and Basement source context changed; STOP');
 const checks=[];
 for(const f of manifest){
  const region=w.regions.get(f.regionId),beh=region?.behaviors.get(f.behaviorId),
    item=game.items.get(f.worldItem.slice(5));
  if(!region||region.behaviors.size!==1||region.getFlag(ns,'cavLateVaultWorkshopFixture')?.status!=='dormant-uncommissioned'||
   region.getFlag(ns,'cavLateVaultSocketTransactionV1')||
   beh?.disabled!==true||beh.type!=='executeScript'||beh.system.source!==f.oldSource||
   beh.getFlag(ns,'cavVaultSocketTransactionStage')||
   !item||item.uuid!==f.worldItem||item.name!==f.name||item.type!=='loot'||
   item.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')
    throw Error('Original socket native fixture or Item drift: '+f.kind);
  const sourceScene=game.scenes.get(f.sourceSceneId);
  if(!sourceScene)throw Error('Original Item source scene does not exist: '+f.kind);
  const provider=Array.from(sourceScene.regions).filter(r=>r.getFlag(ns,'cavLateVaultRewardClaimV1')?.sourceUuid===f.worldItem);
  if(provider.length||game.actors.contents.some(a=>a.items.contents.some(i=>
   i.getFlag(ns,'cavLateVaultRewardProvenanceV1')?.sourceUuid===f.worldItem)))
   throw Error('Upstream source provider is now installed or player source claimed; reconcile before commission');
  if(!f.desired?.disabled||!f.desired['system.source']?.includes('cavLateVaultRewardClaimV1')||
   !f.desired['system.source']?.includes('cavWeatheredBasementUnlocked')||
   !f.desired['system.source']?.includes('cavLateVaultSocketTransactionV1'))
   throw Error('Invalid source code in proposed disabled native socket');
  checks.push({kind:f.kind,region:region.uuid,behavior:beh.uuid,
   sourceUuid:item.uuid,oldSourceChars:beh.system.source.length,
   newSourceChars:f.desired['system.source'].length,
   sourceClaimProvidersCurrentlyConfigured:provider.length,actorQuestCopies:0});
 }
 const original={sourceWorld:game.world.id,electedGM:game.user.name,
  workshopRegions:w.regions.size,vaultRegions:vault.regions.size,
  basementLocked:true,allThreeSourceProvidersMissing:true,
  allOriginalRewardsStillInGMLibrary:true,
  oldVaultTurnDisabled:true,oldVaultPortalsDisabled:true,
  sockets:checks};
 if(!commit)return{status:'original-three-socket-native-source-upgrade-preflight-no-writes-pass',original};
 const updates=manifest.map(f=>({
  _id:f.behaviorId,name:f.desired.name,disabled:true,
  'system.events':f.desired['system.events'],
  'system.source':f.desired['system.source'],
  'flags.dicebox-campaign-helper.cavVaultSocketTransactionStage':{
   version:1,status:'source-installed-disabled-pending-original-producer',
   itemSourceUuid:f.worldItem,sourceSceneId:f.sourceSceneId,
   kind:f.kind,nativePlayerTested:false,
   recipeNeedsOriginalGMRewardBridge:true,
   statusOfVaultDoor:'sealed',noItemGranted:true}
 }));
 // RegionBehavior is embedded on each original Region, not the Workshop Scene.
 // Update one exact Region at a time; any uncertain partial update stops and
 // requires fresh elected-GM reconciliation. NEVER replay the installer.
 const affected=[];
 for(const f of manifest){
  const region=w.regions.get(f.regionId);
  const row=updates.find(u=>u._id===f.behaviorId);
  const docs=await region.updateEmbeddedDocuments('RegionBehavior',[row]);
  if(docs?.length!==1)throw Error('Partial source upgrade, stop without retry');
  affected.push(docs[0]);
 }
 const actual=manifest.map(f=>{
  const region=w.regions.get(f.regionId),b=region?.behaviors.get(f.behaviorId);
  return{kind:f.kind,uuid:b?.uuid,disabled:b?.disabled,
   events:Array.from(b?.system.events||[]),
   sourceMatches:!!b&&b.system.source===f.desired['system.source'],
   stage:b?.getFlag(ns,'cavVaultSocketTransactionStage')?.status};
 });
 if(affected.length!==3||actual.some(x=>!x.sourceMatches||x.disabled!==true||
  x.events.join('|')!=='tokenMoveIn|tokenMoveWithin'||
  x.stage!=='source-installed-disabled-pending-original-producer'))
  throw Error('Partial source patch, STOP and independently reconcile; DO NOT replay');
 if(w.regions.size!==8||v.regions.size!==3||
 w.regions.get('CAVBABA9513F73A3')?.behaviors.get('CAVVTURNBEH00001')?.disabled!==true||
 w.regions.get('CAVVAULTDOOR0001')?.behaviors.get('CAVVOUTTEL000001')?.disabled!==true||
 v.regions.get('CAVVAULTBACK0001')?.behaviors.get('CAVVBACKTEL00001')?.disabled!==true)
  throw Error('Vault source-only patch modified original gate unexpectedly, STOP');
 return{status:'three-original-socket-GM-native-transaction-sources-staged-disabled',
  original,actual,actorItemsGranted:0,vaultStillLocked:true};
 },{manifest,commit});
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t26-vault-three-transaction-sources-install.json';
 writeFileSync(out,JSON.stringify({manifestSHA256:manifest.map(f=>({kind:f.kind,sha:f.sourceSHA256})),...data},null,2));
 console.log(JSON.stringify({...data,manifestSHA256:manifest.map(f=>({kind:f.kind,sha:f.sourceSHA256}))}).slice(0,9000));
}finally{await b.close()}