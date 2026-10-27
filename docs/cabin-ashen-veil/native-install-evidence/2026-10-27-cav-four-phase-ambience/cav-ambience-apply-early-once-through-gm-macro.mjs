import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!page)throw Error('GM Foundry tab missing');
const result=await page.evaluate(async()=>{
const NS='dicebox-campaign-helper';
if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
!game.user?.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong GM world');
const macro=game.macros.get('CAVAMBIENCEMACR1'),flag=macro?.getFlag(NS,'cavSceneAmbienceV1');
if(!macro||flag?.phase!=='original'||flag.pending||
 game.scenes.size!==47||game.scenes.contents.some(s=>s.getFlag(NS,'cavSceneAmbienceV1')))
throw Error('Macro or baseline phase changed, do not replay');
if(globalThis.__CAV_AMBIENCE_PHASE_REQUEST)throw Error('Existing phase override');
globalThis.__CAV_AMBIENCE_PHASE_REQUEST='early';
try{
 const execute=await macro.execute();
 const after=macro.getFlag(NS,'cavSceneAmbienceV1');
 return{macroId:macro.id,macroResult:execute,macroFlag:after,
  currentScene:game.scenes.active.id,
  userScenes:game.users.contents.filter(u=>u.active&&!u.isGM).map(u=>u.viewedScene)};
}finally{delete globalThis.__CAV_AMBIENCE_PHASE_REQUEST;}
});
const file='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-ambience-early-native-macro-apply-once.json';
writeFileSync(file,JSON.stringify(result,null,2));
console.log(JSON.stringify(result).slice(0,3000));
}finally{await b.close()}