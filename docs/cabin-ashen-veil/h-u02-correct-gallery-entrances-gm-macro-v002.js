// Cabin in the Ashen Veil: H-U02 blueprint-based second-floor gallery correction.
// Native GM script macro; repairs only the preexisting provisional H-U02; no other scenes touched.
if(game.world?.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Exact Cabin active GM required');
const s=game.scenes.get('gGgUHlHdI7RFrbUh');const great=game.scenes.get('CAVHG06GreatRoom');
if(!s||s.name!=='H-U02 - Upper Gallery and Landing'||!great)throw Error('Exact H-U02 unavailable');
const up=great.regions.get('CAV06R0000000005');const down=s.regions.get('QunJFtigwByZndFV'),arrival=s.regions.get('xPTEg7ce2Bliz9M0');
if(!up||!down||!arrival||down.behaviors.size!==1||up.behaviors.size!==1)throw Error('Stair behavior state has changed; stop');
if(s.walls.size||s.regions.size!==2||s.width!==960||s.height!==1440)throw Error('Unexpected second-story scene state; refusing duplicate geometry');
if(s.toObject().levels[0]?.background?.src!=='Maps/cabin-in-the-ashen-veil/h-u02-upper-gallery-provisional-v001.png')throw Error('Current map is not known provisional master');
const asset='Maps/cabin-in-the-ashen-veil/h-u02-upper-gallery-with-entrances-v002.png';
const head=await fetch('/'+asset,{method:'HEAD'});if(!head.ok)throw Error('Corrected map failed to load '+head.status);
const old={scene:s.toObject(),stairReturn:down.toObject(),arrival:arrival.toObject()};
const receipt={operation:'cav.h-u02.correct-upper-gallery-v002',old,created:{},world:game.world.id,status:'STARTED',note:'Provisional structural map based on documented upper-floor blueprint. Rooms not installed; locked Sophia and attic gate preserved.'};
const code='cav-hu02-correct-upper-gallery-v002';
const doorDefs=[
 {name:'H-U02 — Parents Bedroom Entrance',x:295,y:560,w:150,h:135,target:'H-U04',locked:false},
 {name:'H-U02 — Nursery Entrance',x:295,y:1385,w:150,h:145,target:'H-U01',locked:false},
 {name:'H-U02 — Sophia Bedroom Entrance (Locked)',x:995,y:560,w:150,h:135,target:'H-U05',locked:true,requirement:'Old Iron Key'},
 {name:'H-U02 — Guest Bedroom Entrance',x:995,y:1385,w:150,h:145,target:'H-U03',locked:false},
 {name:'H-U02 — Attic Hatch',x:640,y:195,w:165,h:145,target:'H-A01',locked:true,requirement:'Ladder Hook'}
];
const region=(d)=>({name:d.name,shapes:[{type:'rectangle',x:d.x,y:d.y,width:d.w,height:d.h}],visibility:4,ownership:{default:2},flags:{'dicebox-campaign-helper':{objectKey:code+':'+d.target,intendedDestination:d.target,passageType:d.locked?'locked':'ordinary',requiredItem:d.requirement??null,artStage:'PROVISIONAL',teleportPending:true}}});
const walls=[];const wall=(x1,y1,x2,y2,door=0,ds=0)=>walls.push({c:[x1,y1,x2,y2],levels:['defaultLevel0000'],light:20,move:20,sight:20,sound:20,door,ds,flags:{'dicebox-campaign-helper':{build:code,meaning:door?'door':'wall'}}});
wall(280,140,1160,140);wall(280,1680,1160,1680);
for(const x of [280,1160]){wall(x,140,x,560);wall(x,560,x,695,1,x===1160?2:0);wall(x,695,x,1385);wall(x,1385,x,1530,1);wall(x,1530,x,1680)}
wall(575,400,865,400);wall(575,400,575,1295);wall(865,400,865,1295);wall(575,1295,865,1295);
let newRegions=[],newWalls=[];
try{
 await s.update({width:1440,height:1800});
 await s.updateEmbeddedDocuments('Level',[{_id:'defaultLevel0000','background.src':asset}]);
 await down.update({shapes:[{type:'rectangle',x:620,y:1505,width:200,height:125}]});
 await arrival.update({shapes:[{type:'rectangle',x:620,y:1345,width:200,height:120}]});
 newRegions=await s.createEmbeddedDocuments('Region',doorDefs.map(region));receipt.created.regions=newRegions.map(r=>r.uuid);
 newWalls=await s.createEmbeddedDocuments('Wall',walls);receipt.created.walls=newWalls.map(w=>w.uuid);
 await s.update({'flags.dicebox-campaign-helper.status':'PROVISIONAL_STRUCTURAL_V2_ENTRANCES_INSTALLED','flags.dicebox-campaign-helper.blueprintDoors':doorDefs.map(d=>d.target),'flags.dicebox-campaign-helper.newMapAsset':asset});
 const upTarget=[...up.behaviors.contents[0].system.destinations][0],downTarget=[...down.behaviors.contents[0].system.destinations][0];
 if(s.width!==1440||s.height!==1800||s.toObject().levels[0].background.src!==asset||s.regions.size!==7||s.walls.size!==walls.length||upTarget!==arrival.uuid||downTarget!==great.regions.get('m3E7MaZTx6fvqXok').uuid)throw Error('H-U02 post-write checks failed');
 if(newRegions.some(r=>r.behaviors.size!==0))throw Error('Unapproved teleports installed to absent rooms');
 receipt.status='CONFIGURATION_VERIFIED';receipt.after={name:s.name,width:s.width,height:s.height,background:s.toObject().levels[0].background.src,regions:s.regions.map(r=>({id:r.id,name:r.name,shapes:r.shapes.map(x=>x.toObject()),behaviors:r.behaviors.size})),walls:s.walls.size,stairs:upTarget,return:downTarget};
 console.info('[Cabin H-U02] Corrected gallery installed',receipt.after);
 ui.notifications.info('H-U02 gallery now includes four bedroom doorways, attic hatch, atrium and stairwell.');
 return receipt;
}catch(e){
 if(newWalls.length)await s.deleteEmbeddedDocuments('Wall',newWalls.map(w=>w.id)).catch(()=>{});
 if(newRegions.length)await s.deleteEmbeddedDocuments('Region',newRegions.map(r=>r.id)).catch(()=>{});
 await s.update({width:old.scene.width,height:old.scene.height,levels:old.scene.levels,flags:old.scene.flags}).catch(()=>{});
 await down.update({shapes:old.stairReturn.shapes}).catch(()=>{});
 await arrival.update({shapes:old.arrival.shapes}).catch(()=>{});
 console.error('[Cabin H-U02] Map install error / rollback attempted',e,receipt);
 throw e;
}
