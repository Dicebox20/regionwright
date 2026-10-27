import {chromium} from 'playwright-core';import {writeFileSync} from 'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact GM page absent');
 const x=await p.evaluate(()=>{
 if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Invalid elected GM');
 const re=/Greenhouse|Boathouse|Privy|Soap|Thorn|Dock|Pond|Sune|Art Studio|Aqueduct|Workshop|Rufus|Bathhouse|Greenhouse|Garden|Boiler|Lye|Study/i;
 return{
  world:game.world.id,gameVersion:game.version,
  scenes:Array.from(game.scenes).filter(s=>re.test(s.name)).map(s=>({name:s.name,id:s.id,width:s.width,height:s.height,src:s.background.src,
    regions:Array.from(s.regions).map(r=>({id:r.id,name:r.name,shapes:r.toObject().shapes.map(q=>({type:q.type,x:q.x,y:q.y,width:q.width,height:q.height,points:q.points?.length})),behaviors:Array.from(r.behaviors).map(q=>({id:q.id,type:q.type,disabled:q.disabled})),flags:r.flags?.['dicebox-campaign-helper']}))})),
  items:Array.from(game.items).filter(i=>/Lye|Plant Killer|Soap|Copper|Devotion|Crimson Veil|Gondian|Sune Emblem/i.test(i.name)).map(i=>({id:i.id,uuid:i.uuid,name:i.name,type:i.type,folder:i.folder?.id,flags:i.flags?.['dicebox-campaign-helper']})),
  journals:Array.from(game.journal).filter(j=>/prayer of protection|ornate music box/i.test(j.name)).map(j=>({name:j.name,id:j.id,pages:j.pages.size})),
  actorSources:Array.from(game.actors).filter(a=>a.type==='character').flatMap(a=>Array.from(a.items).filter(i=>/Lye|Plant Killer|Soap|Copper|Devotion|Crimson Veil/i.test(i.name)).map(i=>({actor:a.id,name:i.name,flags:i.flags?.['dicebox-campaign-helper']})))
 };});
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn17-batch2-live-census-20261026.json';
 writeFileSync(out,JSON.stringify(x,null,2));
 console.log(JSON.stringify({world:x.world,scenes:x.scenes.map(s=>({name:s.name,id:s.id,regions:s.regions.length,src:s.src})),items:x.items,journals:x.journals,actorSources:x.actorSources}));
}finally{await b.close();}