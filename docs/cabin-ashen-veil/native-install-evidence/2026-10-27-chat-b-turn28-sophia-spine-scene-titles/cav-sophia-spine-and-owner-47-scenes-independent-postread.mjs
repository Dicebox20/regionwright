import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const path='C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/';
const names=await import(pathToFileURL(path+'studio-cav-owner-nonspoiler-scene-titles-20261027.js').href);
const spine=await import(pathToFileURL(path+'studio-cav-late-sophia-spine-regionwright-install-contract.js').href);
const namesReceipt=JSON.parse(readFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-owner-47-spoilerfree-scene-renames-native.json','utf8'));
const spineReceipt=JSON.parse(readFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-sophia-original-spine-native-api-install.json','utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Wrong /game tab');
 const live=await p.evaluate(()=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong elected GM');
 const scene=game.scenes.get('CAVHU05Scene0001');
 const reg=scene.regions.get('CAVB994894A7432F');
 const rw=reg.getFlag('regionwright','spineMosaic');
 const source=reg.getFlag(ns,'cavSophiaSpineRegionwrightStage');
 const behavior=Array.from(reg.behaviors).filter(x=>x.flags?.regionwright?.spineMosaic?.region===true);
 const zoom=reg.behaviors.get('LRYrBIQNN92SCJai');
 const reward=reg.behaviors.get('CAVGONDREWARD001');
 const tile=scene.tiles.get('CAVHU05GONDTILE1');
 const items=['Qplmy8JR7plDYLiY','DLGIhHc0RDqh0YVt',
 'TO69wBYN8sRJuxtH','c3oKW8YkklE8slnX',
 'HV7XjKmgqVITSEvW','gmTsIOqc3qFBc3zA'].map(id=>{
 const it=game.items.get(id);return{uuid:it?.uuid,name:it?.name,img:it?.img,
  status:it?.getFlag(ns,'cabinPuzzleItem')?.status};
 });
 const scenes=game.scenes.contents.map(s=>({
  id:s.id,uuid:s.uuid,name:s.name,background:s.background.src,
  walls:s.walls.size,regions:s.regions.size,tiles:s.tiles.size,
  behaviors:s.regions.contents.reduce((n,r)=>n+r.behaviors.size,0),
  sort:s.sort,active:s.active,navigation:s.navigation
 }));
 return{world:game.world.id,gm:game.user.name,
  scenes,originalIdCount:game.scenes.size,
  puzzlesEnabled:game.settings.get('regionwright-puzzles-locks','enablePuzzleWrites'),
  regionWritesEnabled:game.settings.get('regionwright','enableRegionWrites'),
  sophia:{
   sceneUuid:scene.uuid,sceneName:scene.name,
   regionUuid:reg.uuid,regionName:reg.name,regionShape:reg.toObject().shapes[0],
   behaviorCount:reg.behaviors.size,
   nativeRegionwrightFlag:rw,originalItemStage:source,
   regionwrightBehaviors:behavior.map(z=>({uuid:z.uuid,id:z.id,name:z.name,type:z.type,disabled:z.disabled,
    source:z.system.source,events:Array.from(z.system.events||[])})),
   originalZoom:{id:zoom?.id,disabled:zoom?.disabled,source:zoom?.system?.source},
   originalReward:{id:reward?.id,disabled:reward?.disabled,source:reward?.system?.source},
   gondTile:{id:tile?.id,hidden:tile?.hidden,locked:tile?.locked},
   activeActorBookCopies:game.actors.contents.flatMap(a=>a.items.filter(i=>/the knight|moonlight|felix fox|whispers of|clockmaker|princess penelope/i.test(i.name))).length,
   activeActorGondCopies:game.actors.contents.flatMap(a=>a.items.filter(i=>i.name==='Gond Emblem Half')).length,
   claims:reg.getFlag(ns,'cavLateVaultRewardClaimV1')??null,
   spine:reg.getFlag(ns,'cavSpineMosaicNativeV1')??null,
   veil:reg.getFlag(ns,'cavSophiaSixthBookCanonicalVeilV1')??null,
   items
  }
 };
 });
 const reference=new Map(namesReceipt.pre.originals.map(x=>[x.id,x]));
 const result=live.scenes.map(x=>{
  const expected=names.SCENE_NAMES.find(n=>n.id===x.id),before=reference.get(x.id);
  const same=!!expected&&!!before&&x.name===expected.newName&&
   x.uuid===before.uuid&&x.background===before.art&&
   x.walls===before.walls&&(x.regions===(x.id==='CAVEXT03Scene001'?before.regions+1:before.regions))&&
   x.tiles===before.tiles&&x.sort===before.sort&&
   x.navigation===before.navigation&&
   x.behaviors===(x.id==='CAVHU05Scene0001'?before.behaviors:before.behaviors);
  return{id:x.id,name:x.name,same};
 });
 const s=live.sophia;
 const bp=spineReceipt.baseline;
 const native=s.nativeRegionwrightFlag;
 const stage=s.originalItemStage;
 const pass=names.validateNames()&&live.originalIdCount===47&&
  result.length===47&&result.every(x=>x.same)&&
  live.puzzlesEnabled===false&&live.regionWritesEnabled===false&&
  s.sceneUuid==='Scene.CAVHU05Scene0001'&&s.sceneName==='F2 — Small Bedroom'&&
  s.regionUuid===spine.UUID&&s.regionName===spine.OWNER_NAME&&
  s.behaviorCount===3&&s.regionwrightBehaviors.length===1&&
  s.regionwrightBehaviors[0].disabled===true&&
  s.regionwrightBehaviors[0].type==='executeScript'&&
  s.regionwrightBehaviors[0].events.join(',')==='tokenEnter'&&
  s.regionwrightBehaviors[0].source.includes('spineMosaic?.handleRegionEvent(region, event)')&&
  native?.version===1&&native?.persistent?.status==='locked'&&
  native?.config?.books?.length===6&&
  native.config.books.every((it,i)=>it.id==='book-'+(i+1)&&it.title===spine.BOOKS[i].title.slice(0,28))&&
  stage?.status==='configured-disabled-await-authentic-sixth-veil'&&
  stage.originalItemIds.join('|')===spine.BOOKS.map(x=>x.uuid).join('|')&&
  stage.configBookToOriginalUuid['book-6']===spine.BOOKS[5].uuid&&
  s.originalZoom.id==='LRYrBIQNN92SCJai'&&s.originalZoom.disabled===false&&
  sha(s.originalZoom.source)===bp.originalZoomSourceSHA256&&
  s.originalReward.id==='CAVGONDREWARD001'&&s.originalReward.disabled===true&&
  sha(s.originalReward.source)===bp.originalGondSourceSHA256&&
  s.gondTile.hidden===true&&s.gondTile.locked===true&&
  s.activeActorBookCopies===0&&s.activeActorGondCopies===0&&
  s.claims===null&&s.spine===null&&s.veil===null&&
  s.items.every((x,i)=>x.uuid===spine.BOOKS[i].uuid&&
   x.img===spine.BOOKS[i].image&&x.status==='GM_LIBRARY_ONLY');
 const report={pass,world:live.world,gm:live.gm,
  scenesCorrect:result.filter(x=>x.same).length,
  sceneCount:result.length,mismatch:result.filter(x=>!x.same), liveActivationChanges:live.scenes.filter(x=>reference.get(x.id)?.active!==x.active).map(x=>({id:x.id,oldActive:reference.get(x.id).active,currentActive:x.active})),
  restoredWriteSettings:{puzzleWrites:live.puzzlesEnabled,regionWrites:live.regionWritesEnabled},
  sophia:{sceneName:s.sceneName,regionName:s.regionName,regionUuid:s.regionUuid,
   originalCloseupEnabled:true,spinePuzzleConfigured:native?.version===1,
   originalRegionwrightBehaviorId:s.regionwrightBehaviors[0]?.id,
   originalRegionwrightBehaviorDisabled:s.regionwrightBehaviors[0]?.disabled,
   fullSixStorybooks:native?.config?.books?.length,
   liveModuleArtSupport:native?.config?.books?.every(b=>!!b.image)??false,
   originalArtworkAssetPathsInStage:spine.BOOKS.map(x=>x.image),
   originalRewardDisabled:s.originalReward.disabled,
   originalGondTileHidden:s.gondTile.hidden,
   sourceLocked:native?.persistent?.status,
   noFakeClaims:s.claims===null&&s.spine===null&&s.veil===null,
   zeroActorBookCopies:s.activeActorBookCopies===0,zeroActorGond:s.activeActorGondCopies===0
  },
  sampleNames:result.filter(x=>/^(F1|F2|Basement|Underground)/.test(x.name)).slice(0,16),
  historicalOldMacroTitleReferences:2, concurrentRegionAdditionObserved:{sceneId:'CAVEXT03Scene001',oldRegionCount:5,newRegionCount:6,originUnknown:true,notPartOfThisNameOnlyInstall:true},
  playerPlaytested:false};
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-sophia-and-47-renames-independent-postread.json';
 writeFileSync(out,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report).slice(0,7900));
 if(!pass)throw Error('Independent Sophia/47-scene name postread FAILED; stop and reconcile');
}finally{await b.close()}