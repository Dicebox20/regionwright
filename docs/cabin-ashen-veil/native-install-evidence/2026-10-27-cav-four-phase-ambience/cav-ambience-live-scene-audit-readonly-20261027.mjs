import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!page)throw Error('No exact /game');
const d=await page.evaluate(()=>{
 if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Elected GM world invalid');
 const fx=game.modules.get('fxmaster');const ns='dicebox-campaign-helper';
 const m={id:fx?.id,active:fx?.active,version:fx?.version,
 apiKeys:Object.keys(fx?.api||{}),
 apiValueKinds:Object.fromEntries(Object.entries(fx?.api||{}).map(([k,v])=>[k,typeof v])),
 settingsKeys:Array.from(game.settings.settings.keys()).filter(k=>k.startsWith('fxmaster.')),
 legacyFlagKeys:Object.keys(game.scenes.contents[0]?.flags?.fxmaster||{})};
 const scenes=game.scenes.contents.map(s=>{
  const env=s.environment;
  const data=s.toObject();
  const journal=s.journal,pg=s.journalPage;
  const journalText=journal?.pages?.contents.map(p=>({name:p.name,type:p.type,
  snippet:((p.text?.content??p.text?.markdown??'')+'').replace(/<[^>]*>/g,' ').slice(0,1900)}))||[];
  const notes=s.notes?.contents?.slice(0,18).map(n=>({text:n.text,entry:n.entry?.name,page:n.page?.name}))||[];
  return{id:s.id,name:s.name,background:s.background.src,
   environment:env?.toObject?env.toObject():foundry.utils.deepClone(data.environment),
   tokenVision:s.tokenVision,fog:data.fog,weather:s.weather,
   playlist:s.playlist?.name??null,playlistSound:s.playlistSound?.name??null,
   ambience:s.ambience??null,
   backgroundColor:s.backgroundColor,
   existingFX:s.flags?.fxmaster??null,
   customFlags:s.flags?.[ns]?Object.keys(s.flags[ns]):[],
   lightCount:s.lights.size,soundCount:s.sounds.size,regions:s.regions.size,wallCount:s.walls.size,
   journal:journal?.name??null,journalPage:pg?.name??null,description:((s.description??s.flags?.core?.description??'')+'').slice(0,850),
   journalText,notes
  };
 });
 return{m,scenes,world:game.world.id,activeScene:game.scenes.active?.id,gm:game.user.name,
 activeUsers:game.users.contents.filter(u=>u.active).map(u=>({isGM:u.isGM,name:u.name,viewedScene:u.viewedScene})),
 playlists:game.playlists.contents.map(x=>({name:x.name,id:x.id,sounds:x.sounds.contents.map(s=>({name:s.name,id:s.id,path:s.path}))})),
 configWeatherNames:Object.keys(CONFIG.weatherEffects||{}),system:game.system.id};
});
const file='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-ambience-live-scene-audit-20261027.json';
writeFileSync(file,JSON.stringify(d,null,2));
console.log(JSON.stringify({
 world:d.world,gm:d.gm,module:d.m,activeScene:d.activeScene,users:d.activeUsers,
 counts:{scenes:d.scenes.length,
 darkExisting:d.scenes.filter(s=>s.environment?.darknessLevel>0).length,
 lights:d.scenes.reduce((n,s)=>n+s.lightCount,0),sounds:d.scenes.reduce((n,s)=>n+s.soundCount,0),
 scenesWithJournals:d.scenes.filter(s=>s.journal).length,
 scenesWithFX:d.scenes.filter(s=>s.existingFX).length,
 scenesWithWeather:d.scenes.filter(s=>s.weather).length},
 weather:d.configWeatherNames,
 playlists:d.playlists.map(x=>({name:x.name,sounds:x.sounds.length})),
 scenes:d.scenes.map(s=>({id:s.id,name:s.name,description:s.description?.slice(0,80),
 env:s.environment?.darknessLevel,globalLight:s.environment?.globalLight?.enabled,
 weather:s.weather,lightCount:s.lightCount,sounds:s.soundCount,
 journal:s.journal,notes:s.notes.length,fx:s.existingFX?Object.keys(s.existingFX):[]}))
}).slice(0,24000));
}finally{await b.close()}