import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import{writeFileSync,statSync}from'node:fs';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-early-map-music-47.js').href);
const entries=cfg.catalog();
const commit=process.argv.includes('--owner-commit-map-music-gm-macro-once');
const sha=x=>createHash('sha256').update(x).digest('hex');
for(const x of entries){
 const filename='C:/Users/rujie/AppData/Local/FoundryVTT/Data/music/'+x.file;
 if(statSync(filename).size<500000)throw Error('Local music missing/invalid '+filename);
}
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!page)throw Error('Exact Foundry elected GM /game tab missing');
const live=await page.evaluate(({items,macroId,flag})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||game.system.id!=='dnd5e'||
 !game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong elected GM/world');
 if(game.scenes.size!==47||items.length!==47||game.macros.get(macroId)||
 game.macros.contents.some(m=>m.name==='CAV — Independent Scene Music (GM)'))
 throw Error('Original Scene mapping or music macro already installed');
 const originals={};
 for(const item of items){
  const sc=game.scenes.get(item.id);
  if(!sc||sc.name!==item.name||sc.getFlag(ns,flag))
   throw Error('Original Scene music state/mapping changed '+item.id);
  const s=sc.toObject();
  if(!sc.dimensions||!sc.grid.size||!sc.grid.distance||!sc.width||!sc.height)throw Error('Invalid Scene grid');
  if(sc.sounds.has(item.soundId)&&!item.existingId)
   throw Error('A custom same-ID soundtrack exists '+item.id);
  const originalSounds=sc.sounds.contents.map(x=>x.toObject());
  const soundtrack=originalSounds.filter(a=>a._id===item.existingId);
  if(item.existingId){
   if(item.id!=='CAVEXT01Yard0001'||soundtrack.length!==1||
     soundtrack[0].path!=='Music/Elwynn%20Forest-Music.mp3'||
     soundtrack[0].volume!==.72||originalSounds.length!==1)
    throw Error('Original Yard music changed; must review before adoption');
  }else if(originalSounds.some(x=>x.flags?.[ns]?.[flag]))
   throw Error('Already installed sound on '+item.id);
  originals[item.id]={id:item.id,name:item.name,uuid:sc.uuid,
   width:sc.width,height:sc.height,
   grid:{size:sc.grid.size,distance:sc.grid.distance},
   dimensions:{sceneX:sc.dimensions.sceneX,sceneY:sc.dimensions.sceneY},
   soundCount:sc.sounds.size,sounds:originalSounds,
   regionCount:sc.regions.size,wallCount:sc.walls.size,
   ambientLights:sc.lights.size,background:sc.background.src,
   ownerPhase:sc.getFlag(ns,'cavSceneAmbienceV1')?.phase};
  if(originals[item.id].ownerPhase!=='early')throw Error('Not in actual intended Early atmosphere '+item.id);
 }
 const grove=items.filter(x=>x.id.startsWith('CAVSG')&&x.id!=='CAVSG05Scene0001');
 if(grove.length!==8||grove.some(x=>x.file!=='Demon Slayer - The Smell of Fear.mp3'))throw Error('Owner 8 outer maps mismatch');
 return{world:game.world.id,gm:game.user.name,originals,
  users:game.users.contents.filter(u=>u.active&&!u.isGM).map(u=>({name:u.name,viewedScene:u.viewedScene})),
  allSounds:game.scenes.contents.reduce((n,s)=>n+s.sounds.size,0)};
},{items:entries,macroId:cfg.MACRO_ID,flag:cfg.MUSIC_FLAG});
const rows=entries.map(e=>({...e,expected:cfg.payload(e,live.originals[e.id])}));
if(rows.some(x=>x.expected.x!==Math.round(live.originals[x.id].dimensions.sceneX+live.originals[x.id].width/2)||x.expected.volume>.3))throw Error('Full Scene location/volume unexpected');
const macroSource=cfg.macroCommand(rows,live.originals);
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
new AsyncFunction(macroSource);
if(macroSource.length<50000||macroSource.length>260000||
 !macroSource.includes('restore')||!macroSource.includes('repeat:true'))throw Error('Macro source missing critical safety');
const preflight={...live,requestedGroveTrack:cfg.REQUESTED_TRACK,perimeterIds:cfg.GROVE_PERIMETER,
  entries:rows,macroSHA256:sha(macroSource),macroChars:macroSource.length,willAdd:46,
  willAdoptExistingYard:1,willPreserveOtherSounds:10,worldWriteStatus:'none-before-commit'};
const pre='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-early-map-music-47-native-originals-preflight.json';
writeFileSync(pre,JSON.stringify(preflight,null,2));
if(!commit){console.log(JSON.stringify({preflight:'PASS NO WORLD WRITES',world:live.world,
  scenes:entries.length,gm:live.gm,originalSounds:live.allSounds,add:46,adopt:1,
  selectedUniqueTracks:new Set(entries.map(x=>x.file)).size,grove:cfg.GROVE_PERIMETER,
  macroChars:macroSource.length,macroSHA256:sha(macroSource),players:live.users}));}
else{
 const made=await page.evaluate(async({source,hash,macroId,flag})=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
   !game.user.isGM||game.users.activeGM.id!==game.user.id||
   game.macros.get(macroId))throw Error('GM state or macro already installed');
  const pkg={_id:macroId,name:'CAV — Independent Scene Music (GM)',
    type:'script',scope:'global',command:source,
    img:'icons/skills/trades/music-singing-voice-blue.webp',
    ownership:{default:0},
    flags:{[ns]:{[flag]:{
     version:1,status:'original',pending:null,sceneCount:47,
     adoptedYard:1,newSources:46,requestedGroveCount:8,phase:'early',
     macroSourceSHA256:hash,lastVerified:0,nonGMTested:false
    }}}
  };
  const docs=await getDocumentClass('Macro').createDocuments([pkg],{keepId:true});
  const m=game.macros.get(macroId);
  if(docs.length!==1||!m||m.command!==source||
    m.getFlag(ns,flag)?.status!=='original'||m.ownership.default!==0)
   throw Error('Uncertain one-time macro install; independently reconcile, NEVER replay');
  return{id:m.id,created:true,name:m.name,scope:m.scope,codeChars:m.command.length,
   status:m.getFlag(ns,flag).status,world:game.world.id};
 },{source:macroSource,hash:sha(macroSource),macroId:cfg.MACRO_ID,flag:cfg.MUSIC_FLAG});
 writeFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-early-map-music-47-gm-macro-install.json',
  JSON.stringify({...made,macroSourceSHA256:sha(macroSource)},null,2));
 console.log(JSON.stringify(made));
}
}finally{await b.close()}