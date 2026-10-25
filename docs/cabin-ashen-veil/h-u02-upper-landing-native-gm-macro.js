// Cabin in the Ashen Veil H-U02 — provisional visual + complete two-way staircase region installation.
// Active GM only, exact world only, guard against duplicates. Original art remains untouched.
if(game.world?.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('H-U02 requires active GM in exact Cabin world');
const great=game.scenes.get('CAVHG06GreatRoom');const stairs=great?.regions.get('CAV06R0000000005');
if(!great||!stairs||stairs.name!=='H-G06 - Upstairs Staircase')throw Error('Canonical upstairs staircase not found');
const asset='Maps/cabin-in-the-ashen-veil/h-u02-upper-gallery-provisional-v001.png';
const targetName='H-U02 - Upper Gallery and Landing';
const routeKey='cav:travel:greatroom-upperlanding:v1';
if(game.scenes.some(s=>s.name.startsWith('H-U02')||s.flags?.['dicebox-campaign-helper']?.sceneCode==='H-U02'))throw Error('H-U02 already installed; stopping before duplicate scene');
if(stairs.behaviors.size!==0)throw Error('Staircase already has a behavior; inspect before write');
const assetResult=await fetch('/'+asset,{method:'HEAD'});if(!assetResult.ok)throw Error('Landing map asset unavailable: '+assetResult.status);
const receipt={date:new Date().toISOString(),world:game.world.id,operation:'cav.h-u02.provisional-scene.install',status:'STARTED',artApproval:'PROVISIONAL, not owner-approved',sourceStairs:stairs.toObject(),greatLandingBefore:great.regions.map(r=>r.toObject()),asset,created:{}};
let scene,downstairsLanding,upstairsReturn,upstairsLanding,sourceBehavior;
const region=(name,x,y,width,height,kind)=>({name,shapes:[{type:'rectangle',x,y,width,height}],flags:{'dicebox-campaign-helper':{routeKey,kind,build:'h-u02-provisional-v1'}},ownership:{default:2}});
const behavior=target=>({name:'Do you wish to proceed?',type:'teleportToken',system:{destinations:[target],placement:'center',snap:false,choice:true,revealed:true,dialog:{revealed:'Do you wish to proceed?',unrevealed:'Do you wish to proceed?'}},flags:{'dicebox-campaign-helper':{routeKey,build:'h-u02-provisional-v1'}}});
try{
 const lvl=great.toObject().levels?.[0];if(!lvl)throw Error('Missing valid Foundry level template');
 lvl.name='Second Floor';lvl.elevation={bottom:20,top:40};lvl.background.src=asset;
 scene=await Scene.create({name:targetName,navigation:true,width:960,height:1440,grid:{size:120,type:0,distance:5,units:'ft'},levels:[lvl],ownership:{default:2},folder:great.folder?.id??null,flags:{'dicebox-campaign-helper':{sceneCode:'H-U02',status:'PROVISIONAL_VISUAL_PENDING_APPROVAL',blueprint:'ashen_house_blueprint_geometry_v1.json',notCanonArt:true}}});
 if(!scene||scene.name!==targetName)throw Error('New scene failed');receipt.created.scene=scene.uuid;
 const upstairs=await scene.createEmbeddedDocuments('Region',[region('H-U02 - Staircase Down to Great Room',340,1100,280,175,'exit'),region('H-U02 - Arrival from Great Room',370,580,220,150,'landing')]);
 upstairsReturn=upstairs.find(x=>x.name==='H-U02 - Staircase Down to Great Room');upstairsLanding=upstairs.find(x=>x.name==='H-U02 - Arrival from Great Room');
 if(!upstairsReturn||!upstairsLanding)throw Error('Upper Regions not created exactly');
 receipt.created.upperReturn=upstairsReturn.uuid;receipt.created.upperLanding=upstairsLanding.uuid;
 [downstairsLanding]=await great.createEmbeddedDocuments('Region',[region('H-G06 - Arrival from Upper Landing',610,465,120,120,'landing')]);
 if(!downstairsLanding)throw Error('Great Room safe landing region creation failed');receipt.created.greatLanding=downstairsLanding.uuid;
 [sourceBehavior]=await stairs.createEmbeddedDocuments('RegionBehavior',[behavior(upstairsLanding.uuid)]);
 if(!sourceBehavior)throw Error('Upstairs behavior missing');receipt.created.upBehavior=sourceBehavior.uuid;
 const [reverse]=await upstairsReturn.createEmbeddedDocuments('RegionBehavior',[behavior(downstairsLanding.uuid)]);
 if(!reverse)throw Error('Return behavior missing');receipt.created.downBehavior=reverse.uuid;
 const checks=[sourceBehavior,reverse].map(b=>({uuid:b.uuid,type:b.type,disabled:b.disabled,destination:[...b.system.destinations][0],resolved:!!fromUuidSync([...b.system.destinations][0]),prompt:b.system.dialog.revealed}));
 if(checks.some(x=>x.disabled||!x.resolved||x.prompt!=='Do you wish to proceed?'||x.type!=='teleportToken'))throw Error('Post-write teleport verification failed');
 receipt.behaviors=checks;receipt.status='CONFIGURATION_VERIFIED';receipt.warning='No non-GM token movement test. Temporary procedural map pending approved artwork, wall and navigation inspection.';
 console.info('[Cabin H-U02] INSTALLED_AND_VERIFIED',receipt);
 ui.notifications.info('H-U02 Upper Landing scene installed with two-way confirmation teleports (provisional art).');
 return receipt;
}catch(e){
 if(sourceBehavior)await stairs.deleteEmbeddedDocuments('RegionBehavior',[sourceBehavior.id]).catch(()=>{});
 if(downstairsLanding)await great.deleteEmbeddedDocuments('Region',[downstairsLanding.id]).catch(()=>{});
 if(scene)await scene.delete().catch(()=>{});
 console.error('[Cabin H-U02] install rolled back or partially failed',e,receipt);
 throw e;
}
