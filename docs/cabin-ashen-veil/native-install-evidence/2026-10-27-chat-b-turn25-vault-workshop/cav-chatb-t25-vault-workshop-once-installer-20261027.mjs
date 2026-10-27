import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-vault-workshop-native-staging.js').href);
if(!cfg.validFixturePlan())throw Error('Original physical plan failed');
const fixtures=cfg.FIXTURES.map(f=>({...f,behavior:f.behaviorId?cfg.nativeBehavior(f):null}));
const commit=process.argv.includes('--commit-original-3-vault-sockets-dormant');
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('GM /game tab absent');
const data=await p.evaluate(async({fixtures,workshop,vault,itemSources,commit})=>{
const ns='dicebox-campaign-helper';
if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
  game.system?.id!=='dnd5e'||!game.user?.isGM||game.users?.activeGM?.id!==game.user.id)
 throw Error('Wrong active elected GM and world');
const ws=game.scenes.get(workshop.id),v=game.scenes.get(vault.id);
for(const [actual,approved]of[[ws,workshop],[v,vault]]){
 if(!actual||actual.name!==approved.name||actual.background.src!==approved.art||
   actual.width!==1536||actual.height!==1024)
 throw Error('Original owner approved map changed');
}
if(ws.regions.size!==3||v.regions.size!==2||ws.tokens.size||v.tokens.size)
 throw Error('Original regions/tokens count changed; stop');
const originalWorkshop={
 stair:ws.regions.get('CAVB9C0F653A2A6F'),
 bench:ws.regions.get('CAVBABA9513F73A3'),
 return:ws.regions.get('CAVBASEMENTRET01')
},originalVault={
 entry:v.regions.get('CAVB1F6B8321128A'),
 plinth:v.regions.get('CAVB799A5357A114')
};
if(Object.values(originalWorkshop).some(r=>!r)||Object.values(originalVault).some(r=>!r)||
 originalWorkshop.stair.behaviors.size!==0||originalWorkshop.bench.behaviors.size!==0||
 originalWorkshop.return.behaviors.get('CAVBASEMENTPRT01')?.disabled!==false||
 originalVault.entry.behaviors.size!==0||
 originalVault.plinth.behaviors.get('CAVVKEYPLINTH001')?.disabled!==true)
 throw Error('Original workshop/stair/Vault plinth native changed');
const oldShape=originalWorkshop.bench.toObject().shapes[0];
if(oldShape.type!=='rectangle'||oldShape.x!==770||oldShape.y!==315||
 oldShape.width!==220||oldShape.height!==185)
 throw Error('Original central bench native shape changed');
const sourceItems=[];
for(const [kind,uuid] of Object.entries(itemSources)){
 const i=game.items.get(uuid.slice(5));
 const names={'charged-source':'Uncharged Gondian Power Source','gond-half':'Gond Emblem Half','sune-half':'Sune Emblem Half'};
 if(!i||i.uuid!==uuid||i.name!==names[kind]||i.type!=='loot'||
 i.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')
 throw Error('Exact original socket Item missing: '+kind);
 sourceItems.push({kind,uuid:i.uuid,status:i.getFlag(ns,'cabinPuzzleItem')?.status});
}
const key=game.items.get('CAVKEYSTONEITEM1');
if(!key||key.uuid!=='Item.CAVKEYSTONEITEM1'||
 key.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')
 throw Error('Original new Keystone reward source not in library');
if(game.actors.contents.some(a=>a.items.some(i=>
 ['Uncharged Gondian Power Source','Gond Emblem Half','Sune Emblem Half','Keystone'].includes(i.name))))
 throw Error('A quest socket Item already exists in Actor inventory; need reconcile');
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
for(const f of fixtures){
 if(!f.behavior&&f.kind!=='return-landing-workshop')throw Error('Unexpected passive');
 if(f.behavior?.disabled===false||f.id.length!==16||f.behaviorId&&f.behaviorId.length!==16)
 throw Error('Native physical source not safe');
 const scene=game.scenes.get(f.sceneId),existing=scene.regions.get(f.id);
 if(f.original){
  if(existing!==originalWorkshop.bench||existing.behaviors.size!==0)
   throw Error('Existing actuator overwritten');
 }else{
  if(existing||Array.from(scene.regions).some(r=>r.getFlag(ns,'cavLateVaultWorkshopFixture')?.kind===f.kind))
   throw Error('Duplicate physical fixture: '+f.kind);
  for(const region of scene.regions)for(const sh of region.toObject().shapes)
   if(sh.type==='rectangle'&&overlap(f.rect,sh))
    throw Error('Native overlap '+f.kind+' '+region.id);
 }
}
for(const [i,f] of fixtures.entries())for(const q of fixtures.slice(i+1)){
 if(f.sceneId===q.sceneId&&overlap(f.rect,q.rect))throw Error('Overlapping planned fixtures');
}
const preview={world:game.world.id,gm:game.user.name,
 originalWorkshop:ws.uuid,originalVault:v.uuid,sourceItems,
 originalKeystoneReward:key.uuid,
 workshopOldRegionCount:ws.regions.size,vaultOldRegionCount:v.regions.size,
 oldBench:originalWorkshop.bench.uuid,
 oldFoyerReturnActive:true,originalVaultPlinthDisabled:true,
 intendedNewRegions:fixtures.filter(x=>!x.original).length,
 intendedDisabledBehaviors:fixtures.filter(x=>x.behaviorId).length,
 noStoryFlagWriters:true,noActorItemClones:true,
 plan:fixtures.map(f=>({kind:f.kind,id:f.id,scene:f.sceneId,rect:f.rect,
  behaviorId:f.behaviorId??null,disabled:f.behavior?.disabled??null,
  destinations:f.behavior?.system?.destinations??[]}))
};
if(!commit)return{status:'original-vault-3-socket-native-preflight-pass-no-writes',preview};
const created=[];
const passive=fixtures.filter(f=>!f.original&&!f.behaviorId);
const other=fixtures.filter(f=>!f.original&&f.behaviorId);
for(const group of[passive,other]){
 for(const f of group){
  const scene=game.scenes.get(f.sceneId);
  const reg={
   _id:f.id,name:'CAV - '+f.kind,
   visibility:0,shapes:[{type:'rectangle',...f.rect,hole:false,rotation:0}],
   behaviors:f.behavior?[f.behavior]:[],
   flags:{[ns]:{cavLateVaultWorkshopFixture:{
    kind:f.kind,status:'dormant-uncommissioned',
    version:1,originalApprovedArtVerified:true,
    authenticSourceUuid:itemSources[f.kind]??null,
    fourGateBasementPredicateRequired:true,
    grantKeystoneOnTurnForbidden:true,
    originalVaultItemNotCloned:true,nativeGameplayTested:false}}}
  };
  const docs=await scene.createEmbeddedDocuments('Region',[reg],{keepId:true});
  const actual=scene.regions.get(f.id),behavior=f.behaviorId?actual?.behaviors.get(f.behaviorId):null;
  if(docs?.length!==1||!actual||actual.toObject().shapes.length!==1||
    actual.getFlag(ns,'cavLateVaultWorkshopFixture')?.status!=='dormant-uncommissioned'||
    (f.behaviorId?(!behavior||behavior.disabled!==true||actual.behaviors.size!==1):actual.behaviors.size!==0))
   throw Error('Partial native Region creation; STOP, NEVER REPLAY installer');
  created.push({kind:f.kind,uuid:actual.uuid,behavior:behavior?.uuid??null,
   disabled:behavior?.disabled??null});
 }
}
const turn=fixtures.find(f=>f.original);
const made=await originalWorkshop.bench.createEmbeddedDocuments('RegionBehavior',[turn.behavior],{keepId:true});
const installed=originalWorkshop.bench.behaviors.get(turn.behaviorId);
if(made?.length!==1||!installed||installed.disabled!==true||
 installed.type!=='executeScript'||installed.system.source!==turn.behavior.system.source)
 throw Error('Partial original turn Behavior; STOP, no installer replay');
if(ws.regions.size!==8||v.regions.size!==3||originalWorkshop.return.behaviors.get('CAVBASEMENTPRT01')?.disabled!==false||
 originalVault.plinth.behaviors.get('CAVVKEYPLINTH001')?.disabled!==true)
 throw Error('Postwrite cardinality/original source mismatch, STOP');
return{status:'vault-workshop-three-physical-sockets-joined-turn-and-two-way-sealed-native-installed',
 preview,created,originalBenchTurn:{uuid:installed.uuid,disabled:installed.disabled},
 workshopNewRegionCount:ws.regions.size,vaultNewRegionCount:v.regions.size,
 allNativeBehaviorsDisabled:true,noItemsGranted:true,noDoorOpened:true};
},{fixtures,workshop:cfg.WORKSHOP,vault:cfg.VAULT,
itemSources:cfg.AUTHENTIC_ITEM_SOCKETS,commit});
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t25-vault-workshop-native-install.json';
writeFileSync(out,JSON.stringify(data,null,2));
console.log(JSON.stringify({...data,plan:data.preview?.plan?.map(x=>({kind:x.kind,id:x.id}))}).slice(0,13500));
}finally{await b.close()}