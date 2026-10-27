import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-original-music-box-prayer-native.js').href);
const source=cfg.musicBoxPrayerNativeSource(),hash=createHash('sha256').update(source).digest('hex');
const commit=process.argv.includes('--commit-original-music-box-prayer-behavior');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(q=>q.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('Exact active GM world missing');
const data=await p.evaluate(async ({source,commit,expected})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('Wrong Foundry elected GM or world');
 const scene=game.scenes.get('CAVHU04Scene0001');
 const hope=scene?.regions.get('CAVHU04HOPECHST1');
 const old=hope?.behaviors.get('CAVHOPECHSTBEH01');
 if(!scene||scene.name!=='H-U04 - Parents Bedroom'||
 scene.background.src!=='Maps/cabin-in-the-ashen-veil/H-U04_Parents_Bedroom_V003_OWNER_APPROVED_CLOSED_WINDOW_2026-10-24.png'||
 scene.width!==1536||scene.height!==1024||scene.regions.size!==5||
 !hope||hope.name!=='H-U04 - Hope Chest (late Silver Key)'||
 hope.behaviors.size!==1||old?.disabled!==false||old.type!=='executeScript'||
 !old.system.source?.includes('cavLateMusicBoxClaim')||
 hope.getFlag(ns,'cavLateBatch1')?.status!=='physical-fixture-staged')
 throw Error('Original Hope source Region/behavior changed; collision or duplicate');
 const rect=hope.toObject().shapes[0];
 if(hope.toObject().shapes.length!==1||rect?.type!=='rectangle'||
 rect.x!==1100||rect.y!==688||rect.width!==185||rect.height!==132)
 throw Error('Original Hope approved shape changed');
 if(hope.behaviors.get(expected.behaviorId)||
    hope.getFlag(ns,expected.claimLedger)||hope.getFlag(ns,'cavLateHopeChestUnlock')||
    hope.getFlag(ns,'cavLateMusicBoxClaim'))
 throw Error('Existing Prayer claim or actual Hope progression changed; must reconcile first');
 const keys=[['IY8fuUG5P0yWIZIh','Silver Tiny Key'],['YaKs6z2AWlEAlyzx','Ornate Music Box'],
 ['5jwy75XyFezukf3b','Prayer of Protection']];
 const originals=keys.map(([id,name])=>{
  const item=game.items.get(id);
  if(!item||item.name!==name||item.type!=='loot'||
    item.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')
   throw Error('Original library Item source changed: '+name);
  return{uuid:item.uuid,name:item.name,originStatus:item.getFlag(ns,'cabinPuzzleItem')?.status};
 });
 const journal=game.journal.get('CAVPRAYERPROTECT');
 if(!journal||journal.uuid!=='JournalEntry.CAVPRAYERPROTECT'||
 journal.pages.size!==1||
 journal.getFlag(ns,'cavFullPrayerOriginalSourceUuid')!=='Item.5jwy75XyFezukf3b'||
 game.items.get('5jwy75XyFezukf3b')?.getFlag(ns,'cavFullPrayerJournalUuid')!=='JournalEntry.CAVPRAYERPROTECT')
 throw Error('Owner-delegated full Prayer Journal or original Item link missing');
 const sg=game.scenes.get('CAVSG01Scene0001');
 const silver=sg?.regions.get('CAVSG01SILVERKEY'),chase=sg?.regions.get('CAVSG01CHASETRG1');
 if(!sg||!silver||!chase||
 silver.behaviors.get('CAVSG01SILVRBEH1')?.disabled!==true||
 chase.behaviors.get('CAVSG01CHASEBEH1')?.disabled!==true)
 throw Error('Silver late stage now changed; preflight invalid');
 if(game.actors.contents.some(a=>Array.from(a.items).some(i=>
  ['Silver Tiny Key','Ornate Music Box','Prayer of Protection'].includes(i.name))))
 throw Error('Original quest Item already on Actor; reconcile actor custody');
 if(source.includes('deleteEmbeddedDocuments')||source.includes('teleportToken')||
   !source.includes('cavLateSecondChaseSilverKeyClaim')||
   !source.includes('cavLateMusicBoxClaim')||
   !source.includes('cavLatePrayerProtectionClaim')||
   !source.includes('cavFullPrayerJournalUuid'))
 throw Error('Unapproved original native source');
 const overview={world:game.world.id,electedGM:game.user.name,sourceScene:scene.id,
  hopeRegion:hope.uuid,originalOldBehavior:old.uuid,existingRegionBehaviors:hope.behaviors.size,
  originalShape:rect,originalItems:originals,
  fullPrayerJournal:journal.uuid,lateChaseDisabled:true,silverMarkerDisabled:true,
  originalActorItemCopies:0,newBehaviorId:expected.behaviorId,scriptLength:source.length};
 if(!commit)return{status:'native-original-music-prayer-integration-preflight-pass-no-writes',overview};
 const made=await hope.createEmbeddedDocuments('RegionBehavior',[{
  _id:expected.behaviorId,name:'Ornate Music Box — GM-guarded authentic Prayer recovery',
  type:'executeScript',disabled:false,
  system:{events:['behaviorViewed','behaviorUnviewed','behaviorDeactivated','tokenMoveIn','tokenMoveWithin'],
   source}
 }],{keepId:true});
 const actual=hope.behaviors.get(expected.behaviorId);
 if(made.length!==1||!actual||actual.type!=='executeScript'||
    actual.disabled!==false||actual.system.source.trim()!==source.trim()||
    hope.behaviors.size!==2||old.disabled!==false)
 throw Error('Partial native behavior installed; STOP without retrying installer');
 return{status:'original-ornate-music-prayer-native-behavior-installed-guarded',overview,
  installed:{uuid:actual.uuid,disabled:actual.disabled,type:actual.type,
   events:Array.from(actual.system.events),sourceLength:actual.system.source.length},
  existingHopeNativeBehaviorPreserved:old.disabled===false};
},{source,commit,expected:{behaviorId:cfg.BEHAVIOR_ID,claimLedger:cfg.CLAIM_LEDGER}});
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn22-original-music-prayer-install-20261026.json';
writeFileSync(out,JSON.stringify({sourceSHA256:hash,...data},null,2));
console.log(JSON.stringify({sourceSHA256:hash,...data}));
}finally{await b.close()}