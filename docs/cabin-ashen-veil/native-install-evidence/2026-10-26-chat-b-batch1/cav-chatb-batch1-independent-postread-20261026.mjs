import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('Missing exact Foundry game page');
 const data=await page.evaluate(()=>{
   const ns='dicebox-campaign-helper';
   if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||
      game.users?.activeGM?.id!==game.user.id)throw Error('Wrong world/elected GM');
   const names=['Silver Tiny Key','Ornate Music Box','Prayer of Protection','Wick'];
   const items=names.map(name=>{
      const matches=Array.from(game.items).filter(i=>i.name===name);
      const i=matches[0];
      const actors=Array.from(game.actors).flatMap(a=>Array.from(a.items).filter(i=>i.name===name).map(i=>({actor:a.id,id:i.id})));
      return {name,worldCount:matches.length,sourceId:i?.id,folderId:i?.folder?.id,type:i?.type,
       flag:i?.getFlag(ns,'cabinPuzzleItem'),descriptionPresent:!!i?.system?.description?.value,
       actorCopies:actors.length};
   });
   const fixtures=[
    {scene:'CAVHU04Scene0001',id:'CAVHU04HOPECHST1',purpose:'chest-and-music-box',shape:[1100,688,185,132]},
    {scene:'CAVEXT05Scene001',id:'CAVEXT05LANTERN1',purpose:'gazebo-lantern',shape:[920,375,105,135]}
   ].map(c=>{
     const s=game.scenes.get(c.scene),r=s?.regions.get(c.id),rect=r?.toObject().shapes?.[0];
     return {scene:c.scene,id:c.id,exists:!!r,name:r?.name,behaviors:r?.behaviors?.size,
       shape:rect?[rect.x,rect.y,rect.width,rect.height]:null,
       flagged:r?.getFlag(ns,'cavLateBatch1'),expectedShape:c.shape};
   });
   const notable=[
    ['CAVHU05Scene0001','CAVB0FDF8543F6D9'],
    ['CAVSG01Scene0001','gksvZIqj8jWdqzn7'],
    ['CAVHG05Scene0001','CAVHG05RETURN001']
   ].map(([s,r])=>({scene:s,region:r,exists:!!game.scenes.get(s)?.regions.get(r),
      behaviorCount:game.scenes.get(s)?.regions.get(r)?.behaviors?.size}));
   const pass=items.every(i=>i.worldCount===1&&i.folderId==='N6X80ycvxaPIszHg'&&
     i.type==='loot'&&i.flag?.status==='GM_LIBRARY_ONLY'&&i.actorCopies===0&&i.descriptionPresent)&&
     fixtures.every(r=>r.exists&&r.behaviors===0&&r.flagged?.status==='physical-fixture-staged'&&
       JSON.stringify(r.shape)===JSON.stringify(r.expectedShape))&&notable.every(x=>x.exists);
   return {world:game.world.id,gm:game.user.name,pass,items,fixtures,notable,
       sceneCount:game.scenes.size};
 });
 const filename='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-batch1-independent-postread-20261026.json';
 writeFileSync(filename,JSON.stringify(data,null,2));
 console.log(JSON.stringify({pass:data.pass,world:data.world,gm:data.gm,items:data.items,
   regions:data.fixtures,notable:data.notable,sceneCount:data.sceneCount}));
 if(!data.pass)throw Error('Independent Foundry postread mismatch');
}finally{await b.close();}