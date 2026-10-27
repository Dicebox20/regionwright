import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';
const q=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-inner-undercroft-native-staging.js').href);
const commit=process.argv.includes('--commit-dormant-inner-puzzle');
if(!q.planValid())throw Error('Invalid source plan');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('No GM game');
 const res=await page.evaluate(async({stages,original,commit})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
   !game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Not elected GM');
 const outer=game.scenes.get('CN5fkK2QLUELBGGR'),ref=game.scenes.get('ywpIpQDrkMLIgUP0');
 if(!outer||!ref||outer.name!==original.outer.name||ref.name!==original.refuge.name||
 outer.background.src!==original.outer.art||ref.background.src!==original.refuge.art||
 outer.width!==1536||outer.height!==1024||ref.width!==1536||ref.height!==1024||
 outer.regions.size!==2||ref.regions.size!==2)throw Error('Original scenes changed');
 for(const [scene,ids] of [[outer,['CAVBB3383706E610','CAVB67AABD1B35C6']],
 [ref,['CAVB74BDED08299D','CAVB49066EB37281']]]){
 if(ids.some(id=>!scene.regions.get(id)||scene.regions.get(id).behaviors.size!==0))
 throw Error('Original geometry changed or scripts added');
 }
 if(game.items.contents.some(i=>/keystone/i.test(i.name)))throw Error('Original Keystone now exists: reconcile source first');
 const wall=outer.regions.get('CAVB67AABD1B35C6');
 const rr=wall.toObject().shapes[0];
 if(rr.type!=='rectangle'||rr.x!==660||rr.y!==130||rr.width!==220||rr.height!==175)
 throw Error('Original carved door source shape changed');
 const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 for(const s of stages.filter(z=>!z.original)){
 const scene=game.scenes.get(s.sceneId);
 if(scene.regions.get(s.id)||Array.from(scene.regions).some(r=>r.getFlag(ns,'cavInnerKeystonePhysical')?.kind===s.kind))
 throw Error('Existing output/duplicate staged '+s.kind);
 for(const r of scene.regions)for(const shape of r.toObject().shapes)
  if(shape.type==='rectangle'&&overlap(s.rect,shape))
  throw Error('Overlap existing original Region '+s.kind+'/'+r.id);
 }
 const current={gm:game.user.name,world:game.world.id,outer:outer.uuid,refuge:ref.uuid,
 originalOuterRegions:outer.regions.size,originalRefugeRegions:ref.regions.size,
 originalWall:wall.uuid,existingWallBehaviors:wall.behaviors.size,
 plannedRegions:stages.filter(s=>!s.original).map(s=>s.id),
 plannedDisabledBehaviors:stages.filter(s=>s.behaviorId).map(s=>s.behaviorId),
 keystoneOriginalSourceMissing:true};
 if(!commit)return{status:'original-UND01-UND02-dormant-puzzle-preflight-pass-no-writes',current};
 // Create passive return, then separately create departure Regions; all Behaviors DISABLED.
 const ordered=stages.filter(s=>!s.original).sort((a,b)=>(!a.behaviorId?-1:1)-(!b.behaviorId?-1:1));
 const rows=[];
 for(const s of ordered){
  const scene=game.scenes.get(s.sceneId);
  const data={_id:s.id,name:'CAV - '+s.kind,visibility:0,
   shapes:[{type:'rectangle',...s.rect,rotation:0,hole:false}],
   behaviors:s.behaviorId?[s.behavior]:[],
   flags:{[ns]:{cavInnerKeystonePhysical:{status:'dormant-no-original-keystone',
     kind:s.kind,source:'owner-approved UND maps v002',genuineSourceRequired:true,
     noCrookedManDependency:true,playerGameplayTested:false}}}};
  const made=await scene.createEmbeddedDocuments('Region',[data],{keepId:true});
  const real=scene.regions.get(s.id);
  if(made.length!==1||!real||real.behaviors.size!==(s.behaviorId?1:0)||
    (s.behaviorId&&real.behaviors.get(s.behaviorId)?.disabled!==true))
   throw Error('Partial physical Region creation; STOP, never retry installer');
  rows.push({kind:s.kind,uuid:real.uuid,disabled:s.behaviorId?real.behaviors.get(s.behaviorId).disabled:null});
 }
 // Add isolated disabled source to original door wall without altering its shape.
 const key=stages.find(s=>s.original);
 const made=await wall.createEmbeddedDocuments('RegionBehavior',[key.behavior],{keepId:true});
 const real=wall.behaviors.get(key.behaviorId);
 if(made.length!==1||!real||real.disabled!==true||real.type!=='executeScript')
  throw Error('Partial original wall RegionBehavior creation, STOP');
 if(outer.regions.size!==5||ref.regions.size!==3)throw Error('Final native Region counts uncertain');
 return{status:'original-inner-keystone-refuge-physical-staged-dormant',current,
  created:rows,originalWallAdded:{uuid:real.uuid,disabled:real.disabled},
  innerDoorStillSealed:true,originalKeystoneStillMissing:true};
 },{commit,original:{outer:q.OUTER,refuge:q.REFUGE},
   stages:q.STAGES.map(s=>({...s,behavior:s.behaviorId?q.behavior(s):null}))});
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn23-undercroft-native-install.json';
 writeFileSync(path,JSON.stringify(res,null,2));console.log(JSON.stringify(res));
}finally{await browser.close()}