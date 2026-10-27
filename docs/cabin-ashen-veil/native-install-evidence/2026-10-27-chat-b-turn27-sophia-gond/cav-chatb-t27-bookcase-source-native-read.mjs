import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('GM tab absent');
const data=await p.evaluate(()=>{if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');const s=game.scenes.get('CAVHU05Scene0001'),r=s.regions.get('CAVB994894A7432F'),b=r.behaviors.get('LRYrBIQNN92SCJai'),i=game.items.get('o9G3UJjEe2QX1ZH0');return{source:b.system.source,behaviorDisabled:b.disabled,regionBehaviors:r.behaviors.size,item:{id:i.id,img:i.img,flags:i.flags?.['dicebox-campaign-helper']},walls:s.walls.size,tiles:s.tiles.size,sourceRegionFlags:r.flags?.['dicebox-campaign-helper']??null};});
writeFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t27-bookcase-current-native.json',JSON.stringify(data,null,2));console.log(JSON.stringify({...data,source:data.source.slice(0,1800)}));
}finally{await b.close()}