import{chromium}from'playwright-core';
import{writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{pathToFileURL}from'node:url';
const {nativeBatch1Script}=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-batch1-native-region-scripts.js').href);
const plans=[
{kind:'hope',scene:'CAVHU04Scene0001',region:'CAVHU04HOPECHST1',behavior:'CAVHOPECHSTBEH01',ledgers:['cavLateHopeChestUnlock','cavLateMusicBoxClaim']},
{kind:'wick',scene:'CAVHU08Scene0001',region:'CAVBE5639AEC2179',behavior:'CAVWICKSHELFBEH1',ledgers:['cavLateWickClaim']},
{kind:'lantern',scene:'CAVEXT05Scene001',region:'CAVEXT05LANTERN1',behavior:'CAVLANTERNBEH001',ledgers:['cavLateGazeboOil','cavLateGazeboWick']}
].map(p=>({...p,source:nativeBatch1Script(p.kind).trim()}));
const hash=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Missing exact game');
 const live=await p.evaluate(({plans})=>{
  const NS='dicebox-campaign-helper';
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
    !game.user.isGM||game.users.activeGM?.id!==game.user.id)throw Error('GM context invalid');
  const regions=plans.map(c=>{
    const region=game.scenes.get(c.scene)?.regions.get(c.region);
    const beh=region?.behaviors.get(c.behavior);
    return {kind:c.kind,regionUuid:region?.uuid,regionName:region?.name,behaviorUuid:beh?.uuid,
      behaviorId:beh?.id,type:beh?.type,disabled:beh?.disabled,behaviorCount:region?.behaviors.size,
      source:beh?.system.source,events:Array.from(beh?.system?.events||[]),
      ledgers:c.ledgers.map(l=>({name:l,status:region?.getFlag(NS,l)?.status??'none'}))};
  });
  const actorItems=Array.from(game.actors).flatMap(a=>Array.from(a.items).filter(i=>
    ['Silver Tiny Key','Ornate Music Box','Prayer of Protection','Wick'].includes(i.name)).map(i=>({actor:a.id,item:i.name})));
  const lib=['Silver Tiny Key','Ornate Music Box','Prayer of Protection','Wick'].map(n=>{
    const a=Array.from(game.items).filter(i=>i.name===n);
    return{name:n,count:a.length,sourceUuid:a[0]?.uuid,flag:a[0]?.getFlag(NS,'cabinPuzzleItem')?.status}
  });
  return{world:game.world.id,gm:game.user.name,regions,actorItems,library:lib,
      originalStudyReturnExists:!!game.scenes.get('CAVHG05Scene0001')?.regions.get('CAVHG05RETURN001'),
      originalNorthwestWinderExists:!!game.scenes.get('CAVSG01Scene0001')?.regions.get('gksvZIqj8jWdqzn7')?.behaviors.get('7nHv3rf66mG8PJJS')};
 },{plans:plans.map(({source,...rest})=>rest)});
 const checks=live.regions.map((r,i)=>({
   kind:r.kind,sourceMatches:r.source===plans[i].source,
   hash:hash(r.source||''),expectedHash:hash(plans[i].source),
   eventsMatch:JSON.stringify(r.events)===JSON.stringify(['behaviorViewed','behaviorUnviewed','behaviorDeactivated','tokenMoveIn','tokenMoveWithin']),
   zeroPuzzleProgress:r.ledgers.every(x=>x.status==='none'),
   behaviorOk:r.behaviorCount===1&&r.type==='executeScript'&&r.disabled===false
 }));
 const pass=checks.every(c=>c.sourceMatches&&c.eventsMatch&&c.zeroPuzzleProgress&&c.behaviorOk)&&
   live.actorItems.length===0&&live.library.every(i=>i.count===1&&i.flag==='GM_LIBRARY_ONLY')&&
   live.originalStudyReturnExists&&live.originalNorthwestWinderExists;
 const report={world:live.world,gm:live.gm,pass,checks,library:live.library,
   actorCopies:live.actorItems.length,originalStudyReturnExists:live.originalStudyReturnExists,
   originalNorthwestWinderExists:live.originalNorthwestWinderExists};
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn14-native-independent-postread-20261026.json';
 writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(!pass)throw Error('Native readback audit failed; do not claim staged behavior success');
}finally{await b.close()}