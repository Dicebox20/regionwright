import{chromium}from'playwright-core';import{readFileSync,writeFileSync}from'node:fs';
const snapshot=JSON.parse(readFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-ambience-four-phase-originals-and-preflight.json','utf8'));
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');if(!p)throw Error('Exact GM browser');
const live=await p.evaluate(()=>{
 if(!game.ready||game.version!=='14.367'||game.world.id!=='cabin-in-the-ashen-veil'||
 !game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong GM');
 const ns='dicebox-campaign-helper';
 const macro=game.macros.get('CAVAMBIENCEMACR1');
 return{world:game.world.id,gm:game.user.name,sceneCount:game.scenes.size,
  macro:{id:macro?.id,name:macro?.name,type:macro?.type,scope:macro?.scope,
  gmOnly:macro?.ownership?.default===0,
  flag:macro?.getFlag(ns,'cavSceneAmbienceV1'),codeChars:macro?.command?.length},
  all:game.scenes.contents.map(sc=>{const data=sc.toObject();
   const fx=sc.flags.fxmaster||{};
   return{id:sc.id,name:sc.name,uuid:sc.uuid,
    environment:data.environment,tokenVision:sc.tokenVision,
    weather:sc.weather,lights:sc.lights.size,sounds:sc.sounds.size,
    walls:sc.walls.size,regions:sc.regions.size,tiles:sc.tiles.size,
    fxEffectNames:Object.keys(fx.effects||{}),
    phaseFlag:sc.getFlag(ns,'cavSceneAmbienceV1')}
  }),
  currentPlayers:game.users.contents.filter(u=>u.active&&!u.isGM).map(u=>u.viewedScene)};
});
const results=live.all.map(s=>{
 const base=snapshot.originals[s.id],cfg=snapshot.plan[s.id]?.early;
 const owned=s.fxEffectNames.filter(x=>x.startsWith('apiMacro_cavAmbience1_'));
 const expectedFX=!!(cfg?.particle||cfg?.filter);
 const preserved=base?Object.keys(base.fxmasterBefore?.effects||{}).every(x=>s.fxEffectNames.includes(x)):false;
 const pass=!!base&&!!cfg&&s.name===base.name&&s.uuid===base.uuid&&
  s.environment.darknessLevel===cfg.darknessLevel&&
  s.environment.dark.hue===cfg.darkHue&&
  s.weather===cfg.weather&&
  s.tokenVision===base.tokenVision&&
  JSON.stringify(s.environment.globalLight)===JSON.stringify(base.globalLight)&&
  s.lights===base.lights&&s.sounds===base.sounds&&s.walls===base.walls&&
  s.tiles===base.tiles&&s.regions===base.regions&&
  preserved&&s.phaseFlag?.phase==='early'&&
  owned.length===(expectedFX?1:0)&&
  (expectedFX?owned[0]===(cfg.particle?.id||cfg.filter?.id):true);
 return{id:s.id,name:s.name,pass,darkness:s.environment.darknessLevel,
  weather:s.weather,fx:owned,originalFXPreserved:preserved,
  geometryPreserved:s.regions===base?.regions,
  soundPreserved:s.sounds===base?.sounds,lightsPreserved:s.lights===base?.lights};
});
const allPass=live.sceneCount===47&&results.length===47&&results.every(r=>r.pass)&&
 live.macro?.gmOnly&&live.macro?.flag?.version===1&&
 live.macro?.flag?.phase==='early'&&live.macro.flag.pending===null&&
 live.macro.flag.lastVerifiedCount===47&&
 live.macro.flag.fxSceneCount===15&&
 live.macro.flag.profiles.join('|')==='early|mid|late|crimson';
const report={pass:allPass,world:live.world,gm:live.gm,
 sceneCount:live.sceneCount,sceneVerified:results.filter(r=>r.pass).length,
 mismatches:results.filter(r=>!r.pass),
 earlyPhaseOnly:true,selectedFXScenes:results.filter(r=>r.fx.length).length,
 originalEffectsPreserved:results.every(r=>r.originalFXPreserved),
 nativeSoundsPreserved:results.every(r=>r.soundPreserved),
 nativeLightsPreserved:results.every(r=>r.lightsPreserved),
 regionsPreserved:results.every(r=>r.geometryPreserved),
 original47SceneNamesPreserved:results.every(r=>r.name===snapshot.originals[r.id]?.name),
 macro:live.macro,players:live.currentPlayers,allScenes:results};
const file='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-ambience-four-phase-early-independent-postread.json';
writeFileSync(file,JSON.stringify(report,null,2));console.log(JSON.stringify({
 pass:report.pass,sceneVerified:report.sceneVerified,fxScenes:report.selectedFXScenes,
 preserved:{sounds:report.nativeSoundsPreserved,lights:report.nativeLightsPreserved,
  regions:report.regionsPreserved,oldEffects:report.originalEffectsPreserved},
 macroPhase:report.macro.flag.phase,mismatches:report.mismatches}).slice(0,5000));
if(!allPass)throw Error('Independent early ambience audit failed; preserve partial and investigate');
}finally{await b.close()}