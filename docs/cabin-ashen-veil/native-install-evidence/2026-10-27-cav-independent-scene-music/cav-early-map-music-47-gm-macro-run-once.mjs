import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!page)throw Error('Exact Foundry tab missing');
const data=await page.evaluate(async()=>{
 const ns='dicebox-campaign-helper',flag='cavEarlyMapMusicV1';
 if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users.activeGM.id!==game.user.id)
 throw Error('Current GM status not verified');
 const m=game.macros.get('CAVMUSICGM000001'),f=m?.getFlag(ns,flag);
 if(!m||f?.status!=='original'||f.pending||
 game.scenes.contents.some(s=>s.sounds.contents.some(x=>x.getFlag(ns,flag))))
 throw Error('Music was already started, do not replay');
 if(globalThis.__CAV_MAP_MUSIC_ACTION)throw Error('Already pending music action');
 globalThis.__CAV_MAP_MUSIC_ACTION='install';
 try{
  const v=await m.execute();
  return{started:true,macroReturn:v??null,
   macroFlag:m.getFlag(ns,flag),
   soundCount:game.scenes.contents.reduce((n,s)=>n+s.sounds.size,0)};
 }finally{delete globalThis.__CAV_MAP_MUSIC_ACTION;}
});
writeFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-early-map-music-47-once-run-receipt.json',JSON.stringify(data,null,2));
console.log(JSON.stringify(data).slice(0,2800));
}finally{await b.close()}