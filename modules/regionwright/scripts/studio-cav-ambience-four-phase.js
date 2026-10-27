/**
 * Cabin in the Ashen Veil — GM-only phase-aware, native Foundry14/FXMaster8.
 * EARLY is the only presently commissioned phase. Mid/Late/Crimson are
 * reviewable prospective settings until owner chooses to apply that phase.
 * Tone based on original area read-aloud Journal 9dngVaa6ctgFAqd2 (59 pages).
 * No map, puzzle, Token, Wall, light placeable, sound placeable, or Region writes.
 */
import{SCENE_NAMES}from'./studio-cav-owner-nonspoiler-scene-titles-20261027.js';
export const PHASES=Object.freeze(['early','mid','late','crimson']);
export const NS='dicebox-campaign-helper';
export const MACRO_NAME='CAV — Ambience Phases (GM)';
export const MACRO_FLAG='cavSceneAmbienceV1';
export const FX_ID_P='apiMacro_cavAmbience1_p';
export const FX_ID_F='apiMacro_cavAmbience1_f';
// Original read-aloud journal pages use original Scene codes rather than the
// renamed player-facing Scene title. Catalog is immutable source, not player text.
export const READALOUD='JournalEntry.9dngVaa6ctgFAqd2';
const CLAMP=(n,low,high)=>Math.min(high,Math.max(low,n));
const R=(x)=>Math.round(x*100)/100;
export function describeScene(m){
 const title=m.newName;
 const id=m.id;
 let type='indoor',early=.22,tone='Still, abandoned household',particle=null;
 if(title.startsWith('F1 — ')){early=.19;tone='Dusty domestic silence';}
 if(title.startsWith('F2 — ')){early=.24;tone='Quiet upper-floor unease';}
 if(title.startsWith('Attic — ')){early=.30;tone='Dry rafters and settled dust';}
 if(title.startsWith('Basement — ')){early=.35;tone='Cold stone, dormant machinery';}
 if(title.startsWith('Underground — ')){early=.41;tone='Damp enclosed stone';}
 if(title.startsWith('Bathhouse — ')){early=.26;tone='Mineral-damp stone and still water';}
 if(title.startsWith('Aqueduct — ')){early=.31;tone='Cold, echoing waterworks';}
 if(title.startsWith('Grove — ')){type='exterior';early=.29;tone='Mossy memorial paths beneath bare branches';particle='fog';}
 if(title.startsWith('Woods — ')){type='exterior';early=.25;tone='Tangled autumn hedges and shaded roots';particle='fog';}
 if(title.startsWith('Grounds — ')){type='exterior';early=.23;tone='Weathered estate grounds in late autumn';particle='fog';}
 if(title.startsWith('Roof — ')){type='exterior';early=.28;tone='Weathered shingles and exposed wind';particle=null;}
 // Narrative-derived exceptions: restrained in EARLY, not puzzle reveals.
 if(id==='CAVEXT01Yard0001'){early=.15;particle=null;tone='Wet leaves and an abandoned carriage';}
 if(id==='CAVEXT06Scene001'){type='glasshouse';early=.24;particle=null;tone='Clouded glass and tangled vegetation';}
 if(id==='CAVEXT03Scene001'||id==='xx1rWBiWMLxJPlrw'){type='shelter';early=.24;particle=null;tone='Weathered timber and sheltered silence';}
 if(id==='CAVHG06GreatRoom'){early=.50;tone='Broad shadowed room, familiar but neglected';}
 if(id==='CAVHG05Scene0001'){early=.23;tone='Ordered papers and tarnished metalwork';}
 if(id==='CAVHU01Scene0001'){early=.21;tone='Faded nursery and silent cradle';}
 if(id==='CAVHU05Scene0001'){early=.22;tone='Well-loved books and a quiet small bedroom';}
 if(id==='CAVHU07Scene0001'){early=.24;tone='Dusty pigments and worn canvases';}
 if(id==='CAVHU08Scene0001'){early=.29;tone='Hardened wax and disused crafting tools';}
 if(id==='CAVEXT02Scene001'){early=.19;tone='Still black pond and damp sluice stones';}
 if(id==='CAVEXT05Scene001'){early=.25;tone='Moss and vines over a deserted gazebo';}
 if(id==='CAVSG05Scene0001'){early=.28;tone='Weathered stone and old rosebeds';}
 if(id==='CAVBATHScene0001'){early=.23;tone='Cool mineral-hazed bathhouse';}
 if(id==='8yLMRDvxyw58dydh'){early=.29;tone='Exposed, damp, drained bathing chambers';}
 if(id==='G6NMonfCwMvNzipL'){early=.37;tone='Tarnished mechanical fittings and cold stone';}
 if(id==='tjTpG2RVZNoCqRLh'){early=.43;tone='Thick, sealed masonry and still air';}
 if(id==='hLU4DzVctEGdsuaz'){early=.45;tone='Heavy silence over ancient stone';}
 if(id==='CAVAQ01Scene0001'){early=.33;tone='Underground flowing water and copper conduits';}
 // Original first party scene already has custom FXMaster rain. Preserve.
 // Region level sounds/lights are intentionally not altered.
 const code=m.prior.match(/^((?:H-[A-Z]|SG|EXT|AQ|UND|BATH|FM)-?\d+)/)?.[1]??'';
 const readAloudPrefix=code||m.prior.split(' ')[0];
 return{id,name:title,formerName:m.prior,readAloudPrefix,type,early,tone,particle};
}
export function phaseFor(scene,phase,original){
 if(!PHASES.includes(phase))throw Error('Unsupported campaign phase');
 const idx=PHASES.indexOf(phase);
 const baseline=original?.darknessLevel??0;
 const increase=[0,.09,.18,.29][idx];
 const darkness=R(CLAMP(Math.max(scene.early,baseline)+increase,0,.75));
 const addParticle=scene.particle==='fog'&&scene.id!=='CAVEXT01Yard0001';
 const fogDensity=R([.12,.19,.27,.32][idx]);
 const tint=phase==='crimson'?'#693844':'#b5bac6';
 const particle=addParticle?{
  id:FX_ID_P,type:'fog',
  options:{belowTokens:true,scale:.24,speed:.14,lifetime:.24,
   density:fogDensity,alpha:phase==='crimson'?.55:.35,
   tint:{apply:phase==='crimson',value:tint}}
 }:null;
 const filter=phase==='crimson'?{
  id:FX_ID_F,type:'color',
  options:{color:{apply:true,value:'#b66b72'},saturation:.75,
   contrast:1.16,brightness:.88,gamma:1.04,belowTokens:true}
 }:((phase==='late'&&['Basement — Inner Room','Underground — Deep Chamber','F2 — Nursery'].includes(scene.name))?
  {id:FX_ID_F,type:'color',options:{color:{apply:false,value:'#FFFFFF'},
   saturation:.8,contrast:1.07,brightness:.95,gamma:1.02,belowTokens:true}}:null);
 // Remove core fog ONLY where API fog replaces it; indoor inappropriate
 // blanket core weather is cleared. Existing yard core fog and rain remain.
 const weather=scene.id==='CAVEXT01Yard0001'?'fog':
  addParticle?'':scene.type==='exterior'?'fog':'';
 return{darknessLevel:darkness,weather,
  darkHue:phase==='crimson'?.98:(original?.darkHue??.7138888888888889),
  particle,filter,tone:scene.tone};
}
export function makeCatalog(){
 const result=SCENE_NAMES.map(describeScene);
 if(result.length!==47||new Set(result.map(x=>x.id)).size!==47)throw Error('Scene catalog drift');
 return result;
}
export function buildProfiles(originals){
 const record=Object.fromEntries(makeCatalog().map(m=>{
  const old=originals[m.id];
  if(!old)throw Error('Missing original saved Scene environment '+m.id);
  return[m.id,Object.fromEntries(PHASES.map(phase=>[phase,phaseFor(m,phase,old)]))];
 }));
 return record;
}
export function buildMacroCommand(records,originals){
 // Self contained, no module dependency at execution. Macro dialog chooses
 // desired phase, but an explicit phase argument enables elected-GM testing.
 const config=JSON.stringify({records,originals,phases:PHASES,
  fxP:FX_ID_P,fxF:FX_ID_F});
 return String.raw`
(async()=>{
const C=${config};
const NS='dicebox-campaign-helper',KEY='cavSceneAmbienceV1';
if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)
 throw Error('CAV ambience must run in original elected-GM world');
if(!game.modules.get('fxmaster')?.active||typeof FXMASTER?.api?.effects?.play!=='function')
 throw Error('FXMaster v8 installed runtime unavailable');
const macro=game.macros.get('CAVAMBIENCEMACR1');
if(!macro||macro.name!=='CAV — Ambience Phases (GM)')throw Error('Expected original GM macro absent');
const current=macro.getFlag(NS,KEY);
if(current?.version!==1||current?.sourceCount!==47)throw Error('Macro saved baseline absent');
let selection=(typeof phase==='string'&&phase)||globalThis.__CAV_AMBIENCE_PHASE_REQUEST||null;
if(!selection){
 selection=await foundry.applications.api.DialogV2.wait({
 window:{title:'Cabin — Change Ambience Phase'},
 content:'<p>Choose a campaign atmosphere. Scene IDs, puzzles, embedded lights and sounds will not change. Only the selected phase will be applied; no automatic phase advancement.</p>',
 buttons:[
 {action:'early',label:'Early Game',default:true},
 {action:'mid',label:'Midgame'},
 {action:'late',label:'Late Game'},
 {action:'crimson',label:'Crimson Veil'},
 {action:'restore',label:'Restore Original Scene Ambience'},
 {action:'cancel',label:'Cancel'}],
 close:()=>null
 });
}
if(selection==='restore'){
 if(current.pending)throw Error('Ambience transaction pending; inspect first');
 const all=game.scenes.contents;
 if(all.length!==47||Object.keys(C.originals).length!==47)throw Error('Catalog drift');
 for(const sc of all)if(sc.name!==C.originals[sc.id]?.name)throw Error('Name drift '+sc.id);
 await macro.setFlag(NS,KEY,{...current,pending:'restore'});
 const back=all.map(sc=>({_id:sc.id,
  'environment.darknessLevel':C.originals[sc.id].darknessLevel,
  'environment.dark.hue':C.originals[sc.id].darkHue,
  weather:C.originals[sc.id].weather,
  ['flags.'+NS+'.'+KEY]:{version:1,phase:'original',restored:true}}));
 await getDocumentClass('Scene').updateDocuments(back);
 for(const sc of all)await FXMASTER.api.effects.stop({scene:sc,
  particles:[C.fxP],filters:[C.fxF],skipFading:true});
 await macro.setFlag(NS,KEY,{...current,phase:'original',pending:null,
  lastVerifiedCount:47,fxSceneCount:0});
 ui.notifications.info('Original Cabin Scene ambience restored for 47 Scenes');
 return{phase:'original',updated:47};
}
if(!C.phases.includes(selection))return false;
if(current.pending)throw Error('Prior phase transaction pending: reconcile before retry');
const all=game.scenes.contents;
if(all.length!==47||Object.keys(C.records).length!==47)throw Error('Scene catalog changed');
for(const [id,row]of Object.entries(C.records)){
 const sc=game.scenes.get(id),ref=C.originals[id];
 if(!sc||sc.name!==ref.name||!row[selection]||!Number.isFinite(row[selection].darknessLevel))
 throw Error('Original Scene name/ID or phase config changed '+id);
 if(sc.getFlag(NS,KEY)?.phase &&sc.getFlag(NS,KEY).phase!==current.phase)
 throw Error('Unreconciled scene phase '+id);
}
// Apply no duplicate FXMaster rows: stop ONLY the two owned stable IDs,
// preserving all preexisting scene FX, Region effects, lights and sounds.
await macro.setFlag(NS,KEY,{...current,pending:selection});
const updates=all.map(sc=>{
 const v=C.records[sc.id][selection];
 return{_id:sc.id,'environment.darknessLevel':v.darknessLevel,
  'environment.dark.hue':v.darkHue,weather:v.weather,
  ['flags.'+NS+'.'+KEY]:{version:1,phase:selection,
   darknessLevel:v.darknessLevel,tone:v.tone,
   fxManaged:true,crimsonVeil:selection==='crimson'}};
});
await getDocumentClass('Scene').updateDocuments(updates);
const fxResults=[];
for(const sc of all){
 const v=C.records[sc.id][selection];
 try{
  await FXMASTER.api.effects.stop({scene:sc,
   particles:[C.fxP],filters:[C.fxF],skipFading:true});
  if(v.particle||v.filter){
   const result=await FXMASTER.api.effects.play({
    scene:sc,skipFading:true,
    ...(v.particle?{particles:[v.particle]}:{}),
    ...(v.filter?{filters:[v.filter]}:{})
   });
   if(result===false)throw Error('No active FXMaster Scene');
   fxResults.push({id:sc.id,fx:true});
  }else fxResults.push({id:sc.id,fx:false});
 }catch(error){
  console.error('[CAV ambience] Phase partial; preserve pending receipt and reconcile',sc.id,error);
  throw error;
 }
}
await macro.setFlag(NS,KEY,{...current,phase:selection,pending:null,
 lastVerifiedCount:47,fxSceneCount:fxResults.filter(x=>x.fx).length});
ui.notifications.info('Cabin ambience: '+selection+' applied to 47 Scenes. Existing lights, sounds, Regions, tokens, and destination UUIDs preserved.');
return{phase:selection,updated:47,fxSceneCount:fxResults.filter(x=>x.fx).length};
})()
`.trim();
}