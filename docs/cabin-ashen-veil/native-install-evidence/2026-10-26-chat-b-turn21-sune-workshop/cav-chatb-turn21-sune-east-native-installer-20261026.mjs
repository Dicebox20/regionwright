import{chromium}from'playwright-core';
import{writeFileSync}from'node:fs';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-sune-east-route-native-staging.js').href);
if(!cfg.physicalPlanInvariant())throw Error('physical plan invariant failed');
const plans=cfg.STAGES.map(stage=>({
 ...stage,behavior:!stage.behaviorId?null:
  stage.behaviorKind==='executeScript'?cfg.altarBehaviorData():
  cfg.teleportBehaviorData(stage)
}));
const commit=process.argv.includes('--commit-original-sune-route-dormant-physical');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Expected elected GM page missing');
 const report=await p.evaluate(async({plans,commit,studio,workshop})=>{
 const ns='dicebox-campaign-helper';
 if(!game?.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
   !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('GM identity/world invalid');
 const s=game.scenes.get(studio.id),w=game.scenes.get(workshop.id);
 for(const [original,expected] of [[s,studio],[w,workshop]]){
  if(!original||original.name!==expected.name||original.background.src!==expected.art||
    original.width!==expected.width||original.height!==expected.height)
   throw Error('Approved original Studio/Workshop scene or art changed');
 }
 const vanity=s.regions.get('CAVVANITYREG0001'),wick=w.regions.get('CAVBE5639AEC2179');
 if(!vanity||!wick||
    vanity.behaviors.get('CAVVANITYBEH0001')?.disabled!==false||
    wick.behaviors.get('CAVWICKSHELFBEH1')?.disabled!==false||
    s.regions.size!==3||w.regions.size!==2)throw Error('Peer-original Regions or source scene counts changed');
 if(!game.journal.get('CAVPRAYERPROTECT')||
    game.items.get('5jwy75XyFezukf3b')?.getFlag(ns,'cavFullPrayerJournalUuid')!=='JournalEntry.CAVPRAYERPROTECT')
   throw Error('Author-approved original Protection prayer missing');
 const noItemCopies=!game.actors.contents.some(a=>Array.from(a.items).some(i=>
   i.name==='Prayer of Protection'||i.getFlag(ns,'cavFullPrayerOriginalSourceUuid')==='Item.5jwy75XyFezukf3b'));
 if(!noItemCopies)throw Error('Protection already in actor custody; reassess commissioning');
 const overlaps=(a,c)=>a.x<c.x+c.width&&a.x+a.width>c.x&&a.y<c.y+c.height&&a.y+a.height>c.y;
 const staged=[];
 for(const stage of plans){
  const scene=game.scenes.get(stage.sceneId);
  if(stage.id.length!==16||scene.regions.get(stage.id)||
     Array.from(scene.regions).some(r=>r.getFlag(ns,'cavLateSuneEastFixture')?.kind===stage.kind))
    throw Error('New Region ID/collision/duplicate '+stage.kind);
  if(stage.behaviorId&&stage.behaviorId.length!==16||stage.behavior?.disabled===false)
    throw Error('Non-inert proposed original passage '+stage.kind);
  if(stage.behavior?.type==='executeScript'&&
    (stage.behavior.system.source.includes('createEmbeddedDocuments')||
     stage.behavior.system.source.includes('setFlag(')))
     throw Error('Unsafe proposed altar native code');
  const r=stage.rect;
  if(r.x<0||r.y<0||r.x+r.width>scene.width||r.y+r.height>scene.height)
   throw Error('Out-of-bounds proposed original fixture');
  for(const existing of scene.regions){
   for(const q of existing.toObject().shapes)if(q.type==='rectangle'&&overlaps(r,q))
    throw Error('Overlap existing native Region '+stage.kind+' / '+existing.id);
  }
  for(const token of scene.tokens){
   const q={x:token.x,y:token.y,width:token.width*scene.grid.size,height:token.height*scene.grid.size};
   if(overlaps(r,q))throw Error('Actor token on proposed fixture '+stage.kind);
  }
  staged.push({kind:stage.kind,id:stage.id,sceneId:stage.sceneId,
   shape:stage.rect,behaviorId:stage.behaviorId??null,
   behaviorDisabled:stage.behavior?.disabled??null,
   destination:stage.behavior?.system?.destinations??[]});
 }
 for(let i=0;i<plans.length;i++)for(let j=i+1;j<plans.length;j++){
  if(plans[i].sceneId===plans[j].sceneId&&overlaps(plans[i].rect,plans[j].rect))
   throw Error('New fixtures overlap each other');
 }
 const context={world:game.world.id,gm:game.user.name,
  existingStudioRegions:s.regions.size,existingWorkshopRegions:w.regions.size,
  originalVanity:vanity.uuid,originalWick:wick.uuid,
  originalPrayer:'Item.5jwy75XyFezukf3b',
  actorProtectionCopies:0,proposals:staged};
 if(!commit)return{status:'five-physical-regions-preflight-pass-no-writes',context};
 // ORIGINAL passive endpoints FIRST. Future sealed native teleportToken destination
 // validation must refer only to already-existing original Region UUIDs.
 const nativeData=q=>({
  _id:q.id,name:q.name,visibility:0,color:'#bf8155',
  shapes:[{type:'rectangle',x:q.rect.x,y:q.rect.y,
   width:q.rect.width,height:q.rect.height,rotation:0,hole:false}],
  behaviors:q.behavior?[q.behavior]:[],
  flags:{[ns]:{cavLateSuneEastFixture:{
    version:1,kind:q.kind,storyCode:q.sceneId===studio.id?'H-U07':'H-U08',
    originalMapVerified:true,status:'dormant-uncommissioned',
    canonicalGate:'Music Box original Protection Item; elected GM explicit altar reading',
    nativePlayerTested:false}}}
 });
 const passive=plans.filter(q=>!q.behaviorId),behavioral=plans.filter(q=>!!q.behaviorId);
 const receipts=[];
 for(const group of [passive,behavioral]){
  for(const sceneId of [studio.id,workshop.id]){
   const rows=group.filter(q=>q.sceneId===sceneId);
   if(!rows.length)continue;
   const scene=game.scenes.get(sceneId);
   const docs=await scene.createEmbeddedDocuments('Region',rows.map(nativeData),{keepId:true});
   if(docs.length!==rows.length)throw Error('Partial scene Region create: STOP, never automatically replay');
   for(const q of rows){
    const actual=scene.regions.get(q.id);
    const b=q.behaviorId?actual?.behaviors.get(q.behaviorId):null;
    if(!actual||actual.id!==q.id||
       actual.getFlag(ns,'cavLateSuneEastFixture')?.status!=='dormant-uncommissioned'||
       (q.behaviorId&&(!b||b.disabled!==true||b.type!==q.behavior.type||
         actual.behaviors.size!==1))||
       (!q.behaviorId&&actual.behaviors.size!==0))
       throw Error('Unexpected new original Region data: STOP, reconcile');
    receipts.push({kind:q.kind,uuid:actual.uuid,behaviorUuid:b?.uuid||null,
     disabled:b?.disabled??null,shape:actual.toObject().shapes[0]});
   }
  }
 }
 if(s.regions.size!==6||w.regions.size!==4)throw Error('Final Region count mismatch, STOP');
 return{status:'five-original-sune-workshop-physical-fixtures-installed-dormant',
  context,created:receipts};
 },{plans,commit,studio:cfg.STUDIO,workshop:cfg.WORKSHOP});
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn21-sune-east-install-20261026.json';
 writeFileSync(path,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{await b.close()}