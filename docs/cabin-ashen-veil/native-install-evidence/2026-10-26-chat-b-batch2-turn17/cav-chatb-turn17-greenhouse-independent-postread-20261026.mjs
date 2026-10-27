import{chromium}from'playwright-core';
import{writeFileSync}from'node:fs';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
const module=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-greenhouse-native-lye-mixer.js').href);
const hash=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('Missing exact elected GM game page');
const r=await p.evaluate(()=>{
const ns='dicebox-campaign-helper';
if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
 !game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Wrong GM/world');
const s=game.scenes.get('CAVEXT06Scene001'),reg=s?.regions.get('CAVB6E433D528867'),beh=reg?.behaviors.get('CAVEXT06LYEMIX01');
const lye=game.items.get('vDR4cJU35iODR6gh'),plant=game.items.get('YNWpGEGB17mqDFWe');
const water=game.scenes.get('CAVAQ01Scene0001')?.regions.get('kmPmr5ijLCEOJNk3');
const first=game.scenes.get('CAVAQ01Scene0001')?.regions.get('woZ98KXx0RsWIPpl');
return{world:game.world.id,gm:game.user.name,
scene:{id:s?.id,name:s?.name,map:s?.background.src},
region:{id:reg?.id,uuid:reg?.uuid,name:reg?.name,behaviorCount:reg?.behaviors.size,shapes:reg?.toObject().shapes},
behavior:{uuid:beh?.uuid,type:beh?.type,disabled:beh?.disabled,
 source:beh?.system?.source,events:Array.from(beh?.system?.events||[])},
originalItems:[lye,plant].map(i=>({id:i?.id,uuid:i?.uuid,name:i?.name,flag:i?.getFlag(ns,'cabinPuzzleItem')?.status})),
ledgers:{mix:reg?.getFlag(ns,'cavLateGreenhouseMix')??null,
 reward:reg?.getFlag(ns,'cavLatePlantKillerClaim')??null,
 waterworks:water?.getFlag(ns,'cavWaterworksRestore')??null,
 soapCaseCount:Array.from(game.scenes).flatMap(s=>Array.from(s.regions).filter(x=>x.getFlag(ns,'cavLateSoapCase')?.canonCode==='BATH-02')).length},
actorRewards:game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>i.name==='Plant Killer'||i.getFlag(ns,'cavLatePlantKillerSourceUuid')==='Item.YNWpGEGB17mqDFWe').map(i=>({actor:a.id,item:i.id}))),
firstChaseDisabled:first?.behaviors.get('CAVAQCHASETRIG01')?.disabled===true,
priorNW:intact(),
priorGazebo:game.scenes.get('CAVEXT05Scene001')?.regions.get('CAVEXT05LANTERN1')?.behaviors.get('CAVLANTERNIGNIT1')?.disabled===false};
function intact(){return game.scenes.get('CAVSG01Scene0001')?.regions.get('gksvZIqj8jWdqzn7')?.behaviors.get('7nHv3rf66mG8PJJS')?.disabled===false}
});
const orig=module.greenhouseNativeSource().trim(),current=r.behavior?.source?.trim();
const report={pass:false,world:r.world,gm:r.gm,
sourceSHA256:hash(current||''),expectedSourceSHA256:hash(orig),
sourceMatch:current===orig,
behaviorUuid:r.behavior?.uuid,enabled:r.behavior?.disabled===false,
nativeEvents:r.behavior?.events,regionUuid:r.region.uuid,
originalItems:r.originalItems,ledgers:r.ledgers,actorRewardCount:r.actorRewards.length,
firstChaseDisabled:r.firstChaseDisabled,
nwWinderPreserved:r.priorNW,gazeboIgnitionPreserved:r.priorGazebo};
report.pass=report.sourceMatch&&report.enabled&&r.behavior.type==='executeScript'&&
r.region.behaviorCount===1&&r.region.shapes.length===1&&
r.region.shapes[0].x===1450&&r.region.shapes[0].y===330&&
r.scene.map===module.GREENHOUSE_APPROVED_ART&&
r.originalItems.length===2&&
r.originalItems[0].uuid===module.ORIGINAL_QUEST_LYE&&
r.originalItems[1].uuid===module.ORIGINAL_PLANT_KILLER&&
r.originalItems.every(x=>x.flag==='GM_LIBRARY_ONLY')&&
r.ledgers.mix===null&&r.ledgers.reward===null&&r.ledgers.waterworks===null&&
r.ledgers.soapCaseCount===0&&r.actorRewards.length===0&&
r.firstChaseDisabled&&r.priorNW&&r.priorGazebo;
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn17-greenhouse-independent-postread-20261026.json';
writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(!report.pass)throw Error('Independent native GM verification failed');
}finally{await b.close()}