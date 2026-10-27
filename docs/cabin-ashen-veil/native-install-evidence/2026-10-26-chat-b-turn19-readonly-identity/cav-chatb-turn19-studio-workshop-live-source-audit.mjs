import{chromium}from'playwright-core';
import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('Exact GM tab unavailable');
 const r=await page.evaluate(()=>{
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
  !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('GM/world mismatch');
  const ids=['CAVHU07Scene0001','CAVHU08Scene0001','CAVHG07Scene0001','CAVHG08Scene0001'];
  const scenes=ids.map(id=>{const s=game.scenes.get(id);return{
   id,exists:!!s,name:s?.name,art:s?.background.src,
   regions:Array.from(s?.regions||[]).map(r=>({id:r.id,name:r.name,
   shapes:r.toObject().shapes.map(z=>({x:z.x,y:z.y,width:z.width,height:z.height,type:z.type})),
   behaviors:Array.from(r.behaviors).map(b=>({id:b.id,type:b.type,disabled:b.disabled}))}))
  }});
  const ns='dicebox-campaign-helper';
  return{world:game.world.id,gm:game.user.name,
    scenes,prayers:Array.from(game.items).filter(i=>/Prayer of (Protection|Devotion)/i.test(i.name)).map(i=>({name:i.name,uuid:i.uuid,description:i.system?.description?.value||'',library:i.getFlag(ns,'cabinPuzzleItem')?.status})),
    journals:Array.from(game.journal).filter(j=>/Prayer of (Protection|Devotion)/i.test(j.name)).map(j=>({name:j.name,id:j.id,pages:j.pages.size})),
    actorDevotionCopies:game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>/Prayer of Devotion/i.test(i.name)).map(i=>({actor:a.id,item:i.id})))
  };
 });
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn19-studio-workshop-live-source-audit.json';
 writeFileSync(path,JSON.stringify(r,null,2));
 console.log(JSON.stringify({world:r.world,gm:r.gm,scenes:r.scenes.map(s=>({id:s.id,exists:s.exists,name:s.name,art:s.art,regions:s.regions.map(x=>({id:x.id,name:x.name,behaviors:x.behaviors}))})),prayers:r.prayers.map(x=>({name:x.name,uuid:x.uuid,descriptionLength:x.description.length,library:x.library})),journals:r.journals,actorDevotionCopies:r.actorDevotionCopies}).slice(0,10000));
}finally{await b.close()}