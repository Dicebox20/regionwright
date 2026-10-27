import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const m=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-privy-copper-native-staging.js').href);
const commit=process.argv.includes('--commit-approved-privy-physical');
const plans=m.PRIVY_STAGES.map(c=>({...c,script:m.privyNativeReadOnlySource(c.kind),
 sha256:createHash('sha256').update(m.privyNativeReadOnlySource(c.kind)).digest('hex')}));
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact active Foundry /game tab missing');
 const data=await p.evaluate(async({plans,commit,sceneId,art,returnId,arrivalId,sourceUuid})=>{
  const ns='dicebox-campaign-helper';
  if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
    game.version!=='14.367'||!game.user?.isGM||
    game.users?.activeGM?.id!==game.user.id)throw Error('Wrong world/GM');
  const s=game.scenes.get(sceneId);
  if(!s||s.name!=='EXT-04 - Privy'||s.background.src!==art||
    s.width!==1254||s.height!==1254)throw Error('Owner approved Privy map/scene differs');
  const leave=s.regions.get(returnId),arrival=s.regions.get(arrivalId);
  if(!leave||!arrival||leave.behaviors.get('6DZj3FUaLavsdqgA')?.disabled!==false||
   leave.behaviors.get('6DZj3FUaLavsdqgA')?.type!=='teleportToken'||
   arrival.behaviors.size!==0)throw Error('Original Privy portals no longer match');
  const item=game.items.get(sourceUuid.split('.')[1]);
  if(!item||item.uuid!==sourceUuid||item.name!=='Copper Tiny Key'||item.type!=='loot'||
   item.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')throw Error('Original Copper Key changed');
  if(game.actors.contents.some(a=>a.items.some(i=>i.name===item.name||
    i.getFlag(ns,'cavLateCopperSourceUuid')===sourceUuid)))
   throw Error('Original Copper already given; reconcile');
  if(game.scenes.get('CAVAQ01Scene0001')?.getFlag(ns,'cavCanonicalVeil'))
   throw Error('Current canonical Veil proof changed; do not stage against stale state');
  const intersects=(x,y,w,h,a,b,c,d)=>x<c+w&&false; // intentionally unused; bounds checked below
  const collision=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  const installed=[];
  for(const q of plans){
   const rect=q.rect;
   if(q.regionId.length!==16||q.behaviorId.length!==16||s.regions.has(q.regionId)||
     Array.from(s.regions).some(r=>r.getFlag(ns,'cavLatePrivyCopperFixture')?.kind===q.kind))
     throw Error('Existing native Privy stage or bad static ID '+q.kind);
   if(rect.x<0||rect.y<0||rect.x+rect.width>s.width||rect.y+rect.height>s.height)
     throw Error('Out of bound Privy stage');
   for(const existing of s.regions)for(const sh of existing.toObject().shapes){
     if(sh.type==='rectangle'&&collision(rect,sh))
       throw Error('Privy stage collides with existing native Region '+existing.id);
   }
   if(Array.from(s.tokens).some(t=>collision(rect,{x:t.x,y:t.y,
     width:t.width*s.grid.size,height:t.height*s.grid.size})))
     throw Error('Token on proposed fixture');
   if(!q.script.includes("game?.world?.id!=='cabin-in-the-ashen-veil'")||
      q.script.includes('createEmbeddedDocuments')||q.script.includes('setFlag('))
      throw Error('Dormant native source not immutable');
   installed.push({id:q.regionId,rect,behaviorId:q.behaviorId,hash:q.sha256,sourceLength:q.script.length});
  }
  if(collision(plans[0].rect,plans[1].rect))throw Error('Privy stages overlap each other');
  const current={world:game.world.id,gm:game.user.name,sourceScene:s.id,
    originalExit:leave.uuid,originalArrival:arrival.uuid,originalCopper:item.uuid,
    currentRegions:s.regions.size,currentTokens:s.tokens.size,
    newStages:installed};
  if(!commit)return{status:'two-privy-copper-fixtures-preflight-pass-no-writes',current};
  const payload=plans.map(q=>({
   _id:q.regionId,name:q.name,color:'#ba9a68',visibility:0,
   shapes:[{type:'rectangle',x:q.rect.x,y:q.rect.y,width:q.rect.width,
      height:q.rect.height,rotation:0,hole:false}],
   behaviors:[{_id:q.behaviorId,name:'LATE Copper — DISABLED until canonical Crimson Veil',
      type:'executeScript',disabled:true,
      system:{events:['behaviorViewed','behaviorUnviewed','behaviorDeactivated'],source:q.script}}],
   flags:{[ns]:{cavLatePrivyCopperFixture:{version:1,status:'dormant-uncommissioned',
     kind:q.kind,approvedSource:'owner-approved-ext04-v001',
     nativeGameplayTested:false,
     gating:'canonical AQ01 original Gondian charge and Crimson Veil, true player retrieval'}}}
  }));
  const made=await s.createEmbeddedDocuments('Region',payload,{keepId:true});
  const verified=plans.map(q=>{
    const r=s.regions.get(q.regionId),rb=r?.behaviors.get(q.behaviorId);
    if(!r||!rb||rb.type!=='executeScript'||rb.disabled!==true||
      rb.system.source.trim()!==q.script.trim()||r.behaviors.size!==1||
      r.getFlag(ns,'cavLatePrivyCopperFixture')?.status!=='dormant-uncommissioned')
      throw Error('Native partially staged; STOP; do not rerun, inspect current world');
    return{regionUuid:r.uuid,behaviorUuid:rb.uuid,disabled:rb.disabled,
      behaviorEvents:Array.from(rb.system.events),rect:r.toObject().shapes[0],
      sha256:q.sha256};
  });
  if(made.length!==2||s.regions.size!==current.currentRegions+2)
   throw Error('Native creation count uncertain: stop for independent readback');
  return{status:'two-original-privy-copper-dormant-physical-fixtures-installed',
    prior:current,created:verified};
 },{plans,commit,sceneId:m.PRIVY_SCENE,art:m.PRIVY_MAP,
    returnId:m.PRIVY_RETURN,arrivalId:m.PRIVY_ARRIVAL,sourceUuid:m.COPPER});
 const dest='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn18-privy-copper-native-install-20261026.json';
 writeFileSync(dest,JSON.stringify(data,null,2));console.log(JSON.stringify(data));
}finally{await b.close()}