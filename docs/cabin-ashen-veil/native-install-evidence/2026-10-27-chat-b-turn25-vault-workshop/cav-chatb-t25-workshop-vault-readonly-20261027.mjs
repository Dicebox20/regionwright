import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('Current GM tab missing');
const v=await p.evaluate(()=>{
const ns='dicebox-campaign-helper';
if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
!game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Wrong GM world');
return{
 world:game.world.id,gm:game.user.name,
 scenes:['G6NMonfCwMvNzipL','tjTpG2RVZNoCqRLh'].map(id=>{
  const s=game.scenes.get(id);return{id,uuid:s?.uuid,name:s?.name,
   map:s?.background.src,width:s?.width,height:s?.height,
   grid:s?.grid.size,wallCount:s?.walls.size,lights:s?.lights.size,
   regions:Array.from(s?.regions||[]).map(r=>({id:r.id,name:r.name,
    shapes:r.toObject().shapes,flags:r.flags?.[ns],
    behaviors:Array.from(r.behaviors).map(x=>({id:x.id,name:x.name,type:x.type,
    disabled:x.disabled,events:Array.from(x.system?.events||[]),
    sourceLength:x.system?.source?.length,destinations:Array.from(x.system?.destinations||[])}))})),
   tokens:Array.from(s?.tokens||[]).map(t=>({id:t.id,name:t.name,x:t.x,y:t.y,width:t.width,height:t.height})),
   tiles:Array.from(s?.tiles||[]).map(t=>({id:t.id,x:t.x,y:t.y,width:t.width,height:t.height}))
  }
 }),
 originals:['pbmUZPfC3WnsBRgi','o9G3UJjEe2QX1ZH0','t9uCIpsKeSvtC31w','vbDWTbnAZg65ErSS','CAVKEYSTONEITEM1'].map(id=>{const i=game.items.get(id);return{
 uuid:i?.uuid,name:i?.name,type:i?.type,status:i?.getFlag(ns,'cabinPuzzleItem')?.status,
 flags:i?.flags?.[ns]}}),
 actorCopies:game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>/Gondian Power Source|Gond Emblem Half|Sune Emblem Half|Keystone/.test(i.name)).map(i=>({actor:a.id,item:i.id,name:i.name,flags:i.flags?.[ns]}))),
 vaultGeneralFlags:game.scenes.get('tjTpG2RVZNoCqRLh')?.flags?.[ns],
 workshopGeneralFlags:game.scenes.get('G6NMonfCwMvNzipL')?.flags?.[ns]
};
});
writeFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t25-workshop-vault-census.json',JSON.stringify(v,null,2));
console.log(JSON.stringify(v).slice(0,19000));
}finally{await b.close()}