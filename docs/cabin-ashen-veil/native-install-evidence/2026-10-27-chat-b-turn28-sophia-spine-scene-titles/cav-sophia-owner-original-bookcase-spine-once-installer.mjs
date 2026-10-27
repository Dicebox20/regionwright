import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const src='C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/';
const cfg=await import(pathToFileURL(src+'studio-cav-late-sophia-spine-regionwright-install-contract.js').href);
const commit=process.argv.includes('--commit-once-regionwright-real-six-book-spine-disabled');
const hash=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact Foundry /game GM tab missing');
 const result=await p.evaluate(async({manifest,commit})=>{
 const ns='dicebox-campaign-helper',F='regionwright';
 const world='cabin-in-the-ashen-veil',sceneId=manifest.sceneId,regId=manifest.regionId;
 if(!game.ready||game.version!=='14.367'||game.system.id!=='dnd5e'||
  game.world?.id!==world||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)
  throw Error('Wrong world/elected GM/system');
 const mod=game.modules.get('regionwright-puzzles-locks'),api=mod?.api?.spineMosaic;
 if(!mod?.active||mod.version!=='0.1.2'||typeof api?.configure!=='function'||
  typeof api?.createConfig!=='function'||typeof api?.open!=='function')
  throw Error('Actual native Regionwright Puzzles & Locks API not available');
 const scene=game.scenes.get(sceneId),reg=scene?.regions.get(regId);
 if(scene?.name!=='H-U05 - Sophias Bedroom'||scene?.background.src!==manifest.map||
  scene?.width!==1536||scene?.height!==1024||scene?.regions.size!==4||
  reg?.uuid!==manifest.uuid||reg?.behaviors.size!==2||
  reg?.getFlag(F,'spineMosaic')!==undefined)
  throw Error('Owner approved H-U05 exact original unconfigured Region changed');
 if(reg.name!=='Sophia Bedroom ? bookcase observation'&&
  reg.name!=='Sophia Bedroom – bookcase observation'&&
  reg.name!=='Sophia Bedroom — bookcase observation')
  throw Error('Original bookcase observed name changed; verify source before rename');
 const shape=reg.toObject().shapes[0];
 if(reg.toObject().shapes.length!==1||shape.type!=='rectangle'||
  shape.x!==930||shape.y!==135||shape.width!==220||shape.height!==170)
  throw Error('Owner-approved bookcase geometry changed');
 const zoom=reg.behaviors.get('LRYrBIQNN92SCJai'),reward=reg.behaviors.get('CAVGONDREWARD001');
 if(!zoom||zoom.type!=='executeScript'||zoom.disabled!==false||
 !zoom.system.source.includes('Sophia bookcase: owner-approved zoom')||
 !reward||reward.disabled!==true||reward.type!=='executeScript'||
 reward.getFlag(ns,'cavSophiaOriginalGondSource')?.status!=='dormant-await-authentic-six-book-veil')
 throw Error('Original working closeup or T27 reward source changed');
 const tile=scene.tiles.get('CAVHU05GONDTILE1');
 if(scene.tiles.size!==1||!tile||tile.hidden!==true||
  tile.getFlag(ns,'cavSophiaGondCompartmentVisual')?.status!=='hidden-original-bookcase')
 throw Error('Original in-bookcase hidden Gond half reward missing/visible unexpectedly');
 const source=game.items.get('o9G3UJjEe2QX1ZH0');
 if(source?.uuid!=='Item.o9G3UJjEe2QX1ZH0'||source.name!=='Gond Emblem Half'||
 source.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')throw Error('Gond Item source modified');
 const books=manifest.books.map(x=>game.items.get(x.uuid.slice(5)));
 if(books.some((it,i)=>it?.uuid!==manifest.books[i].uuid||
 it.name.replaceAll('’',"'")!==manifest.books[i].title||
 it.img!==manifest.books[i].image||it.type!=='loot'||
 it.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'))
 throw Error('Six originals no longer match owner Item art/year source manifest');
 if(game.actors.contents.some(a=>a.items.some(i=>i.name==='Gond Emblem Half'||manifest.books.some(q=>i.name===q.title))))
 throw Error('Party already has quest books/half; reconcile first');
 if(reg.getFlag(ns,'cavSpineMosaicNativeV1')||reg.getFlag(ns,'cavSpineCompartmentNativeV1')||
    reg.getFlag(ns,'cavSophiaSixthBookCanonicalVeilV1')||
    reg.getFlag(ns,'cavLateVaultRewardClaimV1')||
    reg.getFlag(ns,'cavSophiaSpineRegionwrightStage'))
 throw Error('Spine/Veil/reward progression already present, stop');
 const anyNonGmInScene=game.users.contents.some(u=>u.active&&!u.isGM&&u.viewedScene===sceneId);
 if(anyNonGmInScene)throw Error('NonGM player viewing Sophia Scene during global setting toggle; stop');
 const originalPuzzleSetting=game.settings.get('regionwright-puzzles-locks','enablePuzzleWrites');
 const originalRegionSetting=game.settings.get('regionwright','enableRegionWrites');
 if(originalPuzzleSetting!==false||originalRegionSetting!==false)
 throw Error('Puzzle write guard settings changed; stop');
 const proposed=api.createConfig({books:manifest.books.map(x=>({title:x.title,image:x.image})),seed:manifest.seed});
 if(proposed.version!==1||proposed.books.length!==6||
  proposed.solution.length!==6||proposed.solution.some((x,i)=>x!=='book-'+(i+1))||
  proposed.books.some((bk,i)=>bk.id!=='book-'+(i+1)||(bk.image!==undefined&&bk.image!==''&&bk.image!==manifest.books[i].image)||
    bk.title!==manifest.books[i].title.slice(0,28)))
 throw Error('Native Regionwright Spine config not stable: '+JSON.stringify({proposed,original:manifest.books.map(x=>({title:x.title,image:x.image}))}));
 const flag={
  version:1,status:'configured-disabled-await-authentic-sixth-veil',
  originalBookcaseUuid:reg.uuid,originalItemIds:manifest.books.map(x=>x.uuid),
  originalPublicationYears:manifest.books.map(x=>x.year),
  configBookToOriginalUuid:Object.fromEntries(proposed.books.map((book,i)=>[book.id,manifest.books[i].uuid])),
  originalCloseupBehaviorId:'LRYrBIQNN92SCJai',
  originalGondRewardBehaviorId:'CAVGONDREWARD001',
  originalGondTileId:'CAVHU05GONDTILE1',
  originalGondWorldItemUuid:'Item.o9G3UJjEe2QX1ZH0',
  nativeSpineCompletionVerified:false,nativeVeilSixthPickupVerified:false,
  rewardGranted:false,nativePlayerTested:false,originalRegionwrightApiUsed:true
 };
 const baseline={world:game.world.id,gm:game.user.name,
  originalRegionUuid:reg.uuid,originalName:reg.name,originalRegionCount:scene.regions.size,
  originalBehaviorCount:reg.behaviors.size,originalZoomId:zoom.id,
  originalZoomSource:zoom.system.source,originalGondSource:reward.system.source,
  originalGondTile:tile.id,originalTileHidden:tile.hidden,
  originalPuzzleSetting,originalRegionSetting,originalGondActors:0,
  sixBooks:books.map(x=>({uuid:x.uuid,img:x.img,name:x.name})),
  expectedNativeConfig:proposed,expectedSourceFlag:flag,installedModuleImagesSupported:proposed.books.every(b=>!!b.image),
  noActiveNonGmInScene:!anyNonGmInScene};
 if(!commit)return{status:'Sophia-owner-exact-original-Spine-native-api-dry-run-pass-no-writes',baseline};
 // Established Regionwright configure() is authoritative. The module requires
 // temporarily enabling BOTH write settings. Restore in finally even on error.
 let changedPuzzle=false,changedRegion=false;
 try{
  await game.settings.set('regionwright-puzzles-locks','enablePuzzleWrites',true);
  changedPuzzle=true;
  await game.settings.set('regionwright','enableRegionWrites',true);
  changedRegion=true;
  if(game.settings.get('regionwright-puzzles-locks','enablePuzzleWrites')!==true||
    game.settings.get('regionwright','enableRegionWrites')!==true)
   throw Error('Cannot enable write flags for original supported API; stop');
  const result=await api.configure({target:reg.uuid,
   books:manifest.books.map(x=>({title:x.title,image:x.image})),seed:manifest.seed});
  if(result?.target?.uuid!==reg.uuid||result?.data?.version!==1||
   result?.data?.persistent?.status!=='locked')
   throw Error('Standard native API configure returned ambiguous state, stop and reconcile');
  const owned=Array.from(reg.behaviors).filter(b=>
    b.flags?.regionwright?.spineMosaic?.region===true);
  if(owned.length!==1||owned[0].type!=='executeScript'||
    !owned[0].system.source.includes('spineMosaic?.handleRegionEvent(region, event)'))
   throw Error('Native Regionwright-owned behavior uncertain, stop and reconcile');
  // Fail closed: never allow the baseline puzzle to be solved before real
  // sixth Veil book and authentic original Items have been earned.
  const updated=await reg.updateEmbeddedDocuments('RegionBehavior',[
   {_id:owned[0].id,disabled:true,name:'Sophia Six Storybooks — Regionwright Spine (gated until sixth Veil book)'}]);
  const now=reg.behaviors.get(owned[0].id);
  if(updated?.length!==1||!now||now.disabled!==true)
   throw Error('Spine native auto-enter disable uncertain; stop and independently reconcile');
  await reg.update({
   name:manifest.ownerName,
   ['flags.'+ns+'.cavSophiaSpineRegionwrightStage']:flag
  });
  const native=reg.getFlag(F,'spineMosaic'),stage=reg.getFlag(ns,'cavSophiaSpineRegionwrightStage');
  if(native?.version!==1||native?.persistent?.status!=='locked'||
   native.config?.books?.length!==6||now.disabled!==true||
   stage?.status!=='configured-disabled-await-authentic-sixth-veil'||
   reg.name!==manifest.ownerName||
   reg.behaviors.get('LRYrBIQNN92SCJai')?.system.source!==zoom.system.source||
   reg.behaviors.get('CAVGONDREWARD001')?.disabled!==true||
   scene.tiles.get('CAVHU05GONDTILE1')?.hidden!==true)
   throw Error('Native post-install Region changed or source uncertain, stop and independently reconcile');
  return{status:'Sophia-original-bookcase-native-Regionwright-six-book-registered-and-gated',
   baseline,
   registered:{regionUuid:reg.uuid,name:reg.name,behaviorUuid:now.uuid,
    behaviorDisabled:now.disabled,
    type:now.type,events:Array.from(now.system.events),
    code:now.system.source,nativeConfig:native.config,
    nativePersistentStatus:native.persistent.status,
    rewardDisabled:reg.behaviors.get('CAVGONDREWARD001').disabled,
    originalCloseupEnabled:!reg.behaviors.get('LRYrBIQNN92SCJai').disabled,
    GondTileHidden:scene.tiles.get('CAVHU05GONDTILE1').hidden,
    stageStatus:stage.status
   },noItemGranted:true,noVeilCompletionCreated:true,nativeBookImagesAvailable:proposed.books.every(x=>!!x.image)};
 }finally{
  // Settings restoration has higher priority than all other output.
  // If source partially installed, stop/reconcile independently, never replay.
  if(changedRegion)await game.settings.set('regionwright','enableRegionWrites',originalRegionSetting);
  if(changedPuzzle)await game.settings.set('regionwright-puzzles-locks','enablePuzzleWrites',originalPuzzleSetting);
 }
},{manifest:{
 sceneId:cfg.SCENE_ID,regionId:cfg.BOOKCASE_ID,uuid:cfg.UUID,map:cfg.APPROVED_MAP,
 books:cfg.BOOKS,seed:cfg.SEED,ownerName:cfg.OWNER_NAME
},commit});
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-sophia-original-spine-native-api-install.json';
const baseline=result.baseline;
writeFileSync(out,JSON.stringify({status:result.status,baseline:{
 ...baseline,originalZoomSourceSHA256:hash(baseline.originalZoomSource),
 originalGondSourceSHA256:hash(baseline.originalGondSource),
 originalZoomSource:undefined,originalGondSource:undefined},
 registered:result.registered?{
  ...result.registered,sourceSha256:hash(result.registered.code),code:undefined
 }:undefined,noItemGranted:result.noItemGranted,noVeilCompletionCreated:result.noVeilCompletionCreated
},null,2));
console.log(JSON.stringify({status:result.status,originalBookcase:baseline.originalRegionUuid,
 data:result.registered?{behaviorUuid:result.registered.behaviorUuid,
 disabled:result.registered.behaviorDisabled,status:result.registered.nativePersistentStatus,
 originalZoom:result.registered.originalCloseupEnabled,
 GondRewardDisabled:result.registered.rewardDisabled,
 tileHidden:result.registered.GondTileHidden,stage:result.registered.stageStatus}:undefined,
 settingOriginals:[baseline.originalPuzzleSetting,baseline.originalRegionSetting]}));
}finally{await b.close()}