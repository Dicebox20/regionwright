import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{readFileSync,writeFileSync}from'node:fs';
const source=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-early-map-music-47.js').href);
const baseline=JSON.parse(readFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-early-map-music-47-native-originals-preflight.json','utf8'));
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!page)throw Error('Current Foundry GM page absent');
const live=await page.evaluate(()=>{
 const ns='dicebox-campaign-helper',key='cavEarlyMapMusicV1';
 if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
 !game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong elected GM');
 const m=game.macros.get('CAVMUSICGM000001');
 return{world:game.world.id,gm:game.user.name,macro:{name:m.name,id:m.id,scope:m.scope,
  ownershipDefault:m.ownership.default,sourceChars:m.command.length,flag:m.getFlag(ns,key)},
  scenes:game.scenes.contents.map(s=>({
   id:s.id,name:s.name,uuid:s.uuid,width:s.width,height:s.height,
   grid:{size:s.grid.size,distance:s.grid.distance},
   dimensions:{sceneX:s.dimensions.sceneX,sceneY:s.dimensions.sceneY},
   background:s.background.src,regions:s.regions.size,walls:s.walls.size,
   lights:s.lights.size,sounds:s.sounds.contents.map(x=>x.toObject())
  })),
  activePlayers:game.users.contents.filter(u=>u.active&&!u.isGM).map(u=>({
   id:u.id,name:u.name,viewedScene:u.viewedScene,
   ownedTokensOnViewedScene:game.scenes.get(u.viewedScene)?.tokens.contents.filter(t=>t.actor?.testUserPermission(u,'OWNER')).length??0
  }))};
});
const entries=source.catalog();
const byId=new Map(live.scenes.map(x=>[x.id,x]));
const reports=entries.map(item=>{
 const sc=byId.get(item.id),before=baseline.originals[item.id];
 const expected=source.payload(item,before);
 const all=sc?.sounds??[];
 const owned=all.filter(x=>x.flags?.['dicebox-campaign-helper']?.cavEarlyMapMusicV1?.role==='scene-wide-music');
 const music=all.find(x=>x._id===item.soundId);
 const originals=before?.sounds??[];
 const otherOriginals=originals.filter(x=>x._id!==item.existingId);
 const oldStillIntact=otherOriginals.every(old=>{
  const curr=all.find(x=>x._id===old._id);
  return curr&&JSON.stringify(curr)===JSON.stringify(old);
 });
 const px=expected.radius*before.grid.size/before.grid.distance;
 const corner=Math.hypot(before.width/2,before.height/2);
 const pass=!!music&&!!sc&&!!before&&sc.name===before.name&&sc.uuid===before.uuid&&
 sc.background===before.background&&sc.lights===before.ambientLights&&
 sc.regions===before.regionCount&&sc.walls===before.wallCount&&
 sc.sounds.length===before.sounds.length+(item.existingId?0:1)&&
 owned.length===1&&oldStillIntact&&
 music._id===expected._id&&music.path===expected.path&&
 music.x===expected.x&&music.y===expected.y&&music.radius===expected.radius&&
 music.easing===false&&music.walls===false&&music.repeat===true&&
 music.hidden===false&&music.volume===expected.volume&&
 music.darkness.min===0&&music.darkness.max===1&&
 music.flags?.['dicebox-campaign-helper']?.cavEarlyMapMusicV1?.sceneId===item.id&&
 px>=corner+before.grid.size;
 return{id:item.id,name:item.name,pass,soundId:item.soundId,
  expectedPath:item.path,actualPath:music?.path,
  volume:music?.volume,center:music?{x:music.x,y:music.y}:null,
  radius:music?.radius,pixelCoverage:Math.round(px),
  cornerPixels:Math.round(corner),oldOtherSoundsPreserved:oldStillIntact,
  originalSoundCount:before?.sounds.length,currentSoundCount:all.length,
  ownedCount:owned.length,
  nonGmPlayerTested:false};
});
const number=live.scenes.reduce((n,s)=>n+s.sounds.length,0);
const grove=reports.filter(x=>source.GROVE_PERIMETER.includes(x.id));
const other=reports.find(x=>x.id==='CAVSG05Scene0001');
const pass=reports.length===47&&reports.every(x=>x.pass)&&number===57&&
 live.macro.flag?.status==='installed'&&live.macro.flag.pending===null&&
 live.macro.flag.lastVerified===47&&live.macro.flag.requestedGroveCount===8&&
 live.macro.ownershipDefault===0&&grove.length===8&&
 grove.every(x=>x.actualPath==='Music/Demon%20Slayer%20-%20The%20Smell%20of%20Fear.mp3')&&
 other?.actualPath!=='Music/Demon%20Slayer%20-%20The%20Smell%20of%20Fear.mp3';
const result={pass,world:live.world,gm:live.gm,sceneCount:reports.length,
 verifiedCount:reports.filter(x=>x.pass).length,actualNativeAmbientSoundCount:number,
 newSources:46,adoptedExistingYard:1,previousAtmosphereSourcesPreserved:10,
 allUniformVolume:reports.every(x=>x.pass),exactGroveEight:grove.map(x=>x.id),
 centralGrooveUsesDifferentTrack:other.actualPath,
 macro:live.macro,activePlayers:live.activePlayers,
 mismatches:reports.filter(x=>!x.pass),allScenes:reports,nonGMPlayerAudioVerified:false};
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-map-music-47-independent-gm-postread.json';
writeFileSync(out,JSON.stringify(result,null,2));
console.log(JSON.stringify({pass:result.pass,verified:result.verifiedCount,soundCount:number,
 eight:result.exactGroveEight,central:result.centralGrooveUsesDifferentTrack,
 activePlayers:result.activePlayers,mismatches:result.mismatches}).slice(0,6500));
if(!pass)throw Error('Original GM postread not fully verified; reconcile before another write');
}finally{await b.close()}