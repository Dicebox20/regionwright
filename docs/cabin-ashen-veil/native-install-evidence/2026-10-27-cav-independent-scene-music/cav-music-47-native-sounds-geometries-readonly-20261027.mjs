import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!page)throw Error('GM /game missing');
const x=await page.evaluate(()=>{
 if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong elected GM');
 return{world:game.world.id,gm:game.user.name,
  scenes:game.scenes.contents.map(s=>({id:s.id,name:s.name,width:s.width,height:s.height,
   dimensions:{width:s.dimensions.width,height:s.dimensions.height,sceneWidth:s.dimensions.sceneWidth,sceneHeight:s.dimensions.sceneHeight,sceneX:s.dimensions.sceneX,sceneY:s.dimensions.sceneY,gridDistance:s.grid.distance,gridSize:s.grid.size},
   grid:{size:s.grid.size,distance:s.grid.distance,units:s.grid.units},
   soundCount:s.sounds.size,tokenCount:s.tokens.size,
   sounds:s.sounds.contents.map(y=>y.toObject()),playlist:s.playlist?.id??null,
   flags:s.flags?.['dicebox-campaign-helper']?.cavSceneAmbienceV1??null,
   background:s.background.src})),
  players:game.users.contents.filter(u=>u.active&&!u.isGM).map(u=>({id:u.id,scene:u.viewedScene})),
  tracks:game.playlists.contents.map(pl=>({id:pl.id,name:pl.name,sounds:pl.sounds.contents.map(a=>({name:a.name,path:a.path}))}))};
});
writeFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-music-native-sounds-before-20261027.json',JSON.stringify(x,null,2));
console.log(JSON.stringify({scenes:x.scenes.length,
 sounds:x.scenes.reduce((n,s)=>n+s.soundCount,0),
 withSounds:x.scenes.filter(s=>s.soundCount>0).map(s=>({id:s.id,name:s.name,sounds:s.sounds.map(a=>({id:a._id,name:a.name,path:a.path,volume:a.volume,easing:a.easing,walls:a.walls,radius:a.radius,x:a.x,y:a.y}))})),
 grooves:x.scenes.filter(s=>s.name.startsWith('Grove')).map(s=>({id:s.id,name:s.name,w:s.width,h:s.height,grid:s.grid})),
 gridSamples:x.scenes.slice(0,6).map(s=>({name:s.name,dimensions:s.dimensions})),tracks:x.tracks}).slice(0,16500));
}finally{await b.close()}