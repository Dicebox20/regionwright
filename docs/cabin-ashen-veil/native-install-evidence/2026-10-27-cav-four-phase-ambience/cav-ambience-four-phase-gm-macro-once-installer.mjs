import{chromium}from'playwright-core';import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const mod=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-ambience-four-phase.js').href);
const commit=process.argv.includes('--create-once-gm-phase-macro-only');
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('Current GM tab missing');
const before=await p.evaluate(({names})=>{
if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users.activeGM.id!==game.user.id)throw Error('Current GM world invalid');
if(!game.modules.get('fxmaster')?.active||game.modules.get('fxmaster')?.version!=='8.3.6'||typeof FXMASTER?.api?.effects?.play!=='function')throw Error('FXMaster runtime invalid');
if(game.scenes.size!==47||new Set(names.map(x=>x.id)).size!==47)throw Error('Unexpected Scene count');
if(game.macros.get('CAVAMBIENCEMACR1')||game.macros.contents.some(m=>m.name==='CAV — Ambience Phases (GM)'))throw Error('Ambience macro already exists, stop');
const originals={};
for(const n of names){
 const sc=game.scenes.get(n.id);
 if(sc?.name!==n.name)throw Error('Renamed Scene identity drift '+n.id);
 const data=sc.toObject(),fx=sc.flags?.fxmaster??{};
 if(JSON.stringify(fx).includes('apiMacro_cavAmbience1_')||
   sc.getFlag('dicebox-campaign-helper','cavSceneAmbienceV1'))
  throw Error('Our ambience state already exists: stop');
 originals[n.id]={
  id:sc.id,name:sc.name,uuid:sc.uuid,
  darknessLevel:data.environment.darknessLevel,
  darkHue:data.environment.dark.hue,weather:sc.weather,
  globalLight:data.environment.globalLight,
  tokenVision:sc.tokenVision,
  lights:sc.lights.size,sounds:sc.sounds.size,walls:sc.walls.size,
  regions:sc.regions.size,tiles:sc.tiles.size,
  fxmasterBefore:fx
 };
}
const read=game.journal.get('9dngVaa6ctgFAqd2');
if(!read||read.pages.size!==59)throw Error('Original read-aloud 59 room descriptions unavailable');
return{world:game.world.id,gm:game.user.name,originals,
 readAloudJournal:read.uuid,readAloudPages:read.pages.contents.map(p=>({name:p.name,plain:String(p.text?.content??p.text?.markdown??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()})),
 currentNonGM:game.users.contents.filter(u=>u.active&&!u.isGM).map(u=>({id:u.id,viewedScene:u.viewedScene})),
 gmOnlyMacroExists:false};
},{names:mod.makeCatalog()});
const plan=mod.buildProfiles(before.originals);
const command=mod.buildMacroCommand(plan,before.originals);
new (Object.getPrototypeOf(async function(){}).constructor)('phase',command);
if(!command.includes('CAVAMBIENCEMACR1')||!command.includes('Restore Original Scene Ambience')||command.length<8000)throw Error('Invalid macro code');
const snapshot='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-ambience-four-phase-originals-and-preflight.json';
writeFileSync(snapshot,JSON.stringify({...before,plan,macroCommandSHA256:sha(command),macroCommandLength:command.length,sceneCount:47,phaseList:mod.PHASES,mode:'GM-only macro; early actual, future phases staged'},null,2));
if(!commit){console.log(JSON.stringify({preflight:true,world:before.world,scenes:Object.keys(plan).length,originalReadaloud:before.readAloudPages.length,gm:before.gm,macroSourceSHA256:sha(command),macroSourceChars:command.length,fxGroveCount:mod.makeCatalog().filter(x=>x.particle).length,preexistingNonGM:before.currentNonGM}));}
else{
 const data=await p.evaluate(async({command,originals,sourceSHA})=>{
 if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id||
 game.macros.get('CAVAMBIENCEMACR1'))throw Error('GM state or macro drift');
 if(game.scenes.contents.some(s=>s.name!==originals[s.id]?.name||
  s.toObject().environment.darknessLevel!==originals[s.id].darknessLevel||
  s.weather!==originals[s.id].weather))throw Error('Scene changed since no-write inventory');
 const pkg={_id:'CAVAMBIENCEMACR1',name:'CAV — Ambience Phases (GM)',
  type:'script',scope:'global',command,img:'icons/magic/air/wind-vortex-swirl-blue.webp',
  ownership:{default:0},
  flags:{'dicebox-campaign-helper':{cavSceneAmbienceV1:{
   version:1,phase:'original',pending:null,sourceCount:47,
   profiles:['early','mid','late','crimson'],
   lastVerifiedCount:0,fxSceneCount:0,sourceSHA256:sourceSHA,
   initialSnapshotsSavedExternally:true,ownerAuthorised:true
  }}}
 };
 const docs=await getDocumentClass('Macro').createDocuments([pkg],{keepId:true});
 const actual=game.macros.get('CAVAMBIENCEMACR1');
 if(docs.length!==1||actual?.name!==pkg.name||actual.command!==command||
  actual.getFlag('dicebox-campaign-helper','cavSceneAmbienceV1')?.sourceCount!==47)
  throw Error('Partial macro create, stop and inspect independently, never replay');
 return{created:true,id:actual.id,name:actual.name,commandLength:actual.command.length,
  scope:actual.scope,phase:actual.getFlag('dicebox-campaign-helper','cavSceneAmbienceV1')?.phase,
  worldSceneCount:game.scenes.size,readOnlySceneCreate:true};
 },{command,originals:before.originals,sourceSHA:sha(command)});
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-ambience-four-phase-gm-macro-install.json';
 writeFileSync(path,JSON.stringify({...data,sourceSHA256:sha(command)},null,2));
 console.log(JSON.stringify(data));
}
}finally{await b.close()}