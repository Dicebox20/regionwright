import{chromium}from'playwright-core';
import{writeFileSync}from'node:fs';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-sune-east-route-native-staging.js').href);
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('Exact GM page absent');
const x=await p.evaluate(({sourceStages})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('GM/world mismatch');
 const studio=game.scenes.get('CAVHU07Scene0001'),work=game.scenes.get('CAVHU08Scene0001');
 return{
  world:game.world.id,gm:game.user.name,
  studio:{id:studio.id,name:studio.name,map:studio.background.src,
   regionCount:studio.regions.size,
   vanity:{uuid:studio.regions.get('CAVVANITYREG0001')?.uuid,
    behaviorActive:studio.regions.get('CAVVANITYREG0001')?.behaviors.get('CAVVANITYBEH0001')?.disabled===false},
   galleryPortalActive:studio.regions.get('VM6Kcyhrhgh55uFJ')?.behaviors.get('4Yqj8PlTMqwQTKSm')?.disabled===false,
   galleryArrivalPassive:studio.regions.get('RjThT2Q19mYKv6DS')?.behaviors.size===0},
  workshop:{id:work.id,name:work.name,map:work.background.src,
   regionCount:work.regions.size,
   wickActive:work.regions.get('CAVBE5639AEC2179')?.behaviors.get('CAVWICKSHELFBEH1')?.disabled===false,
   originalTablePassive:work.regions.get('CAVB78B258E0A0BB')?.behaviors.size===0},
  stages:sourceStages.map(q=>{
   const scene=game.scenes.get(q.sceneId),r=scene?.regions.get(q.id),v=q.behaviorId?r?.behaviors.get(q.behaviorId):null;
   return{id:q.id,sceneId:q.sceneId,kind:q.kind,uuid:r?.uuid,
    name:r?.name,shapes:r?.toObject().shapes,
    behaviorCount:r?.behaviors.size,
    behavior:v?.toObject()||null,
    fixture:r?.getFlag(ns,'cavLateSuneEastFixture'),
    rewardLedger:r?.getFlag(ns,'cavLateSuneAltarReading')??null};
  }),
  prayers:['5jwy75XyFezukf3b','GXLYq6Tf4OgPNbkU'].map(id=>{
   const item=game.items.get(id);return{itemUuid:item?.uuid,library:item?.getFlag(ns,'cabinPuzzleItem')?.status,
    journal:item?.getFlag(ns,'cavFullPrayerJournalUuid')}
  }),
  playerPrayerCopies:game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>
   /Prayer of Protection|Prayer of Devotion/.test(i.name)).map(i=>({actor:a.id,name:i.name}))),
  previousGazeboIgnition:game.scenes.get('CAVEXT05Scene001')?.regions.get('CAVEXT05LANTERN1')?.behaviors.get('CAVLANTERNIGNIT1')?.disabled===false
 };
},{sourceStages:cfg.STAGES});
const stages=x.stages.map((z,i)=>{
 const expected=cfg.STAGES[i],r=z.shapes?.[0],beh=z.behavior,actual=beh?.system||{};
 const matching=!!z.uuid&&z.id===expected.id&&
  z.fixture?.status==='dormant-uncommissioned'&&
  z.fixture?.kind===expected.kind&&z.rewardLedger===null&&
  r?.type==='rectangle'&&r.x===expected.rect.x&&r.y===expected.rect.y&&
  r.width===expected.rect.width&&r.height===expected.rect.height&&
  (expected.behaviorId?z.behaviorCount===1&&beh?._id===expected.behaviorId&&
   beh.disabled===true&&beh.type===expected.behaviorKind&&
   (expected.behaviorKind==='executeScript'?
    actual.source===cfg.nativeAltarInformationOnlySource():
    JSON.stringify(actual.destinations)===JSON.stringify(cfg.teleportBehaviorData(expected).system.destinations)&&
    actual.placement==='center'&&actual.choice===true):
   z.behaviorCount===0);
 return{kind:z.kind,uuid:z.uuid,behaviorId:beh?._id||null,disabled:beh?.disabled??null,
  destination:actual.destinations||null,sourceHash:actual.source?sha(actual.source):null,
  expectedSourceHash:expected.behaviorKind==='executeScript'?sha(cfg.nativeAltarInformationOnlySource()):null,
  verified:matching,rect:r&&[r.x,r.y,r.width,r.height]};
});
const pass=cfg.physicalPlanInvariant()&&
 x.studio.regionCount===6&&x.workshop.regionCount===4&&
 x.studio.map===cfg.STUDIO.art&&x.workshop.map===cfg.WORKSHOP.art&&
 x.studio.vanity.behaviorActive&&x.studio.galleryPortalActive&&x.studio.galleryArrivalPassive&&
 x.workshop.wickActive&&x.workshop.originalTablePassive&&
 x.previousGazeboIgnition&&x.playerPrayerCopies.length===0&&
 x.prayers.every(q=>q.library==='GM_LIBRARY_ONLY'&&q.journal)&&stages.every(z=>z.verified);
const report={pass,world:x.world,gm:x.gm,
 originalStudioVanityPreserved:x.studio.vanity.behaviorActive,
 originalGalleryTravelPreserved:x.studio.galleryPortalActive&&x.studio.galleryArrivalPassive,
 originalWorkshopWickPreserved:x.workshop.wickActive,
 gazeboStillPreserved:x.previousGazeboIgnition,
 prayerCustodyStillGMOnly:true,
 actorPrayerCopyCount:x.playerPrayerCopies.length,
 disabledNativeBehaviorCount:stages.filter(z=>z.disabled===true).length,
 stages};
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn21-sune-east-independent-postread-20261026.json';
writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
if(!pass)throw Error('Independent original GM readback FAILED; no installer replay');
}finally{await b.close()}