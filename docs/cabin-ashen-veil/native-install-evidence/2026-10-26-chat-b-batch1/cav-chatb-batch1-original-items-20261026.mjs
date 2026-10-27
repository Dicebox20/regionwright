import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
const commit=process.argv.includes('--commit-approved-batch1');
const items=[
 {name:'Silver Tiny Key',desc:'A small silver key dropped by the Crooked Man after the second chase near the northwest grove bust. Opens the original Hope Chest in the Parents’ bedroom. The key is not awarded automatically when the chase completes.',img:'icons/sundries/misc/key-steel.webp'},
 {name:'Ornate Music Box',desc:'The family music box recovered from the Hope Chest in the Parents’ bedroom. Contains the original Prayer of Protection, claimed and read through separate story interactions.',img:'icons/svg/item-bag.svg'},
 {name:'Prayer of Protection',desc:'A family prayer found inside the Ornate Music Box. Its complete owner-approved text and separate readable Journal must be verified before player handout. Reading it at Dahlia’s Art Studio Sune altar reveals the concealed Candle Workshop passage.',img:'icons/svg/item-bag.svg'},
 {name:'Wick',desc:'A single candle wick recovered from the concealed Candle Workshop after the original Prayer of Protection opens the passage. At the Forgotten Gazebo this Wick and Lamp Oil are installed separately, in either order.',img:'icons/sundries/lights/candle-unlit-grey.webp'}
];
const output='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-batch1-original-items-20261026.json';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p) throw Error('Exact /game Foundry page not present');
 const result=await p.evaluate(async ({items,commit})=>{
  if(game?.world?.id!=='cabin-in-the-ashen-veil'||!game?.ready||!game?.user?.isGM||
     game.users?.activeGM?.id!==game.user.id)throw Error('Wrong exact world or non-elected GM');
  const folder=game.folders.contents.find(f=>f.type==='Item'&&f.name.includes('Cabin in the Ashen Veil')&&f.name.includes('Puzzle Items'));
  if(!folder||folder.id!=='N6X80ycvxaPIszHg')throw Error('Original Oct24 Item folder missing or replaced');
  const names=items.map(x=>x.name.toLowerCase());
  const collisions=Array.from(game.items).filter(x=>names.includes(x.name.trim().toLowerCase())).map(x=>({name:x.name,uuid:x.uuid,folder:x.folder?.id}));
  const actorCollisions=Array.from(game.actors).flatMap(a=>Array.from(a.items).filter(x=>names.includes(x.name.trim().toLowerCase())).map(x=>({actor:a.id,name:x.name,source:x.flags?.['dicebox-campaign-helper']?.cabinPuzzleItem})));
  if(collisions.length||actorCollisions.length)throw Error('Potential existing original reward Item; stop for GM reconciliation: '+JSON.stringify({collisions,actorCollisions}));
  const reference=game.items.get('pbmUZPfC3WnsBRgi');
  if(!reference||reference.name!=='Uncharged Gondian Power Source')throw Error('Original campaign Item source identity failed');
  const check={world:game.world.id,gm:game.user.name,folderId:folder.id,
   requested:items.map(x=>x.name),collisionCount:0,actorCollisionCount:0,originalGondianSourceVerified:true,commit};
  if(!commit)return { ...check,status:'preflight-pass-no-writes' };
  const docs=items.map(x=>({name:x.name,type:'loot',folder:folder.id,
   img:x.img,system:{quantity:1,description:{value:'<p>'+x.desc.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</p>'}},
   flags:{'dicebox-campaign-helper':{cabinPuzzleItem:{source:'2026-10-26-owner-approved-batch1',status:'GM_LIBRARY_ONLY',itemKey:x.name}}}}));
  // Native multi-document Item creation is not ACID; on failure halt and inspect.
  const created=await Item.createDocuments(docs);
  const result=created.map(x=>{
   const y=game.items.get(x.id);
   return {id:x.id,uuid:x.uuid,name:x.name,type:x.type,folderId:x.folder?.id,
      foundInWorld:!!y,flag:y?.getFlag('dicebox-campaign-helper','cabinPuzzleItem'),descriptionOk:!!y?.system?.description?.value,img:y?.img};
  });
  if(result.length!==4||result.some(x=>!x.foundInWorld||x.folderId!==folder.id||
     x.flag?.status!=='GM_LIBRARY_ONLY'||!x.descriptionOk))
    throw Error('Partial world Item creation; halt, do not replay. Current result: '+JSON.stringify(result));
  return {...check,status:'created-verified-no-actor-grants',items:result};
 },{items,commit});
 writeFileSync(output,JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}finally{await b.close();}