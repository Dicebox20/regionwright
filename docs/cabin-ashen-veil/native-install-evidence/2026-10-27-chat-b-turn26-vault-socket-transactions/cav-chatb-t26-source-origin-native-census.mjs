import {chromium} from 'playwright-core';import {writeFileSync} from 'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
const x=await p.evaluate(()=>{
const ns='dicebox-campaign-helper';
if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');
const s=['CAVHG05Scene0001','CAVAQ01Scene0001','CAVHU05Scene0001','CAVHU07Scene0001','G6NMonfCwMvNzipL','CAVHG02Scene0001'];
return{world:game.world.id,scenes:s.map(id=>{
 const sc=game.scenes.get(id);return{id,name:sc?.name,count:sc?.regions.size,
  regions:Array.from(sc?.regions||[]).map(r=>({
  id:r.id,name:r.name,flags:Object.keys(r.flags?.[ns]||{}),
  behaviors:Array.from(r.behaviors).map(b=>({id:b.id,disabled:b.disabled,type:b.type,
   sourceSnippet:b.system?.source?.slice(0,450),events:Array.from(b.system?.events||[])}))
 }))}})};
});
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t26-original-reward-nodes-readonly.json';
writeFileSync(out,JSON.stringify(x,null,2));
console.log(JSON.stringify(x).slice(0,15500));
}finally{await b.close()}