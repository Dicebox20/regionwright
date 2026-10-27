import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const mod=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-greenhouse-native-lye-mixer.js').href);
const originalSource=mod.greenhouseNativeSource();
const commit=process.argv.includes('--commit-original-greenhouse-control');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('No exact GM Foundry game page');
 const report=await p.evaluate(async ({commit,source,cfg})=>{
 const ns='dicebox-campaign-helper';
 if(!game?.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('Wrong world/elected GM');
 const scene=game.scenes.get(cfg.scene),r=scene?.regions.get(cfg.region);
 if(!scene||scene.name!=='EXT-06 - Greenhouse Interior'||scene.background.src!==cfg.map||
 scene.width!==1920||scene.height!==1440||!r||
 r.name!=='Greenhouse Controls ? observation'||
 r.behaviors.size!==0||r.behaviors.has(cfg.behavior))throw Error('Original greenhouse control identity or edit collision');
 const shape=r.toObject().shapes[0];
 if(r.toObject().shapes.length!==1||shape?.type!=='rectangle'||
 shape.x!==1450||shape.y!==330||shape.width!==250||shape.height!==230)throw Error('Source controls geometry changed');
 const lye=game.items.get(cfg.lye.split('.')[1]),plant=game.items.get(cfg.plant.split('.')[1]);
 if(!lye||lye.uuid!==cfg.lye||lye.name!=='Lye'||lye.type!=='loot'||
 lye.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'||
 !plant||plant.uuid!==cfg.plant||plant.name!=='Plant Killer'||plant.type!=='loot'||
 plant.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')throw Error('Original Item source or provenance changed');
 if(game.actors.contents.some(a=>a.items.some(i=>i.name==='Plant Killer'||
 i.getFlag(ns,'cavLatePlantKillerSourceUuid')===cfg.plant)))throw Error('Existing Plant Killer on Actor: reconcile');
 const water=game.scenes.get('CAVAQ01Scene0001')?.regions.get('kmPmr5ijLCEOJNk3');
 if(!water||water.behaviors.size!==0)throw Error('Waterworks Annex unexpectedly changed; protect Chat A');
 if(water.getFlag(ns,'cavWaterworksRestore')?.status==='done')throw Error('Waterworks progressed; preflight current first');
 const soap=Array.from(game.scenes).flatMap(s=>Array.from(s.regions).filter(q=>q.getFlag(ns,'cavLateSoapCase')?.canonCode==='BATH-02'));
 if(soap.length)throw Error('New Soap Case now exists; reevaluate before installer');
 const existing=r.getFlag(ns,'cavLateGreenhouseMix');
 if(existing||r.getFlag(ns,'cavLatePlantKillerClaim'))throw Error('Already has Greenhouse grant state');
 const common={world:game.world.id,sceneId:scene.id,regionId:r.id,regionUuid:r.uuid,
  originalLyeUuid:lye.uuid,originalPlantKillerUuid:plant.uuid,priorBehaviorCount:r.behaviors.size,
  waterworksRestoreLedger:water.getFlag(ns,'cavWaterworksRestore')??null,
  recognizedSoapCaseRegions:soap.length,
  scriptLength:source.length};
 if(!commit)return{status:'preflight-pass-no-writes',common};
 const created=await r.createEmbeddedDocuments('RegionBehavior',[{
  _id:cfg.behavior,name:'Greenhouse — Lye-only mixer (GM guarded)',
  type:'executeScript',disabled:false,
  system:{events:['behaviorViewed','behaviorUnviewed','behaviorDeactivated',
   'tokenMoveIn','tokenMoveWithin'],source}
 }],{keepId:true});
 const actual=r.behaviors.get(cfg.behavior);
 if(created.length!==1||!actual||actual.type!=='executeScript'||
 actual.disabled!==false||actual.system.source?.trim()!==source.trim()||
 r.behaviors.size!==1)throw Error('Unknown partial native behavior commit; STOP without automatic retry');
 return{status:'installed-original-greenhouse-mixer-native-behavior',
  common,behaviorId:actual.id,behaviorUuid:actual.uuid,events:Array.from(actual.system.events),
  sourceLength:actual.system.source.length,disabled:actual.disabled};
 },{commit,source:originalSource,cfg:{scene:mod.GREENHOUSE_SCENE,map:mod.GREENHOUSE_APPROVED_ART,
    region:mod.GREENHOUSE_CONTROLS_REGION,behavior:mod.GREENHOUSE_MIX_BEHAVIOR,
    lye:mod.ORIGINAL_QUEST_LYE,plant:mod.ORIGINAL_PLANT_KILLER}});
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn17-greenhouse-behavior-install-20261026.json';
 writeFileSync(path,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{await b.close()}