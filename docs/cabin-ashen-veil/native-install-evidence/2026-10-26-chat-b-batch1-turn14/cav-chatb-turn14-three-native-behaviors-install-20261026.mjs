import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const commit=process.argv.includes('--commit-native-region-behaviors');
const location='C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-batch1-native-region-scripts.js';
const {nativeBatch1Script,nativeBatch1Fixtures}=await import(pathToFileURL(location).href);
const info={
 hope:{behavior:'CAVHOPECHSTBEH01',originalShapes:[1100,688,185,132]},
 wick:{behavior:'CAVWICKSHELFBEH1',originalShapes:[435,115,240,175]},
 lantern:{behavior:'CAVLANTERNBEH001',originalShapes:[920,375,105,135]}
};
const plans=nativeBatch1Fixtures().map(c=>({...c,id:info[c.kind].behavior,source:nativeBatch1Script(c.kind),
 shapes:info[c.kind].originalShapes,sha256:createHash('sha256').update(nativeBatch1Script(c.kind)).digest('hex')}));
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn14-three-native-behaviors-20261026.json';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('No exact Foundry /game page');
 const receipt=await p.evaluate(async ({plans,commit})=>{
 if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
   !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)
   throw Error('Not verified elected GM/world');
 const prereq={hope:['IY8fuUG5P0yWIZIh','Silver Tiny Key'],
   wick:['o0g8PyGRIbdwVM3m','Wick'],lantern:['CAVLAMPOIL000001','Lamp Oil']};
 const ready=plans.map(cfg=>{
   const scene=game.scenes.get(cfg.scene),r=scene?.regions.get(cfg.region);
   if(!scene||!r||r.name===null||r.behaviors.size!==0)throw Error('Changed fixture or existing behavior '+cfg.kind);
   if(r.behaviors.has(cfg.id))throw Error('Existing behavior conflict '+cfg.id);
   const src=game.items.get(prereq[cfg.kind][0]);
   if(!src||src.name!==prereq[cfg.kind][1]||src.type!=='loot')
     throw Error('Original source missing: '+cfg.kind);
   const rbox=r.toObject().shapes[0];
   const box=[rbox.x,rbox.y,rbox.width,rbox.height];
   if(JSON.stringify(box)!==JSON.stringify(cfg.shapes))throw Error('Changed source Region geometry '+cfg.kind);
   if(cfg.kind!=='wick'&&r.getFlag('dicebox-campaign-helper','cavLateBatch1')?.status!=='physical-fixture-staged')
     throw Error('Original Chat B Region flag altered '+cfg.kind);
   if(!cfg.source.includes('game.users?.activeGM?.id===game.user.id')||
      !cfg.source.includes('actor.testUserPermission'))
     throw Error('GM/source guard missing '+cfg.kind);
   return {kind:cfg.kind,sceneId:scene.id,regionUuid:r.uuid,
      regionId:r.id,regionName:r.name,priorBehaviors:r.behaviors.size,
      sourceHash:cfg.sha256,sourceLength:cfg.source.length,behaviorId:cfg.id,events:[
       'behaviorViewed','behaviorUnviewed','behaviorDeactivated','tokenMoveIn','tokenMoveWithin']};
 });
 if(!commit)return {status:'native-behaviors-preflight-pass-no-writes',world:game.world.id,
    electedGM:game.user.name,plans:ready};
 const results=[];
 for(const cfg of plans){
   const scene=game.scenes.get(cfg.scene),r=scene?.regions.get(cfg.region);
   const behavior={_id:cfg.id,name:'Chat B late '+cfg.kind+' — GM guarded actions',
    type:'executeScript',disabled:false,system:{events:[
       'behaviorViewed','behaviorUnviewed','behaviorDeactivated','tokenMoveIn','tokenMoveWithin'],source:cfg.source}};
   const made=await r.createEmbeddedDocuments('RegionBehavior',[behavior],{keepId:true});
   const got=r.behaviors.get(cfg.id);
   if(made.length!==1||!got||got.type!=='executeScript'||got.disabled!==false||
      got.system.source!==cfg.source||r.behaviors.size!==1)
     throw Error('Partial native Region behavior write '+cfg.kind+'; do not replay');
   results.push({kind:cfg.kind,regionUuid:r.uuid,behaviorUuid:got.uuid,
     behaviorId:got.id,disabled:got.disabled,events:Array.from(got.system.events),
     sourceLength:got.system.source.length,sourceHash:cfg.sha256});
 }
 return {status:'native-behaviors-installed-and-reread',world:game.world.id,gm:game.user.name,
    created:results,priorPlans:ready};
 },{plans,commit});
 writeFileSync(out,JSON.stringify(receipt,null,2));
 console.log(JSON.stringify(receipt));
}finally{await b.close();}