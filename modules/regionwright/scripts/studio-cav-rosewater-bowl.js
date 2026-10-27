import {evaluateRosewaterSluiceProof,CAV_ROSEWATER_SCENE,CAV_ROSEWATER_REGION,CAV_ROSEWATER_SESSION} from "./studio-cav-rosewater-state.js";
import {assessUnifiedBathBowlClaim,validateRosewaterOriginalBowlTemplate} from "./studio-cav-rosewater-safety.js";
import {matchRosewaterOwnerApprovedSymbols} from "../../regionwright-puzzles-locks/scripts/rosewater-campaign-preset.js";

const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil",SCENE=CAV_ROSEWATER_SCENE;
const APPROVAL="cavRosewaterBowlPickupApproval",CLAIM="cavRosewaterBowlClaim",REQUEST="cavRosewaterBowlRequest";
const BEHAVIOR="CAVROSEBOWLPICK1",HOOK="__CAV_ROSEWATER_BOWL_GM_SERVICE_001",LOCK="__CAV_ROSEWATER_BOWL_GM_BUSY_001";
const ORIGINAL="Item.1n5LONw3nYIy61O9";
const SCRIPT='await game.modules.get("regionwright")?.api?.campaign?.cabin?.rosewaterBowl?.handleRegionEvent(region, event);';
const EVENTS=["behaviorViewed","behaviorUnviewed","behaviorDeactivated"];
const gm=()=>game?.ready&&game.world?.id===WORLD&&game.user?.isGM&&game.users.activeGM?.id===game.user.id;

export function assessOriginalCavBowlReward({
 approval=null,sceneId=SCENE,fixtureRegionId=null,fixtureRegionUuid=null,
 nativeReady=false,ringNativeReady=false,ringReceipt=null,symbols=null,sluiceProof=null,
 actorAuthorized=false,actorInFixture=false,sourceItem=null,claim=null,alreadyAwarded=false
}={}){
 const deny=reason=>({ready:false,reason});
 if(approval?.status!=="OWNER_APPROVED"||approval?.approvalSource!=="owner"||
  approval?.sceneId!==SCENE||approval?.regionId!==fixtureRegionId||
  approval?.regionUuid!==fixtureRegionUuid||sceneId!==SCENE||
  typeof fixtureRegionId!=="string"||!fixtureRegionId||typeof fixtureRegionUuid!=="string"||
  fixtureRegionUuid!=="Scene."+SCENE+".Region."+fixtureRegionId)
  return deny("owner-fixture-approval-missing");
 if(!nativeReady)return deny("original-pickup-behavior-not-installed");
 if(!matchRosewaterOwnerApprovedSymbols(symbols))return deny("original-ring-symbols-unapproved");
 if(!ringNativeReady)return deny("original-ring-not-commissioned");
 if(ringReceipt?.status!=="done"||ringReceipt?.version!==1||
  !Number.isInteger(ringReceipt.revision)||ringReceipt.revision<1||
  !Array.isArray(ringReceipt.positions)||ringReceipt.positions.length!==3||
  JSON.stringify(ringReceipt.positions)!=="[1,3,2]"||
  typeof ringReceipt.lastMessageId!=="string"||!ringReceipt.lastMessageId||
  typeof ringReceipt.actorId!=="string"||!ringReceipt.actorId||
  typeof ringReceipt.requesterId!=="string"||!ringReceipt.requesterId)
  return deny("original-rosewater-rings-not-solved");
 if(sluiceProof?.ready!==true)return deny("original-sluice-not-drained");
 if(!actorAuthorized||!actorInFixture)return deny("original-player-or-location-unauthorized");
 const decision=assessUnifiedBathBowlClaim({approvedPickupRegionId:fixtureRegionId,
  clickedRegionId:fixtureRegionId,actorAtRegion:true,sourceItem,claim});
 if(decision!=="ready")return deny(decision);
 if(alreadyAwarded)return deny("original-bowl-global-copy-already-awarded");
 return{ready:true,reason:"original-bowl-claim-ready"};
}

function context(){
 const s=game.scenes.get(SCENE),ring=s?.regions.get(CAV_ROSEWATER_REGION),approval=ring?.getFlag(NS,APPROVAL);
 const fixture=approval?.regionId?s?.regions.get(approval.regionId):null;
 const behavior=fixture?.behaviors.get(BEHAVIOR);
 const symbols=ring?.getFlag(NS,"cavRosewaterApprovedSymbols");
 const sluice=game.scenes.get("CAVEXT02Scene001")?.regions.get("CAVEXT02SLUICE01");
 const proof=evaluateRosewaterSluiceProof({water:sluice?.getFlag(NS,"cavPondBathWaterState"),
  transition:sluice?.getFlag(NS,"cavSluiceStageTransaction"),
  crank:sluice?.getFlag(NS,"cavSluiceCrankInstall"),
  controller:sluice?.getFlag(NS,"cavSluiceInstallController")});
 const ringBehavior=ring?.behaviors.get("CAVROSEWATERSCR1");
 const ringBinding=ring?.getFlag(NS,"cavUnifiedBathPuzzleBinding");
 const ringNativeReady=ringBinding?.status==="ENABLED"&&ringBinding?.puzzleKind==="rosewater-rings"&&
  ring?.getFlag(NS,"cavUnifiedBathFixtureKey")==="rosewater-ring-main-drain"&&
  ring?.behaviors.size===1&&ringBehavior?.disabled===false&&
  ringBehavior?.type==="executeScript"&&
  ringBehavior.system?.source==='await game.modules.get("regionwright")?.api?.campaign?.cabin?.rosewaterRings?.handleRegionEvent(region, event);'&&
  ringBehavior.system?.events.size===3&&
  ["behaviorViewed","behaviorUnviewed","behaviorDeactivated"].every(e=>ringBehavior.system.events.has(e));
 const nativeReady=!!fixture&&!!approval&&!!ring&&fixture.uuid===approval.regionUuid&&fixture.id!==ring.id&&
  fixture.behaviors.size===1&&behavior?.disabled===false&&behavior?.type==="executeScript"&&
  behavior.system?.source===SCRIPT&&behavior.system.events.size===EVENTS.length&&
  EVENTS.every(e=>behavior.system.events.has(e));
 return {s,ring,fixture,approval,nativeReady,ringNativeReady,proof,symbols:
  symbols?.status==="OWNER_APPROVED"&&symbols?.approvalSource==="owner"?symbols.symbols:null,
  ringReceipt:ring?.getFlag(NS,CAV_ROSEWATER_SESSION)??null};
}

export function describeOriginalCavBowlPickupGM(){
 if(!gm())return{status:"not-elected-gm"};
 const c=context(),item=game.items.get("1n5LONw3nYIy61O9"),claim=c.fixture?.getFlag(NS,CLAIM);
 const result=assessOriginalCavBowlReward({approval:c.approval,sceneId:SCENE,
 fixtureRegionId:c.fixture?.id,fixtureRegionUuid:c.fixture?.uuid,nativeReady:c.nativeReady,
 ringNativeReady:c.ringNativeReady,ringReceipt:c.ringReceipt,symbols:c.symbols,sluiceProof:c.proof,actorAuthorized:false,
 actorInFixture:false,sourceItem:item,claim,alreadyAwarded:false});
 return {status:result.reason,approvedFixture:!!c.approval,
  nativeReady:!!c.nativeReady,ringNativeReady:!!c.ringNativeReady,ringStatus:c.ringReceipt?.status??null,sluiceReady:c.proof.ready,
  sourceItemReady:validateRosewaterOriginalBowlTemplate(item)==="verified",
  claimStatus:claim?.status??null};
}
const center=(t,s)=>({x:t.x+t.width*s.grid.size/2,y:t.y+t.height*s.grid.size/2,elevation:0});

async function processRequest(req,author){
 if(!gm()||req?.version!==1||req.action!=="pickup"||req.sceneId!==SCENE||
 typeof req.regionId!=="string"||typeof req.tokenId!=="string")return"denied";
 const c=context(),user=game.users.get(author),token=c.s?.tokens.get(req.tokenId),actor=token?.actor;
 const authorized=!!user?.active&&!user.isGM&&user.viewedScene===SCENE&&
  !!token&&!token.hidden&&actor?.type==="character"&&actor.testUserPermission(user,"OWNER");
 const inFixture=!!authorized&&c.fixture?.id===req.regionId&&c.fixture.testPoint(center(token,c.s));
 const source=game.items.get("1n5LONw3nYIy61O9"),prior=c.fixture?.getFlag(NS,CLAIM)??null;
 const copies=game.actors.some(a=>a.items.some(i=>i.getFlag(NS,"cavRosewaterBowlSourceUuid")===ORIGINAL||
  (!!c.fixture&&i.getFlag(NS,"cavRosewaterBowlPickupRegionUuid")===c.fixture.uuid)));
 const check=assessOriginalCavBowlReward({approval:c.approval,sceneId:req.sceneId,
  fixtureRegionId:c.fixture?.id,fixtureRegionUuid:c.fixture?.uuid,nativeReady:c.nativeReady,
  ringNativeReady:c.ringNativeReady,ringReceipt:c.ringReceipt,symbols:c.symbols,sluiceProof:c.proof,
  actorAuthorized:authorized,actorInFixture:inFixture,sourceItem:source,claim:prior,
  alreadyAwarded:copies});
 if(!check.ready)return check.reason;
 // A single elected-GM transaction. Interrupted writes leave RESERVED and require reconciliation.
 const reserve={version:1,status:"reserved",actorId:actor.id,authorId:author,
  sourceUuid:ORIGINAL,pickupRegionUuid:c.fixture.uuid,ringRegionUuid:c.ring.uuid};
 await c.fixture.setFlag(NS,CLAIM,reserve);
 const obj=source.toObject();delete obj._id;
 obj.flags={...obj.flags,[NS]:{...obj.flags?.[NS],
  cavRosewaterBowlSourceUuid:ORIGINAL,cavRosewaterBowlPickupRegionUuid:c.fixture.uuid}};
 const made=await actor.createEmbeddedDocuments("Item",[obj]);
 if(made.length!==1||made[0].name!==source.name||
  made[0].getFlag(NS,"cavRosewaterBowlSourceUuid")!==ORIGINAL)
  throw Error("Original Scrying Bowl grant uncertain; reserved transaction retained");
 const done={...reserve,status:"done",embeddedItemId:made[0].id};
 await c.fixture.setFlag(NS,CLAIM,done);
 if(JSON.stringify(c.fixture.getFlag(NS,CLAIM))!==JSON.stringify(done))
  throw Error("Original Scrying Bowl done receipt uncertain; do not replay");
 return"done";
}

export function installCavRosewaterBowlGMService(){
 if(typeof Hooks==="undefined"||typeof game==="undefined"||game.world?.id!==WORLD)return false;
 if(globalThis[HOOK]?.id)return true;
 const id=Hooks.on("createChatMessage",async(msg,options,author)=>{
  if(!gm()||!msg?.getFlag)return;
  const req=msg.getFlag(NS,REQUEST);if(!req)return;
  if(msg.user?.id!==author||!msg.user.active||msg.user.isGM||globalThis[LOCK])return;
  globalThis[LOCK]=true;let result="reconcile";
  try{result=await processRequest(req,author)}
  catch(e){console.error("[CAV Bowl] interrupted original Bowl transaction",e)}
  finally{globalThis[LOCK]=false}
  const reply=result==="done"?"You lift Sune's Scrying Bowl from its plinth.":result==="already-claimed"?
   "The relic has already been taken.":"The Bowl cannot be claimed. Ask the Gamemaster to inspect the mechanism.";
  try{await ChatMessage.create({speaker:{alias:"Sune's Scrying Bowl"},whisper:[author],content:"<p>"+reply+"</p>"})}
  catch(e){console.warn("[CAV Bowl] private feedback unavailable",e)}
 });
 globalThis[HOOK]={id};return true;
}

export async function handleCavRosewaterBowlRegionEvent(region,event){
 if(game?.world?.id!==WORLD||game.user?.isGM||!canvas?.ready||region?.parent?.id!==SCENE||
  region?.behaviors?.get(BEHAVIOR)?.disabled!==false)return;
 const key="__CAV_ROSEWATER_BOWL_POINTER_"+region.id,old=globalThis[key];
 if(event?.name==="behaviorUnviewed"||event?.name==="behaviorDeactivated"){
  if(old?.handler)canvas.stage.off("pointertap",old.handler);
  delete globalThis[key];return;
 }
 if(event?.name!=="behaviorViewed")return;
 if(old?.handler)canvas.stage.off("pointertap",old.handler);
 const handler=async e=>{
  if(!canvas?.ready||canvas.scene?.id!==SCENE||(e.button!==undefined&&e.button!==0))return;
  const pos=canvas.stage.toLocal(e.global);
  if(!region.testPoint({x:pos.x,y:pos.y,elevation:0}))return;
  const a=canvas.tokens.controlled.filter(t=>t.actor?.type==="character"&&!t.document.hidden&&
   t.actor.testUserPermission(game.user,"OWNER")&&region.testPoint(center(t.document,canvas.scene)));
  if(a.length!==1||!game.users.activeGM?.active)return;
  // Future approved fixture only; a player click cannot choose where the Bowl appears.
  const ring=game.scenes.get(SCENE)?.regions.get(CAV_ROSEWATER_REGION);
  const approval=ring?.getFlag(NS,APPROVAL);
  if(approval?.status!=="OWNER_APPROVED"||approval?.approvalSource!=="owner"||
   approval.regionId!==region.id||approval.regionUuid!==region.uuid)return;
  await ChatMessage.create({content:"<p>You reach toward the Sune reliquary.</p>",
   whisper:[game.users.activeGM.id,game.user.id],flags:{[NS]:{[REQUEST]:{
    version:1,action:"pickup",sceneId:SCENE,regionId:region.id,tokenId:a[0].document.id}}}});
 };
 canvas.stage.on("pointertap",handler);globalThis[key]={handler};
}
