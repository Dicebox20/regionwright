import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('No expected GM world');
const data=await p.evaluate(()=>{
const ns='dicebox-campaign-helper';
if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong GM');
const scenes=['CAVAQ01Scene0001','CAVSG01Scene0001','CAVHU04Scene0001','CAVHU07Scene0001','CAVEXT02Scene001'];
const data=scenes.map(id=>{
 const s=game.scenes.get(id);return{id,name:s?.name,map:s?.background?.src,width:s?.width,height:s?.height,
 regions:Array.from(s?.regions||[]).map(r=>({
  id:r.id,name:r.name,flags:r.flags?.[ns],
  behaviors:Array.from(r.behaviors).map(x=>({id:x.id,name:x.name,type:x.type,disabled:x.disabled,sourceLength:x.system?.source?.length,events:Array.from(x.system?.events||[])}))
 }))};
});
const actors=game.actors.contents.filter(a=>/crooked|voss|sophia|allen/i.test(a.name)).map(a=>({
 id:a.id,name:a.name,type:a.type,img:a.img,prototypeToken:a.prototypeToken?.toObject()?.texture?.src,
 flags:a.flags?.[ns],systemLevel:a.system?.details?.cr,folder:a.folder?.name
}));
const silver=game.items.get('IY8fuUG5P0yWIZIh');
const modules=Array.from(game.modules).filter(m=>m.active&&/dicebox|regionwright/i.test(m.id)).map(m=>({id:m.id,version:m.version}));
return{world:game.world.id,gm:game.user.name,scenes:data,actors,silver:{uuid:silver?.uuid,status:silver?.getFlag(ns,'cabinPuzzleItem')?.status},modules};
});
const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn23-chase-preflight-live-read.json';
writeFileSync(path,JSON.stringify(data,null,2));
console.log(JSON.stringify({actors:data.actors,scenes:data.scenes.map(s=>({id:s.id,name:s.name,map:s.map,regions:s.regions.map(r=>({id:r.id,name:r.name,flags:r.flags,behaviors:r.behaviors}))})),modules:data.modules}).slice(0,24000));
}finally{await b.close()}