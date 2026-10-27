import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import{writeFileSync}from'node:fs';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-original-music-box-prayer-native.js').href);
const hash=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(q=>q.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('Exact GM world absent');
const x=await p.evaluate(()=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
   !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('Wrong GM world');
 const s=game.scenes.get('CAVHU04Scene0001'),r=s?.regions.get('CAVHU04HOPECHST1');
 const old=r?.behaviors.get('CAVHOPECHSTBEH01'),added=r?.behaviors.get('CAVPRAYERBOXBEH1');
 const journal=game.journal.get('CAVPRAYERPROTECT');
 const kinds=['IY8fuUG5P0yWIZIh','YaKs6z2AWlEAlyzx','5jwy75XyFezukf3b'].map(id=>{
 const item=game.items.get(id);return{uuid:item?.uuid,name:item?.name,type:item?.type,
 sourceStatus:item?.getFlag(ns,'cabinPuzzleItem')?.status,
 journal:item?.getFlag(ns,'cavFullPrayerJournalUuid')}});
 const silver=game.scenes.get('CAVSG01Scene0001');
 return{world:game.world.id,gm:game.user.name,
 scene:{uuid:s?.uuid,name:s?.name,art:s?.background.src,regionCount:s?.regions.size},
 hope:{uuid:r?.uuid,name:r?.name,shape:r?.toObject().shapes,
 behaviorCount:r?.behaviors.size,
 old:{uuid:old?.uuid,disabled:old?.disabled,type:old?.type,sourceLength:old?.system.source?.length},
 new:{uuid:added?.uuid,disabled:added?.disabled,type:added?.type,
 events:Array.from(added?.system?.events||[]),source:added?.system.source},
 unlock:r?.getFlag(ns,'cavLateHopeChestUnlock')??null,
 musicBox:r?.getFlag(ns,'cavLateMusicBoxClaim')??null,
 prayer:r?.getFlag(ns,'cavLatePrayerProtectionClaim')??null},
 silverStage:{
  chaseDisabled:silver?.regions.get('CAVSG01CHASETRG1')?.behaviors.get('CAVSG01CHASEBEH1')?.disabled===true,
  markerDisabled:silver?.regions.get('CAVSG01SILVERKEY')?.behaviors.get('CAVSG01SILVRBEH1')?.disabled===true},
 originals:kinds,
 journal:{uuid:journal?.uuid,pageCount:journal?.pages.size,
 originalSource:journal?.getFlag(ns,'cavFullPrayerOriginalSourceUuid'),defaultOwnership:journal?.ownership.default},
 actorQuestItems:game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>
  ['Silver Tiny Key','Ornate Music Box','Prayer of Protection'].includes(i.name)).map(i=>({
   actorId:a.id,item:i.id,name:i.name}))),
 studioAltarDisabled:game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVSUNEACTION001')?.behaviors.get('CAVSUNEPRAYBEH01')?.disabled===true,
 studioEastDisabled:game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVSUNEEASTPASS1')?.behaviors.get('CAVSUNEOUTTELE01')?.disabled===true,
 workshopReturnDisabled:game.scenes.get('CAVHU08Scene0001')?.regions.get('CAVWORKRETURN001')?.behaviors.get('CAVWORKBACKTEL01')?.disabled===true,
 vanityActive:game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVVANITYREG0001')?.behaviors.get('CAVVANITYBEH0001')?.disabled===false
 };
});
const expected=cfg.musicBoxPrayerNativeSource();
const checks={
 sourceMatches:x.hope.new.source?.trim()===expected,
 sourceSHA256:hash(x.hope.new.source?.trim()||''),
 sourceExpectedSHA256:hash(expected),
 originalSourceValid:x.originals.every(x=>x.sourceStatus==='GM_LIBRARY_ONLY')&&
 x.originals.map(x=>x.uuid).join('|')===[cfg.ORIGINAL_SILVER,cfg.ORIGINAL_BOX,cfg.ORIGINAL_PRAYER].join('|'),
 activeOriginalHope:x.hope.old.disabled===false&&x.hope.old.type==='executeScript'&&
 x.hope.behaviorCount===2,
 currentNativeActive:x.hope.new.disabled===false&&x.hope.new.type==='executeScript'&&
 x.hope.new.uuid==='Scene.CAVHU04Scene0001.Region.CAVHU04HOPECHST1.RegionBehavior.CAVPRAYERBOXBEH1',
 originalStateUnchanged:x.hope.unlock===null&&x.hope.musicBox===null&&x.hope.prayer===null,
 originalsUngrant:x.actorQuestItems.length===0,
 lateSilverStillDormant:x.silverStage.chaseDisabled&&x.silverStage.markerDisabled,
 fullPrayerJournalSource:x.journal.uuid===cfg.ORIGINAL_JOURNAL&&x.journal.pageCount===1&&
 x.journal.originalSource===cfg.ORIGINAL_PRAYER&&x.originals[2].journal===cfg.ORIGINAL_JOURNAL,
 roomRoutePreserved:x.studioAltarDisabled&&x.studioEastDisabled&&x.workshopReturnDisabled&&x.vanityActive,
 originalSceneName:x.scene.name==='H-U04 - Parents Bedroom'&&x.scene.regionCount===5
};
const report={pass:Object.values(checks).every(Boolean),world:x.world,gm:x.gm,
 hopeRegion:x.hope.uuid,newBehavior:x.hope.new.uuid,oldBehavior:x.hope.old.uuid,
 allChecks:checks,behaviorEvents:x.hope.new.events,
 originalItems:x.originals,prayerLedger:x.hope.prayer,actorQuestCopies:x.actorQuestItems.length,
 notes:'Installed native GM-assisted original box reading handler, fail closed while silver recovery dormant. No player test.'};
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn22-music-prayer-independent-postread-20261026.json';
writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
if(!report.pass)throw Error('Independent elected-GM native source readback failed');
}finally{await b.close()}