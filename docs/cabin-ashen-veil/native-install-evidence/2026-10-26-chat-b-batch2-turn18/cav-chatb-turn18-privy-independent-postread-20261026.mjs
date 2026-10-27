import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const m=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-privy-copper-native-staging.js').href);
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('Exact foundry game page unavailable');
 const x=await page.evaluate(({ids})=>{
  const ns='dicebox-campaign-helper';
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
    !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('GM identity mismatch');
  const scene=game.scenes.get('xx1rWBiWMLxJPlrw');
  const regions=ids.map(z=>{const r=scene?.regions.get(z.regionId),v=r?.behaviors.get(z.behaviorId);
   return{regionId:r?.id,regionUuid:r?.uuid,name:r?.name,
      behaviorId:v?.id,behaviorUuid:v?.uuid,type:v?.type,disabled:v?.disabled,
      source:v?.system?.source,events:Array.from(v?.system?.events||[]),
      regionCount:r?.behaviors.size,shapes:r?.toObject().shapes,
      fixture:r?.getFlag(ns,'cavLatePrivyCopperFixture'),
      copperClaim:r?.getFlag(ns,'cavLateCopperClaim')??null,
      copperRetrieval:r?.getFlag(ns,'cavLatePrivyRetrieval')??null};
  });
  const exit=scene?.regions.get('zVgVWvnpPetxlF5e');
  const arrival=scene?.regions.get('663WrP9V8tPPOLvt');
  const key=game.items.get('D1LRRg4n7y7pRWvk');
  return {world:game.world.id,gm:game.user.name,scene:{
     id:scene?.id,map:scene?.background?.src,regions:scene?.regions.size,
     exit:{uuid:exit?.uuid,behavior:exit?.behaviors.get('6DZj3FUaLavsdqgA')?.type,
       disabled:exit?.behaviors.get('6DZj3FUaLavsdqgA')?.disabled},
     arrival:{uuid:arrival?.uuid,behaviors:arrival?.behaviors.size}},
    regions,originalKey:{uuid:key?.uuid,name:key?.name,type:key?.type,
      source:key?.getFlag(ns,'cabinPuzzleItem')?.status},
    actorCopies:game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>
      i.name===key?.name||i.getFlag(ns,'cavLateCopperSourceUuid')===key?.uuid).map(i=>({actor:a.id,item:i.id}))),
    veilStatus:game.scenes.get('CAVAQ01Scene0001')?.getFlag(ns,'cavCanonicalVeil')??null,
    previousGreenhouse:game.scenes.get('CAVEXT06Scene001')?.regions.get('CAVB6E433D528867')?.behaviors.get('CAVEXT06LYEMIX01')?.disabled===false,
    previousGazebo:game.scenes.get('CAVEXT05Scene001')?.regions.get('CAVEXT05LANTERN1')?.behaviors.get('CAVLANTERNIGNIT1')?.disabled===false,
    northwestBust:game.scenes.get('CAVSG01Scene0001')?.regions.get('gksvZIqj8jWdqzn7')?.behaviors.get('7nHv3rf66mG8PJJS')?.disabled===false};
 },{ids:m.PRIVY_STAGES.map(z=>({regionId:z.regionId,behaviorId:z.behaviorId}))});
 const checked=x.regions.map((r,i)=>({
  kind:m.PRIVY_STAGES[i].kind,regionUuid:r.regionUuid,behaviorUuid:r.behaviorUuid,
  exactSource:r.source?.trim()===m.privyNativeReadOnlySource(m.PRIVY_STAGES[i].kind),
  sourceSHA256:sha(r.source?.trim()||''),
  expectedSHA256:sha(m.privyNativeReadOnlySource(m.PRIVY_STAGES[i].kind)),
  disabled:r.disabled===true,behaviorCount:r.regionCount,
  stage:r.fixture?.status,
  rect:r.shapes?.[0]&&[r.shapes[0].x,r.shapes[0].y,r.shapes[0].width,r.shapes[0].height],
  expectedRect:Object.values(m.PRIVY_STAGES[i].rect),
  noReward:r.copperClaim===null&&r.copperRetrieval===null,
  events:r.events
 }));
 const pass=x.scene.id===m.PRIVY_SCENE&&x.scene.map===m.PRIVY_MAP&&
  x.scene.regions===4&&x.scene.exit.behavior==='teleportToken'&&
  x.scene.exit.disabled===false&&x.scene.arrival.behaviors===0&&
  x.originalKey.uuid===m.COPPER&&x.originalKey.source==='GM_LIBRARY_ONLY'&&
  x.actorCopies.length===0&&x.veilStatus===null&&
  checked.every(r=>r.exactSource&&r.disabled&&r.behaviorCount===1&&
    r.stage==='dormant-uncommissioned'&&r.noReward&&
    JSON.stringify(r.rect)===JSON.stringify(r.expectedRect))&&
  x.previousGreenhouse&&x.previousGazebo&&x.northwestBust;
 const report={pass,world:x.world,electedGM:x.gm,
  checked,originalPrivyExit:x.scene.exit,originalArrival:x.scene.arrival,
  originalCopper:x.originalKey,actorCopies:x.actorCopies.length,
  canonicalVeilCurrent:x.veilStatus,
  earlierGreenhousePreserved:x.previousGreenhouse,
  earlierGazeboPreserved:x.previousGazebo,
  originalNorthwestBustPreserved:x.northwestBust};
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn18-privy-independent-postread-20261026.json';
 writeFileSync(path,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(!pass)throw Error('Independent elected-GM Privy staging readback FAILED');
}finally{await b.close()}