import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
const x=await p.evaluate(()=>{
if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');
const ns='dicebox-campaign-helper';
return{world:game.world.id,scenes:['CAVSG05Scene0001','CN5fkK2QLUELBGGR','ywpIpQDrkMLIgUP0','CAVHG06GreatRoom','tjTpG2RVZNoCqRLh'].map(id=>{const s=game.scenes.get(id);return{id,exists:!!s,name:s?.name,art:s?.background.src,width:s?.width,height:s?.height,
regions:Array.from(s?.regions||[]).map(r=>({id:r.id,name:r.name,shapes:r.toObject().shapes,
behaviors:Array.from(r.behaviors).map(b=>({id:b.id,type:b.type,disabled:b.disabled})),flags:r.flags?.[ns]}))}}),
items:Array.from(game.items).filter(i=>/keystone|scrying bowl|dust of dryness|gond emblem|sune emblem/i.test(i.name)).map(i=>({id:i.id,name:i.name,flags:i.flags?.[ns]}))};
});
const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn23-independent-late-puzzle-census.json';
writeFileSync(path,JSON.stringify(x,null,2));console.log(JSON.stringify(x).slice(0,16000));
}finally{await b.close()}