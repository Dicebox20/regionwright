import{chromium}from'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
const x=await page.evaluate(()=>{
 if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');
 const ns='dicebox-campaign-helper',flag='cavEarlyMapMusicV1';
 const m=game.macros.get('CAVMUSICGM000001');
 const ids=['CAVSG01Scene0001','CAVSG05Scene0001','CAVSG09Scene0001','CAVEXT01Yard0001'];
 return{macro:m.getFlag(ns,flag),count:game.scenes.contents.reduce((n,s)=>n+s.sounds.size,0),
 created:game.scenes.contents.flatMap(s=>s.sounds.contents.filter(x=>x.getFlag(ns,flag)).map(x=>({scene:s.id,id:x.id}))).length,
 selected:ids.map(id=>({scene:id,sounds:game.scenes.get(id).sounds.contents.map(x=>({id:x.id,path:x.path,volume:x.volume,easing:x.easing,walls:x.walls,radius:x.radius,flag:x.getFlag(ns,flag)}))}))};
});
console.log(JSON.stringify(x).slice(0,6000));
}finally{await b.close()}