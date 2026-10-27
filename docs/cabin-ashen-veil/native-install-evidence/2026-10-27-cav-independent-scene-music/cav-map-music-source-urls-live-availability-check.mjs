import{chromium}from'playwright-core';import{pathToFileURL}from'node:url';
import{statSync}from'node:fs';
const c=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-early-map-music-47.js').href);
const entries=c.catalog(),distinct=[...new Set(entries.map(x=>x.path))];
for(const x of entries){
 const filename=x.file,path='C:/Users/rujie/AppData/Local/FoundryVTT/Data/music/'+filename;
 if(statSync(path).size<500000)throw Error('Unexpected sound too short '+path);
}
const browser=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=browser.contexts().flatMap(x=>x.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
const results=await page.evaluate(async(paths)=>{
 if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong GM');
 return await Promise.all(paths.map(async path=>{
  const r=await fetch(new URL('/'+path,location.origin),{method:'HEAD'});
  return{path,status:r.status,type:r.headers.get('content-type'),size:r.headers.get('content-length')};
 }));
},distinct);
const invalid=results.filter(x=>x.status!==200||!Number(x.size));
console.log(JSON.stringify({originalTracks:results.length,allReachable:invalid.length===0,invalid,smell:results.find(x=>x.path.includes('Smell%20of%20Fear'))}).slice(0,3400));
if(invalid.length)throw Error('Existing audio cannot be fetched; do not install');
}finally{await browser.close()}