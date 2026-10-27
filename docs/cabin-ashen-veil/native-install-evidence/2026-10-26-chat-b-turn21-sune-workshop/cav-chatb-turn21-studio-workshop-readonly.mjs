import {chromium} from 'playwright-core';import {writeFileSync} from 'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('No actual GM /game');
const res=await p.evaluate(()=>{
const ns='dicebox-campaign-helper';
if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM?.id!==game.user.id)throw Error('GM/world mismatch');
return{
 world:game.world.id,
 scenes:['CAVHU07Scene0001','CAVHU08Scene0001'].map(id=>{
 const s=game.scenes.get(id);return{id,name:s?.name,map:s?.background?.src,
 width:s?.width,height:s?.height,gridSize:s?.grid.size,
 regions:Array.from(s?.regions||[]).map(r=>({id:r.id,name:r.name,shapes:r.toObject().shapes,
 behaviors:Array.from(r.behaviors).map(z=>({id:z.id,name:z.name,type:z.type,disabled:z.disabled,events:Array.from(z.system?.events||[]),destination:z.system?.destination,sourceLength:z.system?.source?.length})),
 flags:r.flags?.[ns]})),
 tokens:Array.from(s?.tokens||[]).map(t=>({id:t.id,name:t.name,x:t.x,y:t.y,width:t.width,height:t.height})),
 tiles:Array.from(s?.tiles||[]).map(t=>({id:t.id,x:t.x,y:t.y,w:t.width,h:t.height,hidden:t.hidden}))}
 }),
 prayers:['5jwy75XyFezukf3b','GXLYq6Tf4OgPNbkU'].map(id=>{const i=game.items.get(id);return{uuid:i?.uuid,name:i?.name,journal:i?.getFlag(ns,'cavFullPrayerJournalUuid'),library:i?.getFlag(ns,'cabinPuzzleItem')?.status}}),
 playerPrayers:game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>/Prayer of Protection|Prayer of Devotion/i.test(i.name)).map(i=>({actor:a.id,item:i.id,name:i.name,flags:i.flags?.[ns]})))
};
});
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn21-studio-workshop-live-census.json';
writeFileSync(out,JSON.stringify(res,null,2));
console.log(JSON.stringify(res));
}finally{await b.close()}