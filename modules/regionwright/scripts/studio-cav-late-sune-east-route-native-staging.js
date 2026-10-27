// Chat B L1 T21 — exact physical owner Art Studio east Shrine -> Candle Workshop route.
// OWNER ORIGINAL story requires authentic Music Box Protection prayer and explicit
// reading BEFORE any native teleport is armed. These are DORMANT physical fixtures.
// No shared Studio registry writes, no player progression, no reinterpreted Vanity.
export const STUDIO={id:'CAVHU07Scene0001',name:'H-U07 - Dahlia Art Studio',
 art:'Maps/cabin-in-the-ashen-veil/h-u07-dahlia-art-studio-approved-v017-2026-10-24.png',
 width:1536,height:1024};
export const WORKSHOP={id:'CAVHU08Scene0001',name:'H-U08 - Candle Workshop',
 art:'Maps/cabin-in-the-ashen-veil/H-U08_Candle_Workshop_V002_OWNER_APPROVED_2026-10-24.png',
 width:1448,height:1086};
export const EXISTING_STUDIO_VANITY='CAVVANITYREG0001';
export const EXISTING_WORKSHOP_WICK='CAVBE5639AEC2179';
export const PROTECTION_SOURCE='Item.5jwy75XyFezukf3b';
export const PROTECTION_JOURNAL='JournalEntry.CAVPRAYERPROTECT';
// Each ID is 16 chars; static rectangles in natural source pixel coordinates,
// separately adjacent to east Sune shrine and away from existing Vanity mirror.
// Arrival endpoints are passive to avoid reversible auto-teleport loops.
export const STAGES=Object.freeze([
 Object.freeze({kind:'sune-altar',sceneId:STUDIO.id,id:'CAVSUNEACTION001',
  name:'H-U07 - Sune east shrine: separate prayer reading place',
  rect:Object.freeze({x:1120,y:350,width:130,height:180}),
  behaviorId:'CAVSUNEPRAYBEH01',behaviorKind:'executeScript'}),
 Object.freeze({kind:'studio-east-departure',sceneId:STUDIO.id,id:'CAVSUNEEASTPASS1',
  name:'H-U07 - Concealed EAST Sune passage (sealed)',
  rect:Object.freeze({x:1320,y:625,width:150,height:155}),
  behaviorId:'CAVSUNEOUTTELE01',behaviorKind:'teleportToken',
  destinationId:'CAVWORKARRIVAL01'}),
 Object.freeze({kind:'studio-return-arrival',sceneId:STUDIO.id,id:'CAVSTUDIORETURN1',
  name:'H-U07 - Return landing from Candle Workshop',
  rect:Object.freeze({x:1020,y:765,width:145,height:145})}),
 Object.freeze({kind:'workshop-entry-arrival',sceneId:WORKSHOP.id,id:'CAVWORKARRIVAL01',
  name:'H-U08 - Safe arrival from Art Studio Sune passage',
  rect:Object.freeze({x:235,y:425,width:145,height:140})}),
 Object.freeze({kind:'workshop-return-departure',sceneId:WORKSHOP.id,id:'CAVWORKRETURN001',
  name:'H-U08 - Return toward Studio east shrine (sealed)',
  rect:Object.freeze({x:210,y:615,width:150,height:145}),
  behaviorId:'CAVWORKBACKTEL01',behaviorKind:'teleportToken',
  destinationId:'CAVSTUDIORETURN1'})
]);
export function rectsOverlap(a,b){
 return a.x<b.x+b.width&&a.x+a.width>b.x&&
        a.y<b.y+b.height&&a.y+a.height>b.y;
}
export function physicalPlanInvariant(){
 for(let i=0;i<STAGES.length;i++){
  const s=STAGES[i],scene=s.sceneId===STUDIO.id?STUDIO:WORKSHOP;
  if(s.id.length!==16||s.behaviorId&&s.behaviorId.length!==16||
    s.rect.x<0||s.rect.y<0||
    s.rect.x+s.rect.width>scene.width||
    s.rect.y+s.rect.height>scene.height)return false;
  for(let j=i+1;j<STAGES.length;j++){
   const other=STAGES[j];
   if(s.id===other.id||(s.sceneId===other.sceneId&&rectsOverlap(s.rect,other.rect)))return false;
  }
 }
 return STAGES.every(s=>!s.destinationId||STAGES.some(t=>t.id===s.destinationId&&t.sceneId!==s.sceneId));
}
const altarSource=String.raw`
const NS='dicebox-campaign-helper';
if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
  scene?.id!=='CAVHU07Scene0001'||region?.id!=='CAVSUNEACTION001')return;
if(!['behaviorViewed','behaviorUnviewed','behaviorDeactivated'].includes(event?.name))return;
const key='__CAV_B21_SUNE_ALTAR_'+region.id;
if(event.name!=='behaviorViewed'){
 const prior=globalThis[key];
 if(prior?.handler&&canvas?.stage)canvas.stage.off('pointertap',prior.handler);
 delete globalThis[key];return;
}
if(globalThis[key]?.handler&&canvas?.stage)canvas.stage.off('pointertap',globalThis[key].handler);
const handler=async e=>{
 if(!canvas?.ready||canvas.scene?.id!=='CAVHU07Scene0001')return;
 const xy=canvas.stage.toLocal(e.global);
 if(!region.testPoint({x:xy.x,y:xy.y,elevation:0}))return;
 await foundry.applications.api.DialogV2.prompt({
  window:{title:'Dahlia Art Studio — Sune Shrine'},
  content:'<p>The sealed eastern passage answers to an authentic Prayer of Protection read after recovery from the Ornate Music Box. Prayer of Devotion serves a separate later purpose. The shrine remains inactive until the original prayer-recovery and elected-GM action are commissioned.</p>',
  ok:{label:'Close',callback:()=>true},rejectClose:false});
};
if(canvas?.stage){canvas.stage.on('pointertap',handler);globalThis[key]={handler};}
return;
`;
export function nativeAltarInformationOnlySource(){return altarSource.trim();}
export function teleportBehaviorData(stage){
 if(stage.behaviorKind!=='teleportToken'||!stage.destinationId)throw Error('Not a paired teleport departure');
 const destination=STAGES.find(q=>q.id===stage.destinationId);
 if(!destination||destination.sceneId===stage.sceneId)throw Error('Unpaired stage');
 return{
  _id:stage.behaviorId,name:'Sune east passage — SEALED until real Protection reading',
  type:'teleportToken',disabled:true,
  system:{events:['tokenExit'],destinations:['Scene.'+destination.sceneId+'.Region.'+destination.id],
   placement:'center',snap:false,choice:true,revealed:false,
   dialog:{revealed:'Use the opened Sune passage?',unrevealed:'Use the opened Sune passage?'},
   transition:{type:null,duration:1500}}
 };
}
export function altarBehaviorData(){
 return{_id:'CAVSUNEPRAYBEH01',name:'Sune shrine reading — DISABLED until native original prayer authority',
  type:'executeScript',disabled:true,
  system:{events:['behaviorViewed','behaviorUnviewed','behaviorDeactivated'],
   source:nativeAltarInformationOnlySource()}
 };
}