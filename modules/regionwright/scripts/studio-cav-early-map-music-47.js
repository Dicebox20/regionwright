/**
 * Owner-authorized independent-Scene soundtrack for CAV EARLY Game.
 * Foundry v14 AmbientSound placeables, NOT GM-activated Scene playlists.
 * Exactly eight perimeter Ceremonial Grove SG01-04, SG06-09 share requested
 * existing audio "Demon Slayer - The Smell of Fear.mp3"; SG05 center differs.
 * Each Scene gets one equal-volume full-area music source (center, diagonal
 * coverage + margin, easing:false, walls:false, repeat:true, min:0 max:1).
 * Existing ten atmospheric emitters stay intact; existing Yard original
 * Elwynn Forest music emitter is ADOPTED and normalized, no duplicate track.
 */
import{SCENE_NAMES}from'./studio-cav-owner-nonspoiler-scene-titles-20261027.js';
export const SCENE_WORLD='cabin-in-the-ashen-veil';
export const NS='dicebox-campaign-helper';
export const MUSIC_FLAG='cavEarlyMapMusicV1';
export const MACRO_ID='CAVMUSICGM000001';
export const MACRO_NAME='CAV — Independent Scene Music (GM)';
export const YARD='CAVEXT01Yard0001';
export const YARD_ORIGINAL_SOUND='VycoO0Tl8O20uL8L';
export const GROVE_PERIMETER=['CAVSG01Scene0001','CAVSG02Scene0001',
 'CAVSG03Scene0001','CAVSG04Scene0001','CAVSG06Scene0001',
 'CAVSG07Scene0001','CAVSG08Scene0001','CAVSG09Scene0001'];
export const REQUESTED_TRACK='Demon Slayer - The Smell of Fear.mp3';
const TRACKS={
 house:'Mystical Theme - RPG Toolkit.mp3',
 rest:'Memories (Sad Music Box) by Michael Ortega.mp3',
 shadow:'Dungeon Music - Stealth 1.mp3',
 attic:'Ambience - Horror Rain.mp3',
 basement:'Ambience - Dark Tidings.mp3',
 bath:'Dungeon - Caverns.mp3',
 water:'The River pt1.mp3',
 forest:'Dark Forest Ambient Music - (Royalty Free).mp3',
 autumn:'Autumn Ambience - Relaxing Wind and Forest Sounds - D&D Ambience.mp3',
 clearing:'The Queen of Air and Darkness.mp3',
 grove:REQUESTED_TRACK,
 deep:'Underdark Path.mp3',
 chamber:'Shadow Temple.mp3',
 workshop:'Dungeon Music - Stealth 2.mp3',
 fair:'Feywild - Lake Dreamgrove.mp3',
 yard:'Elwynn Forest-Music.mp3',
 camp:'Wilderness Music - Night Camp.mp3',
 trail:'Wilderness Music - Calm Forest.mp3'
};
const VOLUMES={house:.19,rest:.17,shadow:.16,attic:.14,basement:.18,
 bath:.17,water:.15,forest:.18,autumn:.16,clearing:.16,grove:.19,
 deep:.19,chamber:.18,workshop:.17,fair:.16,yard:.22,camp:.16,trail:.16};
export function filePath(name){return 'Music/'+encodeURIComponent(name);}
export function classForScene(m){
 const n=m.newName,id=m.id;
 if(GROVE_PERIMETER.includes(id))return'grove';
 if(id==='CAVSG05Scene0001')return'clearing';
 if(id===YARD)return'yard';
 if(id==='CAVHU01Scene0001'||id==='CAVHU05Scene0001'||id==='CAVHU04Scene0001')return'rest';
 if(id==='CAVHU08Scene0001'||id==='G6NMonfCwMvNzipL')return'workshop';
 if(id==='CAVHG06GreatRoom'||id==='CAVHU07Scene0001')return'shadow';
 if(n.startsWith('F1 — ')||n.startsWith('F2 — '))return'house';
 if(n.startsWith('Attic — '))return'attic';
 if(n.startsWith('Basement — '))return'basement';
 if(n.startsWith('Bathhouse — '))return'bath';
 if(n.startsWith('Aqueduct — '))return'water';
 if(n.startsWith('Underground — '))return id==='hLU4DzVctEGdsuaz'?'chamber':'deep';
 if(n.startsWith('Grove — '))throw Error('Unexpected named Grove map '+id);
 if(n.startsWith('Woods — '))return'forest';
 if(n.startsWith('Grounds — ')){
  if(id==='CAVEXT02Scene001'||id==='CAVEXT07Scene001')return'water';
  if(id==='CAVEXT05Scene001')return'fair';
  if(id==='CAVEXT06Scene001')return'forest';
  if(id==='CAVEXT03Scene001'||id==='xx1rWBiWMLxJPlrw')return'camp';
  if(id==='CAVTRAILScene001')return'trail';
  return'autumn';
 }
 if(n.startsWith('Roof — '))return'forest';
 throw Error('No native track classification for '+id+' '+n);
}
export function catalog(){
 if(SCENE_NAMES.length!==47)throw Error('Exact approved Scene inventory changed');
 const scenes=SCENE_NAMES.map((m,index)=>{
  const cls=classForScene(m);
  return Object.freeze({id:m.id,name:m.newName,cls,
   file:TRACKS[cls],path:filePath(TRACKS[cls]),volume:VOLUMES[cls],
   existingId:m.id===YARD?YARD_ORIGINAL_SOUND:null,
   soundId:m.id===YARD?YARD_ORIGINAL_SOUND:'CAVMUSIC'+String(index+1).padStart(8,'0')});
 });
 const ids=new Set(scenes.map(x=>x.soundId));
 if(ids.size!==47||scenes.some(x=>x.soundId.length!==16)||
  scenes.filter(x=>x.file===REQUESTED_TRACK).length!==8||
  scenes.find(x=>x.id==='CAVSG05Scene0001').file===REQUESTED_TRACK)
 throw Error('Full sound mapping or eight requested perimeter maps mismatch');
 return scenes;
}
// Native Foundry AmbientSound radius in scene units, one full-scene emitter
// centered at scene physical content center. Padding 1.5 grid squares.
export function coverage(s){
 const w=s.width,h=s.height;
 const size=s.grid.size,dist=s.grid.distance;
 if(![w,h,size,dist].every(x=>Number.isFinite(x)&&x>0))throw Error('Invalid native Scene geometry');
 const x=Math.round((s.dimensions?.sceneX??0)+w/2);
 const y=Math.round((s.dimensions?.sceneY??0)+h/2);
 const cornerPx=Math.hypot(w/2,h/2);
 const radius=Math.ceil((cornerPx+1.5*size)/size*dist);
 if(radius<=0||radius*size/dist<cornerPx)throw Error('Full Scene circle not covered');
 return{x,y,radius,pixelRadius:radius*size/dist,furthestCornerPx:cornerPx};
}
export function payload(entry,scene){
 const c=coverage(scene);
 return{_id:entry.soundId,
  name:'CAV Map Music — '+entry.name,
  path:entry.path,
  x:c.x,y:c.y,radius:c.radius,
  easing:false,walls:false,repeat:true,hidden:false,
  volume:entry.volume,darkness:{min:0,max:1},
  flags:{[NS]:{[MUSIC_FLAG]:{
   version:1,phase:'early',sceneId:entry.id,source:'owner-library',
   trackName:entry.file,role:'scene-wide-music',
   exactCoverPixels:c.pixelRadius,furthestCornerPx:c.furthestCornerPx,
   originalYardSourceReused:entry.id===YARD,
   nonGMPlaybackVerified:false
  }}}
 };
}
export function macroCommand(entries,baseline){
 const data=JSON.stringify({entries,baseline,
  macroId:MACRO_ID,ownerFlag:MUSIC_FLAG,namespace:NS,world:SCENE_WORLD});
 return String.raw`(async()=>{
 const C=${data};
 if(!game.ready||game.version!=='14.367'||game.world.id!==C.world||
 !game.user.isGM||game.users.activeGM.id!==game.user.id)
  throw Error('CAV original elected GM session required');
 const macro=game.macros.get(C.macroId);
 if(!macro||macro.name!=='CAV — Independent Scene Music (GM)')throw Error('Music GM macro unavailable');
 const ns=C.namespace,key=C.ownerFlag;
 const state=macro.getFlag(ns,key);
 if(state?.version!==1||state?.sceneCount!==47||state?.pending)
  throw Error('Music baseline missing or partial transaction. Reconcile; do not replay.');
 let action=globalThis.__CAV_MAP_MUSIC_ACTION??null;
 if(!action){
  action=await foundry.applications.api.DialogV2.wait({
   window:{title:'Cabin — Independent Scene Music'},
   content:'<p>Install music as a full-map, constant-volume Ambient Sound in each Scene. Each player hears their viewed Scene music when their token is within the Scene sound area. Existing ambient effects are retained.</p>',
   buttons:[
    {action:'install',label:'Install Early Game Music',default:true},
    {action:'verify',label:'Verify Installed Music'},
    {action:'restore',label:'Restore Original Map Sounds'},
    {action:'cancel',label:'Cancel'}],close:()=>null
  });
 }
 if(!['install','verify','restore'].includes(action))return false;
 if(game.scenes.size!==47)throw Error('World Scene count drift');
 for(const row of C.entries){
  const sc=game.scenes.get(row.id);
  if(!sc||sc.name!==row.name)throw Error('Scene identity changed '+row.id);
 }
 const current=()=>C.entries.map(row=>{
  const sc=game.scenes.get(row.id),sound=sc?.sounds.get(row.soundId);
  return{row,sc,sound};
 });
 const checkInstalled=()=>{
  const list=current();
  return list.every(({row,sc,sound})=>{
   const expected=row.expected;
   return!!sound&&sound.path===expected.path&&
    sound.x===expected.x&&sound.y===expected.y&&
    sound.radius===expected.radius&&sound.easing===false&&
    sound.walls===false&&sound.repeat===true&&
    sound.hidden===false&&sound.volume===expected.volume&&
    sound.darkness.min===0&&sound.darkness.max===1&&
    sound.getFlag(ns,key)?.sceneId===row.id;
  });
 };
 if(action==='verify'){
  const pass=checkInstalled();
  if(!pass)throw Error('47-Scene original music mismatch. Run GM read-only diagnosis.');
  ui.notifications.info('CAV map music verified: 47 / 47 Scenes.');
  return{verified:pass,count:47};
 }
 if(action==='install'){
  if(state.status==='installed'){
   if(checkInstalled())return{installed:true,already:true,count:47};
   throw Error('Installed music modified; reconcile before rerun');
  }
  if(state.status!=='original')throw Error('Unknown music installation state');
  for(const {row,sc,sound}of current()){
   if(row.existingId){
    const b=C.baseline[row.id].sounds.find(x=>x._id===row.existingId);
    if(!b||!sound||sound.path!==b.path||sound.x!==b.x||sound.y!==b.y||
     sound.radius!==b.radius||sound.volume!==b.volume||sound.easing!==b.easing||sound.walls!==b.walls)
    throw Error('Original Yard soundtrack changed; no write');
   }else if(sound||sc.sounds.size!==C.baseline[row.id].sounds.length)
    throw Error('Unexpected sound on original Scene '+row.id);
  }
  await macro.setFlag(ns,key,{...state,pending:'install'});
  for(const {row,sc} of current()){
   if(row.existingId){
    const x=row.expected;
    await sc.updateEmbeddedDocuments('AmbientSound',[{
     _id:row.soundId,name:x.name,path:x.path,x:x.x,y:x.y,radius:x.radius,
     easing:false,walls:false,repeat:true,hidden:false,volume:x.volume,
     darkness:{min:0,max:1},flags:x.flags
    }]);
   }else{
    await sc.createEmbeddedDocuments('AmbientSound',[row.expected],{keepId:true});
   }
   const check=sc.sounds.get(row.soundId);
   if(!check||check.path!==row.expected.path||check.easing||check.walls||
     check.radius!==row.expected.radius)throw Error('Partial scene music: '+row.id);
  }
  if(!checkInstalled())throw Error('Incomplete 47 sound install: stop/reconcile');
  await macro.setFlag(ns,key,{...state,status:'installed',pending:null,lastVerified:47});
  ui.notifications.info('CAV Early Game: independent map music installed in 47 Scenes.');
  return{installed:true,count:47};
 }
 if(action==='restore'){
  if(state.status==='original')return{restored:true,already:true};
  if(state.status!=='installed'||!checkInstalled())
   throw Error('Current saved sound changed; verify/reconcile before restore');
  await macro.setFlag(ns,key,{...state,pending:'restore'});
  for(const {row,sc}of current()){
   const sound=sc.sounds.get(row.soundId);
   if(!sound)throw Error('Sound disappeared while restoring '+row.id);
   if(row.existingId){
    const original=C.baseline[row.id].sounds.find(x=>x._id===row.existingId);
    await sc.updateEmbeddedDocuments('AmbientSound',[{
     _id:original._id,name:original.name,path:original.path,
     x:original.x,y:original.y,radius:original.radius,
     easing:original.easing,walls:original.walls,volume:original.volume,
     repeat:original.repeat,hidden:original.hidden,darkness:original.darkness,
     flags:original.flags
    }]);
    await sc.sounds.get(row.soundId).unsetFlag(ns,key);
   }else await sc.deleteEmbeddedDocuments('AmbientSound',[row.soundId]);
  }
  const back=current().every(({row,sc,sound})=>{
   const original=C.baseline[row.id].sounds;
   if(row.existingId){const ref=original.find(x=>x._id===row.soundId);
    return sound?.getFlag(ns,key)===undefined&&sound?.path===ref.path&&sound.volume===ref.volume&&
      sound.easing===ref.easing&&sound.walls===ref.walls&&
      sound.radius===ref.radius;
   }
   return !sound&&sc.sounds.size===original.length;
  });
  if(!back)throw Error('Original music restore incomplete, reconcile');
  await macro.setFlag(ns,key,{...state,status:'original',pending:null,lastVerified:47});
  ui.notifications.info('CAV original map audio restored.');
  return{restored:true,count:47};
 }
})()`.trim();
}