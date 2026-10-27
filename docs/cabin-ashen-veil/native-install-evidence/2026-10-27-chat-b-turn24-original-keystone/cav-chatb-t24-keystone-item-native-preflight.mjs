import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact GM game tab absent');
 const v=await p.evaluate(()=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
    !game.user?.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong GM');
  const vault=game.scenes.get('tjTpG2RVZNoCqRLh'),
   outer=game.scenes.get('CN5fkK2QLUELBGGR'),ref=game.scenes.get('ywpIpQDrkMLIgUP0');
  const plinth=vault?.regions.get('CAVB799A5357A114'),
   wall=outer?.regions.get('CAVB67AABD1B35C6');
  const originals=['1n5LONw3nYIy61O9','o9G3UJjEe2QX1ZH0','t9uCIpsKeSvtC31w','vbDWTbnAZg65ErSS']
   .map(id=>{const i=game.items.get(id);return{id,name:i?.name,type:i?.type,
    uuid:i?.uuid,folder:i?.folder?.id,
    folderName:i?.folder?.name,img:i?.img,system:i?.system?.toObject?.()??i?.system,
    ownership:i?.ownership,flags:i?.flags?.[ns]}});
  const existing=game.items.contents.filter(i=>/keystone/i.test(i.name)).map(i=>({uuid:i.uuid,name:i.name,type:i.type}));
  const actorCopies=game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>/keystone/i.test(i.name)).map(i=>({actor:a.id,item:i.id,name:i.name})));
  return{world:game.world.id,version:game.version,systemId:game.system.id,systemVersion:game.system.version,gm:game.user.name,
   itemFolders:game.folders.contents.filter(f=>f.type==='Item'&&/puzzle|cabin|quest/i.test(f.name)).map(f=>({id:f.id,name:f.name,folder:f.folder?.id??null})),
   originals,existing,actorCopies,
   vault:{uuid:vault?.uuid,name:vault?.name,art:vault?.background.src,count:vault?.regions.size,
     plinth:plinth&&{uuid:plinth.uuid,name:plinth.name,shape:plinth.toObject().shapes,behaviorCount:plinth.behaviors.size,flags:plinth.flags?.[ns]}},
   outer:{uuid:outer?.uuid,wall:wall&&{uuid:wall.uuid,behaviors:Array.from(wall.behaviors).map(b=>({id:b.id,disabled:b.disabled}))}},
   refuge:{uuid:ref?.uuid,regions:ref?.regions.size}};
 });
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t24-keystone-item-preflight.json';
 writeFileSync(path,JSON.stringify(v,null,2));
 console.log(JSON.stringify(v).slice(0,13000));
}finally{await b.close()}