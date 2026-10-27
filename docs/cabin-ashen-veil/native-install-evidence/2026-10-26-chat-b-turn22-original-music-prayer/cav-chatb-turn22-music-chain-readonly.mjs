import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('Exact GM world tab missing');
const x=await p.evaluate(()=>{
const ns='dicebox-campaign-helper';
if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('GM wrong');
const s=game.scenes.get('CAVHU04Scene0001'),hope=s?.regions.get('CAVHU04HOPECHST1');
const sg=game.scenes.get('CAVSG01Scene0001');
const original=['IY8fuUG5P0yWIZIh','YaKs6z2AWlEAlyzx','5jwy75XyFezukf3b'].map(id=>{
 const i=game.items.get(id);return{id,uuid:i?.uuid,name:i?.name,type:i?.type,
 img:i?.img,sourceStatus:i?.getFlag(ns,'cabinPuzzleItem')?.status,
 prayerJournal:i?.getFlag(ns,'cavFullPrayerJournalUuid'),
 descriptionLength:i?.system?.description?.value?.length,
 flags:i?.flags?.[ns]};
});
const actors=game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>
 /Silver Tiny Key|Ornate Music Box|Prayer of Protection/.test(i.name)).map(i=>({
 actorId:a.id,actorName:a.name,itemId:i.id,name:i.name,flags:i.flags?.[ns]})));
return{world:game.world.id,gm:game.user.name,
 scene:{id:s?.id,name:s?.name,art:s?.background.src,width:s?.width,height:s?.height,regionCount:s?.regions.size,
 regions:Array.from(s?.regions||[]).map(r=>({id:r.id,name:r.name,shapes:r.toObject().shapes,
 flags:r.flags?.[ns],behaviors:Array.from(r.behaviors).map(b=>({id:b.id,name:b.name,type:b.type,disabled:b.disabled,
 events:Array.from(b.system?.events||[]),sourceLength:b.system?.source?.length}))}))},
 silver:sg&&{sceneId:sg.id,regions:Array.from(sg.regions).filter(r=>/Silver|Chase|Crooked/i.test(r.name)).map(r=>({id:r.id,name:r.name,flags:r.flags?.[ns],behaviors:Array.from(r.behaviors).map(b=>({id:b.id,disabled:b.disabled}))}))},
 original,actors,
 journal:game.journal.get('CAVPRAYERPROTECT')&&{uuid:game.journal.get('CAVPRAYERPROTECT').uuid,
 ownership:game.journal.get('CAVPRAYERPROTECT').ownership,
 pages:game.journal.get('CAVPRAYERPROTECT').pages.size},
 studioSune:game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVSUNEACTION001')?.behaviors.get('CAVSUNEPRAYBEH01')?.disabled===true,
 studioEast:game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVSUNEEASTPASS1')?.behaviors.get('CAVSUNEOUTTELE01')?.disabled===true
};
});
const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn22-music-chain-readonly.json';
writeFileSync(path,JSON.stringify(x,null,2));console.log(JSON.stringify(x).slice(0,16000));
}finally{await b.close()}