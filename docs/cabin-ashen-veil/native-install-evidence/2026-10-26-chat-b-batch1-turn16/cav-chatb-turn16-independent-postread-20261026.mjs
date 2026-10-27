import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const m=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-gazebo-native-ignition-eye.js').href);
const earlier=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-batch1-native-region-scripts.js').href);
const hash=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Missing original Foundry GM tab');
 const current=await p.evaluate(()=>{
  const ns='dicebox-campaign-helper';
  if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
   game.version!=='14.367'||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)
   throw Error('Wrong active elected GM/world');
  const s=game.scenes.get('CAVEXT05Scene001');
  const lantern=s?.regions.get('CAVEXT05LANTERN1');
  const marker=s?.regions.get('CAVEXT05EYE2MARK');
  const tile=s?.tiles.get('CAVEXT05EYE2TILE');
  const eye=game.items.get('QIH1ugEWGOO1U6LN');
  const behavior=(reg,id)=>{const b=reg?.behaviors.get(id);return{
   id:b?.id,uuid:b?.uuid,type:b?.type,disabled:b?.disabled,
   source:b?.system?.source,events:Array.from(b?.system?.events||[])}};
  return {
    world:game.world.id,gm:game.user.name,
    sceneBackground:s?.background.src,
    eyeOriginal:eye?{uuid:eye.uuid,name:eye.name,img:eye.img,status:eye.getFlag(ns,'cabinPuzzleItem')?.status}:null,
    lantern:{uuid:lantern?.uuid,name:lantern?.name,behaviorCount:lantern?.behaviors.size,
       original:behavior(lantern,'CAVLANTERNBEH001'),
       ignition:behavior(lantern,'CAVLANTERNIGNIT1'),
       ledgers:['cavLateGazeboOil','cavLateGazeboWick','cavLateGazeboIgnition'].map(k=>({key:k,status:lantern?.getFlag(ns,k)?.status??'none'}))},
    marker:{uuid:marker?.uuid,name:marker?.name,
      shapes:marker?.toObject().shapes,
      behaviorCount:marker?.behaviors.size,
      claim:behavior(marker,'CAVEXT05EYE2BEH1'),
      flags:marker?.getFlag(ns,'cavLateEyeMarker'),
      markerStatus:marker?.getFlag(ns,'cavLateEyeTwoMarker'),
      reward:marker?.getFlag(ns,'cavLateEyeTwoClaim')??null},
    tile:{uuid:tile?.uuid,hidden:tile?.hidden,x:tile?.x,y:tile?.y,width:tile?.width,height:tile?.height,img:tile?.texture?.src},
    actorEyeCopies:game.actors.contents.flatMap(a=>a.items.filter(i=>
      i.name===eye?.name||i.getFlag(ns,'cavLateGazeboEye2SourceUuid')===eye?.uuid).map(i=>({actor:a.id,item:i.id}))),
    originalWickBehaviorIntact:game.scenes.get('CAVHU08Scene0001')?.regions.get('CAVBE5639AEC2179')?.behaviors.get('CAVWICKSHELFBEH1')?.disabled===false,
    originalSG01WinderIntact:game.scenes.get('CAVSG01Scene0001')?.regions.get('gksvZIqj8jWdqzn7')?.behaviors.get('7nHv3rf66mG8PJJS')?.disabled===false
  };
 });
 const prev=earlier.nativeBatch1Script('lantern').trim(),
       ignite=m.gazeboNativeBehaviorSource('ignite').trim(),
       claim=m.gazeboNativeBehaviorSource('claim').trim();
 const report={
  world:current.world,gm:current.gm,pass:false,
  srcHashes:{parts:hash(current.lantern.original.source||''),partsExpected:hash(prev),
    ignite:hash(current.lantern.ignition.source||''),igniteExpected:hash(ignite),
    eyeClaim:hash(current.marker.claim.source||''),eyeClaimExpected:hash(claim)},
  documents:{
    lanternUuid:current.lantern.uuid,lanternBehaviors:current.lantern.behaviorCount,
    markerUuid:current.marker.uuid,markerBehaviorUuid:current.marker.claim.uuid,
    tileUuid:current.tile.uuid,hidden:current.tile.hidden,
    markerShape:current.marker.shapes,
    markerLedger:current.marker.markerStatus,eyeCopies:current.actorEyeCopies.length,
    originalWickIntact:current.originalWickBehaviorIntact,
    originalWinderIntact:current.originalSG01WinderIntact,
    originalEye:current.eyeOriginal?.uuid},
  story:current.lantern.ledgers
 };
 report.pass=current.sceneBackground===m.GAZEBO_APPROVED_MAP&&
   current.eyeOriginal?.uuid===m.GAZEBO_EYE_SOURCE&&
   current.eyeOriginal?.status==='GM_LIBRARY_ONLY'&&
   current.lantern.behaviorCount===2&&
   current.lantern.original.disabled===false&&current.lantern.ignition.disabled===false&&
   current.lantern.original.source===prev&&current.lantern.ignition.source===ignite&&
   current.marker.behaviorCount===1&&current.marker.claim.disabled===false&&
   current.marker.claim.source===claim&&
   current.marker.markerStatus?.status==='hidden'&&
   current.marker.markerStatus.sourceUuid===m.GAZEBO_EYE_SOURCE&&
   current.marker.flags?.status==='original-hidden-fixture'&&
   current.marker.shapes?.length===1&&
   current.marker.shapes[0].x===m.GAZEBO_MARKER_RECT.x&&
   current.marker.shapes[0].y===m.GAZEBO_MARKER_RECT.y&&
   current.tile.hidden===true&&current.tile.img===current.eyeOriginal.img&&
   current.tile.x===m.GAZEBO_EYE_VISUAL.x&&current.tile.y===m.GAZEBO_EYE_VISUAL.y&&
   current.marker.reward===null&&current.actorEyeCopies.length===0&&
   current.lantern.ledgers.every(x=>x.status==='none')&&
   current.originalWickBehaviorIntact&&current.originalSG01WinderIntact;
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn16-independent-postread-20261026.json';
 writeFileSync(out,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 if(!report.pass)throw Error('Independent Foundry eye-native postread mismatch');
}finally{await b.close()}