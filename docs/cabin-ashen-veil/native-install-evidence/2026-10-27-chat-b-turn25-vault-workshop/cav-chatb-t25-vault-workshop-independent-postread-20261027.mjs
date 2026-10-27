import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import{writeFileSync}from'node:fs';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-vault-workshop-native-staging.js').href);
const hash=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('Exact elected GM world page missing');
 const z=await page.evaluate(({stages})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
   !game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Active GM/world mismatch');
 const ws=game.scenes.get('G6NMonfCwMvNzipL'),v=game.scenes.get('tjTpG2RVZNoCqRLh');
 const output=stages.map(s=>{
  const scene=game.scenes.get(s.sceneId),r=scene?.regions.get(s.id),
   beh=s.behaviorId?r?.behaviors.get(s.behaviorId):null;
  return{kind:s.kind,id:s.id,uuid:r?.uuid,shape:r?.toObject().shapes?.[0],
   regionBehaviorCount:r?.behaviors.size,behaviorId:beh?.id,
   behaviorType:beh?.type,disabled:beh?.disabled??null,
   behaviorScript:beh?.system?.source??null,
   destinations:beh?.system?.destinations?Array.from(beh.system.destinations):null,
   events:beh?.system?.events?Array.from(beh.system.events):null,
   flags:r?.getFlag(ns,'cavLateVaultWorkshopFixture')??null};
 });
 const items=['pbmUZPfC3WnsBRgi','o9G3UJjEe2QX1ZH0','t9uCIpsKeSvtC31w','CAVKEYSTONEITEM1']
  .map(id=>{const i=game.items.get(id);return{uuid:i?.uuid,name:i?.name,
  status:i?.getFlag(ns,'cabinPuzzleItem')?.status};});
 return{world:game.world.id,gm:game.user.name,scenes:{
  workshopRegionCount:ws.regions.size,vaultRegionCount:v.regions.size,
  workshopArt:ws.background.src,vaultArt:v.background.src
 },output,items,
  originalStairPassive:ws.regions.get('CAVB9C0F653A2A6F')?.behaviors.size===0,
  originalFoyerReturnEnabled:ws.regions.get('CAVBASEMENTRET01')?.behaviors.get('CAVBASEMENTPRT01')?.disabled===false,
  originalVaultEntryPassive:v.regions.get('CAVB1F6B8321128A')?.behaviors.size===0,
  originalKeystoneDaisDisabled:v.regions.get('CAVB799A5357A114')?.behaviors.get('CAVVKEYPLINTH001')?.disabled===true,
  actorQuestCopies:game.actors.contents.flatMap(a=>Array.from(a.items).filter(i=>
   ['Uncharged Gondian Power Source','Gond Emblem Half','Sune Emblem Half','Keystone'].includes(i.name)).map(i=>({a:a.id,item:i.id,name:i.name}))),
  originalSilverDisabled:game.scenes.get('CAVSG01Scene0001')?.regions.get('CAVSG01SILVERKEY')?.behaviors.get('CAVSG01SILVRBEH1')?.disabled===true,
  originalFirstChaseDisabled:game.scenes.get('CAVAQ01Scene0001')?.regions.get('woZ98KXx0RsWIPpl')?.behaviors.get('CAVAQCHASETRIG01')?.disabled===true,
  originalSecondChaseDisabled:game.scenes.get('CAVSG01Scene0001')?.regions.get('CAVSG01CHASETRG1')?.behaviors.get('CAVSG01CHASEBEH1')?.disabled===true
 };
 },{stages:cfg.FIXTURES});
 const rows=z.output.map((v,i)=>{
 const expected=cfg.FIXTURES[i],source=expected.behaviorId?cfg.nativeBehavior(expected):null;
 const actualShape=v.shape;
 const match=!!v.uuid&&
 actualShape?.type==='rectangle'&&
 ['x','y','width','height'].every(k=>actualShape[k]===expected.rect[k])&&
 (expected.original?!!v.uuid&&v.id===cfg.EXISTING_BENCH:v.flags?.kind===expected.kind&&
  v.flags?.status==='dormant-uncommissioned'&&v.flags?.fourGateBasementPredicateRequired===true)&&
 (expected.behaviorId?v.regionBehaviorCount===1&&v.behaviorId===expected.behaviorId&&
  v.disabled===true&&v.behaviorType===source.type&&
  (source.type==='executeScript'?v.behaviorScript===source.system.source:
   JSON.stringify(v.destinations)===JSON.stringify(source.system.destinations)&&
   v.events?.join(',')==='tokenExit'):v.regionBehaviorCount===0);
 return{kind:v.kind,uuid:v.uuid,behaviorId:v.behaviorId,
   disabled:v.disabled,sourceSHA256:v.behaviorScript?hash(v.behaviorScript):null,
   destinations:v.destinations,verified:match};
 });
 const pass=cfg.validFixturePlan()&&z.scenes.workshopRegionCount===8&&
  z.scenes.vaultRegionCount===3&&z.scenes.workshopArt===cfg.WORKSHOP.art&&
  z.scenes.vaultArt===cfg.VAULT.art&&rows.every(r=>r.verified)&&
  z.originalStairPassive&&z.originalFoyerReturnEnabled&&
  z.originalVaultEntryPassive&&z.originalKeystoneDaisDisabled&&
  z.actorQuestCopies.length===0&&z.items.length===4&&
  z.items.every(x=>x.status==='GM_LIBRARY_ONLY')&&
  z.originalSilverDisabled&&z.originalFirstChaseDisabled&&z.originalSecondChaseDisabled;
 const report={pass,world:z.world,gm:z.gm,
  regionCounts:z.scenes,
  currentOriginals:{stair:z.originalStairPassive,foyerReturn:z.originalFoyerReturnEnabled,
   vaultEntry:z.originalVaultEntryPassive,keystoneDais:z.originalKeystoneDaisDisabled,
   chasesDeferred:z.originalFirstChaseDisabled&&z.originalSecondChaseDisabled&&z.originalSilverDisabled},
  actorQuestCopies:z.actorQuestCopies.length,
  disabledNativeBehaviors:rows.filter(r=>r.disabled===true).length,
  rows,items:z.items};
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t25-vault-workshop-independent-postread.json';
 writeFileSync(out,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report).slice(0,9000));
 if(!pass)throw Error('Independent exact GM native staged Vault proof FAILED: no installer replay');
}finally{await b.close()}