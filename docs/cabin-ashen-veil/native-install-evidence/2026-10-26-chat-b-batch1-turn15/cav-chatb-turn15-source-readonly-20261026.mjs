import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try {
 const page=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('Exact active game page missing');
 const data=await page.evaluate(()=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Exact GM/world mismatch');
  const scenes=['CAVAQ01Scene0001','CAVEXT02Scene001','CAVSG01Scene0001','CAVHG05Scene0001','CAVHG07Scene0001','CAVHU08Scene0001'];
  const out=scenes.map(id=>{
    const s=game.scenes.get(id);
    return {id,name:s?.name,exists:!!s,map:s?.background?.src,
      flags:s?.flags?.[ns],
      regions:Array.from(s?.regions||[]).map(r=>({
       id:r.id,name:r.name,
       shapes:r.toObject().shapes.map(v=>({type:v.type,x:v.x,y:v.y,w:v.width,h:v.height,points:v.points?.length})),
       flags:r.flags?.[ns],
       behaviors:Array.from(r.behaviors).map(b=>({id:b.id,type:b.type,disabled:b.disabled}))
      }))};
  });
  const gmJournal=Array.from(game.journal||[]).filter(j=>/prayer|music box|protect|allen.*warn|chase/i.test(j.name)).map(j=>({name:j.name,uuid:j.uuid,pages:Array.from(j.pages).map(x=>({name:x.name,type:x.type,chars:x.text?.content?.length||0}))}));
  const actor=Array.from(game.actors).filter(a=>/crooked/i.test(a.name)).map(a=>({name:a.name,uuid:a.uuid}));
  return {scenes:out,gmJournal,actor};
 });
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn15-source-readonly-20261026.json';
 writeFileSync(out,JSON.stringify(data,null,2));
 console.log(JSON.stringify({sceneCount:data.scenes.length,scenes:data.scenes,gmJournal:data.gmJournal,actor:data.actor}).slice(0,25000));
}finally{await b.close()}