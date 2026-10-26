import {planCavWaterChange,normalizeCavWaterState} from "./studio-cav-water-state.js";
import {checkAqueductRouteForWater,prepareAqueductPortalsForClosing,completeAqueductPortalsAfterOpening,confirmAqueductPortalsWaterStage} from "./studio-cav-aqueduct-routing.js";
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil";
const POND="CAVEXT02Scene001",CONTROL="CAVEXT02SLUICE01";
const BATH="CAVBATHScene0001",BATH_DRY="8yLMRDvxyw58dydh",TRAIL="CAVTRAILScene001";
const TRAIL_REGION="13g6uK1QrR9PFOzA",TRAIL_BEHAVIOR="ZbrhX0nnaLvLA5Zh";
const BATH_ARRIVAL="R2Pg9eHODtb1C1Yk",BATH_RETURN="SLovYxFAWVAMFzXg";
const POND_FULL="Maps/cabin-in-the-ashen-veil/ext-02_pond_full_owner-approved.png";
const POND_DRY="Maps/cabin-in-the-ashen-veil/ext-02_pond_drained_owner-approved.png";
const BATH_FULL="Maps/cabin-in-the-ashen-veil/bathhouse_unified_surface_owner-approved.png";
const BATH_DRY_ART="Maps/cabin-in-the-ashen-veil/bathhouse_unified_surface_drained_owner-approved_2026-10-26.png";
const DRAINED_HASH="337d84929ca93eaf29527124f33ffa26dad24082ffcf4659cca6c7932892c11e";
const HOOK="__CAV_SLUICE_WATER_GM_SERVICE_v001",LOCK="__CAV_SLUICE_WATER_GM_BUSY_v001";
const TRANSITION="cavSluiceStageTransaction",WATER="cavPondBathWaterState";
const DEST=(drained)=>"Scene."+(drained?BATH_DRY:BATH)+".Region."+BATH_ARRIVAL;
function activeGM(){return game?.ready===true&&game.world?.id===WORLD&&game.user?.isGM===true&&game.users.activeGM?.id===game.user.id;}
function center(token,scene){return{x:token.x+token.width*scene.grid.size/2,y:token.y+token.height*scene.grid.size/2,elevation:0};}
function docs(){
 const pond=game.scenes.get(POND),region=pond?.regions.get(CONTROL);
 const trail=game.scenes.get(TRAIL),portal=trail?.regions.get(TRAIL_REGION)?.behaviors.get(TRAIL_BEHAVIOR);
 const full=game.scenes.get(BATH),dry=game.scenes.get(BATH_DRY);
 return {pond,region,trail,portal,full,dry};
}
function geometryEqual(left,right){
 const l=left?.regions.get(BATH_ARRIVAL),r=right?.regions.get(BATH_ARRIVAL);
 const le=left?.regions.get(BATH_RETURN),re=right?.regions.get(BATH_RETURN);
 const lb=le?.behaviors.contents.find(b=>b.type==="teleportToken");
 const rb=re?.behaviors.contents.find(b=>b.type==="teleportToken");
 return !!l&&!!r&&!!le&&!!re&&
 JSON.stringify(l.shapes.map(s=>s.toObject()))===JSON.stringify(r.shapes.map(s=>s.toObject()))&&
 JSON.stringify(le.shapes.map(s=>s.toObject()))===JSON.stringify(re.shapes.map(s=>s.toObject()))&&
 JSON.stringify([...lb.system.destinations])===JSON.stringify([...rb.system.destinations])&&
 left.width===right.width&&left.height===right.height&&left.grid.size===right.grid.size;
}
export const sluiceGateRouteInterlock=(mechanicalReady,routeTransaction)=>
 mechanicalReady?.traversalEnabled!==true||routeTransaction?.status==="done";
export function evaluateSluicePositionSafety({pondTokens=[],fullBathTokens=[],dryBathTokens=[],aqueductTokens=[],safePondTokenIds=[]}={}){
 if(fullBathTokens.length||dryBathTokens.length)return {ok:false,reason:"bathhouse-occupied"};
 // The original Forest Well may eventually provide a safe return, but do not assume
 // Aqueduct occupants can navigate it until two-way well routes are independently verified.
 if(aqueductTokens.length)return {ok:false,reason:"aqueduct-occupied"};
 const safe=new Set(safePondTokenIds);
 if(pondTokens.some(t=>!safe.has(t)))return {ok:false,reason:"pond-hazard"};
 return {ok:true,reason:"clear"};
}
async function transition(req,authorId){
 if(!activeGM()||req?.version!==1||!["open","close"].includes(req.action)||req.sceneId!==POND||req.regionId!==CONTROL)return "denied";
 const {pond,region,portal,full,dry}=docs();
 const user=game.users.get(authorId),token=pond?.tokens.get(req.tokenId),actor=token?.actor;
 if(!region||!portal||!user?.active||user.isGM||!token||token.hidden||actor?.type!=="character"||
 !actor.testUserPermission(user,"OWNER")||!region.testPoint(center(token,pond)))return "denied";
 if(region.getFlag(NS,"cavSluiceCrankInstall")?.status!=="done")return "crank-needed";
 // A commissioned Aqueduct gate is safe only with its completed transaction receipt.
 const aqGate=pond.regions.get("CAVPONDAQGATE001");
 if(!sluiceGateRouteInterlock(aqGate?.getFlag(NS,"cavAqueductGateMechanicalReady"),
   aqGate?.getFlag(NS,"cavAqueductRouteTransaction")))return "aqueduct-route-active";
 if(region.getFlag(NS,"noDrainActivation")!==false||
 region.getFlag(NS,"cavSluiceInstallController")?.drainEnabled!==true)return "blocked";
 const priorTransaction=region.getFlag(NS,TRANSITION);
 if(priorTransaction?.status==="reserved")return "reconcile";
 if(priorTransaction&&priorTransaction.status!=="done")return "reconcile";
 if(!geometryEqual(full,dry)||!dry||dry.getFlag(NS,"cavWaterVariant")!=="drained"||
 dry.getFlag(NS,"approvedArtSha256")!==DRAINED_HASH||dry.background.src!==BATH_DRY_ART||
 full.background.src!==BATH_FULL||dry.active||full.active)return "reconcile";
 const originalWater=region.getFlag(NS,WATER);
 let current;try{current=normalizeCavWaterState(originalWater);}catch{return "reconcile";}
 const drained=current.status==="open";
 const aqRoute=checkAqueductRouteForWater(current.status);
 if(aqRoute.status!=="ready")return "reconcile";
 const expectedPond=drained?POND_DRY:POND_FULL;
 const expectedDestination=DEST(drained);
 if(pond.background.src!==expectedPond||
 pond.levels.contents[0]?.background.src!==expectedPond||
 portal.system.destinations.size!==1||![...portal.system.destinations].includes(expectedDestination))return "reconcile";
 const aq=game.scenes.get("CAVAQ01Scene0001");
 if(!aq)return "reconcile";
 const allPond=pond.tokens.contents;
 const safePond=allPond.filter(t=>!t.hidden&&region.testPoint(center(t,pond))).map(t=>t.id);
 const position=evaluateSluicePositionSafety({pondTokens:allPond.map(t=>t.id),
  fullBathTokens:full.tokens.contents.map(t=>t.id),dryBathTokens:dry.tokens.contents.map(t=>t.id),
  aqueductTokens:aq.tokens.contents.map(t=>t.id),safePondTokenIds:safePond});
 const isSafe=position.ok;
 const plan=planCavWaterChange({current,action:req.action,crankInstalled:true,originalRegionReady:true,
  pondVisualApproved:true,bathVisualApproved:true,tokenPositionsSafe:isSafe,
  returnRoutesSafe:geometryEqual(full,dry)});
 if(plan.result!=="ready")return plan.result==="pending-safety"?"unsafe":plan.result;
 // All Stage changes are elected-GM authoritative. Avoid moving any token or duplicating scene objects.
 const newPond=plan.next.status==="open"?POND_DRY:POND_FULL;
 const newDest=DEST(plan.next.status==="open");
 const level=pond.levels.contents[0];
 if(!level||pond.levels.size!==1)return "reconcile";
 const reserve={version:1,status:"reserved",operation:req.action,actorId:actor.id,
  authorId,tokenId:token.id,prior:current,next:plan.next,priorPond:expectedPond,
  nextPond:newPond,priorPortal:expectedDestination,nextPortal:newDest};
 await region.setFlag(NS,TRANSITION,{...reserve,aqueductRouteCommissioned:aqRoute.commissioned});
 // A closing sluice FIRST disables both Pond/Aqueduct native traversals.
 // Failure retains the reserved Sluice receipt for the GM; no token is moved.
 if(req.action==="close"){
  const closure=await prepareAqueductPortalsForClosing();
  if(closure.status!=="ready")throw Error("Aqueduct portal closure uncertain");
 }
 // From here, failure leaves an auditable reserved marker, NOT an untracked retry or invented success.
 await level.update({"background.src":newPond});
 if(pond.background.src!==newPond||level.background.src!==newPond)throw Error("Pond visual update uncertain");
 const portalRegion=game.scenes.get(TRAIL).regions.get(TRAIL_REGION);
 await portalRegion.updateEmbeddedDocuments("RegionBehavior",[{_id:TRAIL_BEHAVIOR,system:{destinations:[newDest]}}]);
 if(![...portalRegion.behaviors.get(TRAIL_BEHAVIOR).system.destinations].includes(newDest))throw Error("Bath entry route update uncertain");
 // Opening restores reciprocal AQ return BEFORE enabling Pond entry; Forest Well is unchanged.
 if(req.action==="open"){
  const reopening=await completeAqueductPortalsAfterOpening(aqRoute.commissioned);
  if(reopening.status!=="ready")throw Error("Aqueduct portal reopening uncertain");
 }
 await region.setFlag(NS,WATER,{...plan.next,stage:"committed",source:"sluice",version:1});
 if(aqRoute.commissioned){
  const marked=await confirmAqueductPortalsWaterStage(plan.next.status);
  if(marked.status!=="ready")throw Error("Aqueduct route stage receipt uncertain");
 }
 await region.setFlag(NS,TRANSITION,{...reserve,aqueductRouteCommissioned:aqRoute.commissioned,
  status:"done",committedState:plan.next.status});
 return "done";
}
export function installCabinSluiceWaterService(){
 if(typeof game==="undefined"||typeof Hooks==="undefined"||game.world?.id!==WORLD)return false;
 if(globalThis[HOOK]?.hookId)return true;
 const handler=async(message,options,authorId)=>{
  if(!activeGM())return;
  const req=message?.getFlag?.(NS,"cavSluiceStageRequest");if(!req)return;
  const user=message.user;if(!user||user.id!==authorId||user.isGM||!user.active)return;
  if(globalThis[LOCK])return;globalThis[LOCK]=true;
  let result="reconcile";
  try{result=await transition(req,authorId);}
  catch(e){console.error("[CAV Sluice] partial visual/portal transaction; GM must reconcile reserved marker",e);}
  finally{globalThis[LOCK]=false;}
  const output={done:req.action==="open"?"The gate shudders open. Water drains from the pond and the bathhouse pools.":"The sluice closes, and water refills the pond and bathhouse pools.",
   unsafe:"The mechanism resists while someone remains by the water, in the Bathhouse, or inside the Aqueduct. Clear the area first.",
   "aqueduct-route-active":"The Aqueduct route lacks a completed commissioning receipt. The Gamemaster must reconcile it before changing the sluice.",
   denied:"Only an authorized nearby character can operate this sluice.",
   "crank-needed":"The original Crank must be fitted before the wheel will turn.",
   blocked:"The flood controls remain locked.",
   reconcile:"The sluice has stopped partway through. Gamemaster inspection is required before using it again."};
  try{await ChatMessage.create({speaker:{alias:"The Sluice Gate"},whisper:[authorId],content:"<p>"+(output[result]||"The gate refuses to budge.")+"</p>"});}
  catch(e){console.warn("[CAV Sluice] GM state receipt preserved, narration failed",e);}
 };
 globalThis[HOOK]={hookId:Hooks.on("createChatMessage",handler),version:1,world:WORLD};
 return true;
}

