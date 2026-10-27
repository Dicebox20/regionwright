import{chromium}from'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
const result=await p.evaluate(()=>{
const NS='dicebox-campaign-helper';
if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');
const m=game.macros.get('CAVAMBIENCEMACR1');
const scenes=game.scenes.contents.map(s=>({id:s.id,name:s.name,phase:s.getFlag(NS,'cavSceneAmbienceV1')?.phase??null,darkness:s.environment.darknessLevel,weather:s.weather,
fxRows:Object.keys(s.flags.fxmaster?.effects??{}).filter(k=>k.startsWith('apiMacro_cavAmbience1_'))}));
return{macroFlag:m.getFlag(NS,'cavSceneAmbienceV1'),phaseCount:Object.fromEntries([...new Set(scenes.map(s=>s.phase))].map(k=>[k,scenes.filter(s=>s.phase===k).length])),
 managedFX:scenes.filter(s=>s.fxRows.length).length,
 examples:scenes.filter(s=>s.phase||s.fxRows.length).slice(0,7),
 env:scenes.filter(s=>['CAVEXT01Yard0001','CAVHU05Scene0001','CAVSG05Scene0001'].includes(s.id))};
});
console.log(JSON.stringify(result).slice(0,4800));
}finally{await b.close()}