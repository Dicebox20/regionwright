import {assessCavAqueductCommissioningProof} from "./studio-cav-aqueduct-route-proof.js";
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil";
const POND="CAVEXT02Scene001",AQ="CAVAQ01Scene0001",FM="CAVFM01Scene0001",CONTROL="CAVEXT02SLUICE01";
const GATE="CAVPONDAQGATE001",ENTRANCE="CAVPONDAQPORT001",RETURN="CAVAQ01RETBEH001",AQ_RETURN="CAVAQ01RETURN001";
const WELL_EXIT="CAVAQWELLPORT001",WELL_NORTH="CAVAQWELLNORTH01",WELL_REENTRY="CAVFMWELLREENT01",WELL_MOUTH="CAVFMWELLPORT001";
const CHASE="woZ98KXx0RsWIPpl",CHASE_TRIGGER="CAVAQCHASETRIG01";
const GEAR="cavAqueductGearInstalled",HANDLE="cavAqueductHandleInstalled",MECHANICAL="cavAqueductGateMechanicalReady";
const ROUTE="cavAqueductRouteTransaction",WELL="cavForestWellUnlockTransaction",CHASE_STATE="cavFirstAqueductChase";
const TARGETS=Object.freeze({
 entrance:"Scene.CAVAQ01Scene0001.Region.woZ98KXx0RsWIPpl",
 return:"Scene.CAVEXT02Scene001.Region.CAVPONDAQARRV001",
 wellExit:"Scene.CAVFM01Scene0001.Region.CAVFMWELLARRV001",
 wellReentry:"Scene.CAVAQ01Scene0001.Region.CAVAQWELLARRV001"
});
const gm=()=>game?.ready===true&&game.world?.id===WORLD&&game.user?.isGM===true&&game.users?.activeGM?.id===game.user.id;
export const aqueductPortalsForWater=(commissioned,waterStatus)=>({
 entryEnabled:commissioned&&waterStatus==="open",returnEnabled:commissioned&&waterStatus==="open",
 wellReentryUnaffected:true
});
export function canCommissionAqueduct({water,gear,handle,mechanical,existingTransaction,actorReady=false,allTransitDisabled=false,aqEmpty=false}={}){
 if(existingTransaction)return "reconcile";
 if(water?.status!=="open"||water?.pond!=="drained"||water?.bath!=="drained")return "water-not-drained";
 if(gear?.status!=="done"||handle?.status!=="done"||mechanical?.status!=="ready"||mechanical.traversalEnabled===true)return "parts-incomplete";
 if(!actorReady)return "crooked-man-actor-needed";
 if(!allTransitDisabled||!aqEmpty)return "route-unsafe";
 return "ready";
}
export function canUnlockForestWell({chase,route,alreadyUnlocked=false}={}){
 if(alreadyUnlocked)return "already";
 if(route?.status!=="done")return "route-not-commissioned";
 if(!["escaped_pending_well_exit","captured","capture_resolved"].includes(chase?.status))return "chase-not-resolved";
 if(chase.status==="escaped_pending_well_exit"&&chase.successes!==3)return "chase-not-resolved";
 if(chase.status==="captured"&&chase.captureCount!==1)return "chase-not-resolved";
 return "ready";
}
function objects(){
 const pond=game.scenes.get(POND),aq=game.scenes.get(AQ),fm=game.scenes.get(FM);
 const gate=pond?.regions.get(GATE),south=aq?.regions.get(CHASE),north=aq?.regions.get(WELL_NORTH),mouth=fm?.regions.get(WELL_MOUTH);
 const returnRegion=aq?.regions.get(AQ_RETURN),sluice=pond?.regions.get(CONTROL);
 return{pond,aq,fm,gate,south,north,mouth,returnRegion,sluice,entry:gate?.behaviors.get(ENTRANCE),
  returnPortal:returnRegion?.behaviors.get(RETURN),exit:north?.behaviors.get(WELL_EXIT),
  reentry:mouth?.behaviors.get(WELL_REENTRY),trigger:south?.behaviors.get(CHASE_TRIGGER)};
}
function topology(x){
 const pairs=[[x.entry,TARGETS.entrance],[x.returnPortal,TARGETS.return],[x.exit,TARGETS.wellExit],[x.reentry,TARGETS.wellReentry]];
 return !!x.pond&&!!x.aq&&!!x.fm&&!!x.gate&&!!x.south&&!!x.sluice&&!!x.north&&!!x.mouth&&
  pairs.every(([b,d])=>b?.type==="teleportToken"&&b.system.destinations.size===1&&b.system.destinations.has(d))&&
  x.trigger?.type==="executeScript"&&x.trigger.system.events.has("tokenMoveIn");
}
const isDone=(flag)=>flag?.status==="done";
const transitDisabled=(x)=>x.entry?.disabled===true&&x.returnPortal?.disabled===true;
const noPartial=(flag)=>!flag||flag.status==="done";
const transactionDone=(x)=>x.gate.getFlag(NS,ROUTE)?.status==="done";
function crookedActor(actorId){
 const a=game.actors.get(actorId);
 const art=a?.prototypeToken?.texture?.src||a?.img||"";
 return !!a&&a.type==="npc"&&/crooked man/i.test(a.name)&&art.length>4&&
 !/mystery-man|mystery|svg|icons\/svg\/mystery/i.test(art);
}
async function alter(region,behaviorId,disabled){
 const b=region?.behaviors.get(behaviorId);
 if(!b||b.disabled===disabled)return;
 await region.updateEmbeddedDocuments("RegionBehavior",[{_id:behaviorId,disabled}]);
 if(region.behaviors.get(behaviorId)?.disabled!==disabled)throw Error("Native portal update uncertain: "+behaviorId);
}
export function checkAqueductRouteForWater(currentStatus){
 const x=objects();
 if(!topology(x))return{status:"invalid-topology"};
 const ready=x.gate.getFlag(NS,MECHANICAL);
 const route=x.gate.getFlag(NS,ROUTE);
 const commissioned=ready?.traversalEnabled===true;
 if(!commissioned){
  if(route||!transitDisabled(x))return{status:"reconcile"};
  return{status:"ready",commissioned:false};
 }
 if(route?.status!=="done"||!isDone(x.gate.getFlag(NS,GEAR))||!isDone(x.gate.getFlag(NS,HANDLE))||
    x.trigger?.disabled!==false)return{status:"reconcile"};
 const expected=aqueductPortalsForWater(true,currentStatus);
 if((x.entry.disabled===!expected.entryEnabled)&&(x.returnPortal.disabled===!expected.returnEnabled))
  return{status:"ready",commissioned:true};
 return{status:"reconcile"};
}
export async function prepareAqueductPortalsForClosing(){
 if(!gm())return{status:"not-elected-gm"};
 const x=objects(),state=checkAqueductRouteForWater("open");
 if(state.status!=="ready")return state;
 if(!state.commissioned)return{status:"ready",commissioned:false};
 await alter(x.gate,ENTRANCE,true);
 await alter(x.returnRegion,RETURN,true);
 return{status:"ready",commissioned:true,entryDisabled:true,returnDisabled:true};
}
export async function completeAqueductPortalsAfterOpening(commissioned){
 if(!gm())return{status:"not-elected-gm"};
 const x=objects();if(!topology(x))return{status:"invalid-topology"};
 if(!commissioned){
  if(!transitDisabled(x))return{status:"reconcile"};
  return{status:"ready",commissioned:false};
 }
 if(!transactionDone(x)||!transitDisabled(x))return{status:"reconcile"};
 await alter(x.returnRegion,RETURN,false);
 await alter(x.gate,ENTRANCE,false);
 return{status:"ready",commissioned:true,entryEnabled:true,returnEnabled:true};
}
export async function confirmAqueductPortalsWaterStage(newStatus){
 if(!gm())return{status:"not-elected-gm"};
 const x=objects(),record=x.gate?.getFlag(NS,ROUTE);
 if(!topology(x)||record?.status!=="done"||!["open","closed"].includes(newStatus))return{status:"reconcile"};
 const expected=aqueductPortalsForWater(true,newStatus);
 if(x.entry.disabled!==!expected.entryEnabled||x.returnPortal.disabled!==!expected.returnEnabled)return{status:"reconcile"};
 await x.gate.setFlag(NS,ROUTE,{...record,waterStage:newStatus});
 return{status:"ready",waterStage:newStatus};
}
export async function commissionAqueductForGameplay({crookedManActorId,gmConfirmed=false}={}){
 if(!gm())return{status:"not-elected-gm"};
 if(gmConfirmed!==true)return{status:"explicit-gm-confirmation-required"};
 const x=objects();if(!topology(x))return{status:"invalid-topology"};
 if(x.sluice.getFlag(NS,"cavSluiceStageTransaction")?.status!=="done")return{status:"sluice-not-committed"};
 if(x.sluice.getFlag(NS,"cavPondBathWaterState")?.status!=="open"||
    x.pond.background.src!=="Maps/cabin-in-the-ashen-veil/ext-02_pond_drained_owner-approved.png")return{status:"water-not-drained"};
 const result=canCommissionAqueduct({water:x.sluice.getFlag(NS,"cavPondBathWaterState"),
  gear:x.gate.getFlag(NS,GEAR),handle:x.gate.getFlag(NS,HANDLE),mechanical:x.gate.getFlag(NS,MECHANICAL),
  existingTransaction:x.gate.getFlag(NS,ROUTE),actorReady:crookedActor(crookedManActorId),
  allTransitDisabled:transitDisabled(x)&&x.exit.disabled&&x.reentry.disabled&&x.trigger.disabled,
  aqEmpty:x.aq.tokens.size===0});
  if(result!=="ready")return{status:result};
  // Future explicit commissioning: item-grant ledgers must match consumed gear/handle IDs.
  // No Crooked Man chase, portal or world changes are made during this check.
  const roof=game.scenes.get("LhtyO17QenuCExsb")?.regions.get("CAVROOFCLOCKR001");
  const parents=game.scenes.get("CAVHU04Scene0001")?.regions.get("CAVPARENTNIGHT01");
  const driver=game.scenes.get("8yLMRDvxyw58dydh")?.regions.get("CAVBATHSCRDRY001");
  const trail=game.scenes.get("CAVTRAILScene001")?.regions.get("13g6uK1QrR9PFOzA")?.behaviors.get("ZbrhX0nnaLvLA5Zh");
  const routeProof=assessCavAqueductCommissioningProof({
   gearLedger:x.gate.getFlag(NS,GEAR),handleLedger:x.gate.getFlag(NS,HANDLE),
   mechanical:x.gate.getFlag(NS,MECHANICAL),
   roofGearClaim:roof?.getFlag(NS,"cavRoofClockClaim"),
   nightstandHandleClaim:parents?.getFlag(NS,"cavNightstandHandleClaim"),
   nightstandRepair:parents?.getFlag(NS,"cavNightstandRepaired"),
   screwdriverClaim:driver?.getFlag(NS,"cavDrainedPickupClaim"),
   crank:x.sluice.getFlag(NS,"cavSluiceCrankInstall"),
   water:x.sluice.getFlag(NS,"cavPondBathWaterState"),
   transaction:x.sluice.getFlag(NS,"cavSluiceStageTransaction"),
   pondBackground:x.pond.background.src,
   trailPortal:trail&&{id:trail.id,type:trail.type,disabled:trail.disabled,
    destinations:[...(trail.system?.destinations??[])]},
   dryBathLandingExists:!!game.scenes.get("8yLMRDvxyw58dydh")?.regions.get("R2Pg9eHODtb1C1Yk")
  });
  if(!routeProof.ready)return{status:routeProof.reason};
 const reserve={version:1,status:"reserved",crookedManActorId,initiatedBy:game.user.id,priorWater:"open"};
 await x.gate.setFlag(NS,ROUTE,reserve);
 // Only the elected GM may commission this after the physical Crooked Man Actor exists.
 // Enable fallback first; let the first-chase trigger arm before opening Pond entry.
 await alter(x.returnRegion,RETURN,false);
 await alter(x.south,CHASE_TRIGGER,false);
 await x.gate.setFlag(NS,MECHANICAL,{...x.gate.getFlag(NS,MECHANICAL),traversalEnabled:true});
 await alter(x.gate,ENTRANCE,false);
 await x.gate.setFlag(NS,ROUTE,{...reserve,status:"done",waterStage:"open"});
 return{status:"commissioned",actorId:crookedManActorId,entryAndReturnEnabled:true,chaseTriggerEnabled:true};
}
export async function unlockForestWellAfterChaseGM(){
 if(!gm())return{status:"not-elected-gm"};
 const x=objects();if(!topology(x))return{status:"invalid-topology"};
 const old=x.north.getFlag(NS,WELL);
 if(old?.status==="reserved")return{status:"reconcile"};
 if(old?.status==="done"&&x.exit.disabled===false&&x.reentry.disabled===false)return{status:"already"};
 const result=canUnlockForestWell({chase:x.south.getFlag(NS,CHASE_STATE),
  route:x.gate.getFlag(NS,ROUTE),alreadyUnlocked:old?.status==="done"});
 if(result!=="ready")return{status:result};
 if(!x.exit.disabled||!x.reentry.disabled)return{status:"reconcile"};
 await x.north.setFlag(NS,WELL,{version:1,status:"reserved",unlockedBy:game.user.id});
 await alter(x.north,WELL_EXIT,false);
 await alter(x.mouth,WELL_REENTRY,false);
 await x.north.setFlag(NS,WELL,{version:1,status:"done",unlockedBy:game.user.id,independentOfSluice:true});
 return{status:"unlocked",forestWellReentryPersistsAfterRefill:true};
}
export function describeAqueductRouting(){
 if(!gm())return{status:"not-elected-gm"};
 const x=objects();
 return{status:topology(x)?"verified-topology":"invalid-topology",
  water:x.sluice?.getFlag(NS,"cavPondBathWaterState")||null,
  gate:x.gate?.getFlag(NS,MECHANICAL)||null,route:x.gate?.getFlag(NS,ROUTE)||null,
  chase:x.south?.getFlag(NS,CHASE_STATE)?.status||null,well:x.north?.getFlag(NS,WELL)||null,
  portDisabled:{pondEntry:x.entry?.disabled,aqPondReturn:x.returnPortal?.disabled,
   aqWellExit:x.exit?.disabled,fmWellReentry:x.reentry?.disabled,firstChase:x.trigger?.disabled},
  defaultTestPolicy:"Do not commission before Crooked Man NPC Actor art and GM confirmation exist"};
}
