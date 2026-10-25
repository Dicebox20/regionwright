// H-U02: Install only owner-approved PNG. Macro preserves the existing scene ID and two-way staircase.
// Requires exact image bytes (SHA-256 verified), active GM and expected live state.
const WORLD='cabin-in-the-ashen-veil';
const SCENE='gGgUHlHdI7RFrbUh';
const IMG='Maps/cabin-in-the-ashen-veil/h-u02-approved-landing-owner-v005.png';
const SHA='1b988777225b1929d72c21d4a8bf052110589663aacd8d60ce6e60a110294b78';
const BUILD='cav:h-u02:owner-approved-image:v005';
if(game.world?.id!==WORLD||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Exact active GM/world guard failed');
const scene=game.scenes.get(SCENE),great=game.scenes.get('CAVHG06GreatRoom');
if(!scene||scene.name!=='H-U02 - Upper Gallery and Landing'||!great)throw Error('Canonical H-U02 scene missing');
const base='Maps/cabin-in-the-ashen-veil/h-u02-upper-gallery-with-entrances-v002.png';
if(scene.toObject().levels[0]?.background?.src!==base)throw Error('H-U02 artwork already changed; stop without overwriting');
if(scene.flags?.['dicebox-campaign-helper']?.artApproval===BUILD)throw Error('Already applied');
const response=await fetch('/'+IMG,{cache:'no-store'});
if(!response.ok)throw Error('APPROVED_ART_MISSING: Save the owner-approved 1122x1402 PNG as '+IMG+' in Foundry Data; no scene changes made. HTTP='+response.status);
const bytes=await response.arrayBuffer();
const d=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
if(d!==SHA)throw Error('APPROVED_ART_HASH_MISMATCH: Refusing to substitute an unapproved image. Actual SHA '+d);
const loc={
 down:'QunJFtigwByZndFV',upArrival:'xPTEg7ce2Bliz9M0',parents:'JP0OmkgPCTtQXxpn',parentArrival:'CAVHU02PARENTAR1',sophia:'UV4YAstBe0WCuLcM',guest:'M2fZhuvFmw1yZQS9',nursery:'aZ8eagmbvZUcPJ0g',hatch:'UOudBnxOGVlAlPoa'};
const expected=['down','upArrival','parents','parentArrival','sophia','guest','nursery','hatch'];
for(const k of expected)if(!scene.regions.get(loc[k]))throw Error('Region changed/missing: '+k);
const down=scene.regions.get(loc.down),upArrival=scene.regions.get(loc.upArrival),parents=scene.regions.get(loc.parents),parentArrival=scene.regions.get(loc.parentArrival),sophia=scene.regions.get(loc.sophia),guest=scene.regions.get(loc.guest),nursery=scene.regions.get(loc.nursery),hatch=scene.regions.get(loc.hatch);
const source=great.regions.get('CAV06R0000000005');
if(!source||source.behaviors.size!==1||down.behaviors.size!==1||parents.behaviors.size!==1||hatch.behaviors.size)throw Error('Unexpected navigation behaviors; no write');
if([...source.behaviors.contents[0].system.destinations][0]!==upArrival.uuid||[...down.behaviors.contents[0].system.destinations][0]!==great.regions.get('m3E7MaZTx6fvqXok').uuid)throw Error('Existing two-way stairs have changed');
if(scene.walls.size!==16||scene.tokens.size>10)throw Error('Wall/token preflight changed; no write');
if(scene.width!==1440||scene.height!==1800)throw Error('Canvas changed; no write');
for(const w of scene.walls)if(w.flags?.['dicebox-campaign-helper']?.build!=='cav-hu02-correct-upper-gallery-v002')throw Error('Foreign wall found; no overwrite');
const original={scene:scene.toObject(),greatStaircase:source.toObject(),timestamp:new Date().toISOString()};
const sx=scene.width/1122,sy=scene.height/1402;
const rect=(x,y,width,height)=>[{type:'rectangle',x:Math.round(x*sx),y:Math.round(y*sy),width:Math.round(width*sx),height:Math.round(height*sy)}];
const edits=[
 {_id:down.id,shapes:rect(849,1210,176,126)},
 {_id:upArrival.id,shapes:rect(628,1080,125,96)},
 {_id:parents.id,shapes:rect(480,92,160,115)},
 {_id:parentArrival.id,shapes:rect(488,236,145,76)},
 {_id:sophia.id,shapes:rect(966,345,114,145)},
 {_id:guest.id,shapes:rect(954,862,115,120)},
 {_id:nursery.id,shapes:rect(31,853,125,130)}
];
const W=[];
const add=(a,b,c,d,opt={})=>W.push({c:[Math.round(a*sx),Math.round(b*sy),Math.round(c*sx),Math.round(d*sy)],levels:['defaultLevel0000'],light:opt.moveOnly?0:20,move:20,sight:opt.moveOnly?0:20,sound:opt.moveOnly?0:20,door:opt.door?1:0,ds:opt.locked?2:0,flags:{'dicebox-campaign-helper':{build:BUILD,meaning:opt.moveOnly?'balustrade':opt.door?'door':'wall'}}});
// North: parents' doorway at the center. Fifth visible west-north doorway is scenic, not a new campaign route.
add(12,15,465,15);add(465,15,646,15,{door:true});add(646,15,1101,15);
// West: upper decorative threshold (non-traversable; no fictional destination), lower nursery entrance.
add(13,15,13,302);add(13,302,13,476);add(13,476,13,812);add(13,812,13,1041,{door:true});add(13,1041,13,1303);
// East: upper locked room and lower guest room.
add(1104,15,1104,302);add(1104,302,1104,501,{door:true,locked:true});add(1104,501,1104,811);add(1104,811,1104,1011,{door:true});add(1104,1011,1104,1390);
// South stair corridor opens in southeast, south wall closes the rest.
add(13,1303,800,1303);add(792,970,792,1390);
// Central gallery railing: blocks walking into open void but not vision.
add(298,344,812,344,{moveOnly:true});add(298,344,298,829,{moveOnly:true});add(812,344,812,829,{moveOnly:true});add(298,829,812,829,{moveOnly:true});
const oldWalls=Array.from(scene.walls),newWalls=[];let committed=false;
try{
 await scene.updateEmbeddedDocuments('Region',edits);
 await scene.updateEmbeddedDocuments('Wall',oldWalls.map((w,i)=>({_id:w.id,...W[i]})));
 if(W.length>oldWalls.length){const made=await scene.createEmbeddedDocuments('Wall',W.slice(oldWalls.length));newWalls.push(...made.map(w=>w.id));}
 await scene.updateEmbeddedDocuments('Level',[{_id:'defaultLevel0000','background.src':IMG}]);
 // Invisible attic access must not appear as a trigger before the hook is available.
 await scene.deleteEmbeddedDocuments('Region',[hatch.id]);
 await scene.update({'flags.dicebox-campaign-helper.artApproval':BUILD,'flags.dicebox-campaign-helper.status':'OWNER_APPROVED_MAP_GEOMETRY_INSTALLED','flags.dicebox-campaign-helper.hiddenAtticPendingHook':true,'flags.dicebox-campaign-helper.decorativeNorthwestDoor':true});
 const check=scene.toObject();
 if(check.levels[0].background.src!==IMG||scene.walls.size!==W.length||scene.regions.has(loc.hatch)||source.behaviors.contents[0].system.destinations.size!==1||!fromUuidSync(source.behaviors.contents[0].system.destinations.values().next().value))throw Error('Post-write check failed');
 committed=true;
 const result={status:'CONFIGURATION_VERIFIED',operation:BUILD,scene:scene.uuid,sha256:SHA,width:scene.width,height:scene.height,gridPixels:scene.grid.size,regions:scene.regions.map(x=>({name:x.name,id:x.id})),walls:scene.walls.size,doorWalls:scene.walls.filter(x=>x.door===1).length,stairUp:source.uuid,stairDown:down.uuid,backups:original,open: ['Non-GM traversal test','Canon decision on fifth visual door']};
 console.info('[H-U02 APPROVED ART] VERIFIED',result);ui.notifications.info('H-U02 approved landing artwork and topology installed. Stair teleports preserved.');return result;
}catch(e){
 if(!committed){
  try{if(newWalls.length)await scene.deleteEmbeddedDocuments('Wall',newWalls);}catch{}
  try{await scene.updateEmbeddedDocuments('Wall',original.scene.walls.map(w=>({_id:w._id,...w})));}catch{}
  try{const orig=original.scene.regions;await scene.updateEmbeddedDocuments('Region',orig.filter(r=>scene.regions.has(r._id)).map(r=>({_id:r._id,...r})));if(!scene.regions.has(loc.hatch))await scene.createEmbeddedDocuments('Region',orig.filter(r=>r._id===loc.hatch));}catch{}
  try{await scene.updateEmbeddedDocuments('Level',original.scene.levels.map(l=>({_id:l._id,...l})));await scene.update({flags:original.scene.flags});}catch{}
 }
 console.error('[H-U02 APPROVED ART] INSTALL/ROLLBACK',e);throw e;
}
