import{planRosewaterGMAction,evaluateRosewaterSluiceProof,CAV_ROSEWATER_SCENE,CAV_ROSEWATER_REGION,CAV_ROSEWATER_SESSION,CAV_ROSEWATER_BEHAVIOR_ID,CAV_ROSEWATER_SYMBOL_FLAG}from"./studio-cav-rosewater-state.js";
import{createRosewaterCampaignConfig,matchRosewaterOwnerApprovedSymbols}from"../../regionwright-puzzles-locks/scripts/rosewater-campaign-preset.js";
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil",HOOK="__CAV_ROSEWATER_CLAW_GM_SERVICE_001",BUSY="__CAV_ROSEWATER_CLAW_GM_BUSY_001";
const SCRIPT='await game.modules.get("regionwright")?.api?.campaign?.cabin?.rosewaterRings?.handleRegionEvent(region, event);';
const EVENTS=["behaviorViewed","behaviorUnviewed","behaviorDeactivated"];
const elected=()=>game?.ready&&game.world?.id===WORLD&&game.user?.isGM&&game.users.activeGM?.id===game.user?.id;
const region=()=>game.scenes.get(CAV_ROSEWATER_SCENE)?.regions.get(CAV_ROSEWATER_REGION);
const slGate=()=>game.scenes.get("CAVEXT02Scene001")?.regions.get("CAVEXT02SLUICE01");
export function getCavRosewaterApprovedSymbols(r=region()){
 const a=r?.getFlag(NS,CAV_ROSEWATER_SYMBOL_FLAG);
 if(a?.status!=="OWNER_APPROVED"||a?.approvalSource!=="owner"||!matchRosewaterOwnerApprovedSymbols(a?.symbols))return null;
 try{createRosewaterCampaignConfig({symbols:a.symbols});return [...a.symbols]}catch{return null}
}
const position=(t,s)=>({x:t.x+t.width*s.grid.size/2,y:t.y+t.height*s.grid.size/2,elevation:0});
function sourceReady(){
 const r=region(),cfg=game.modules.get("regionwright-puzzles-locks")?.api?.rosewater;
 const f=r?.getFlag(NS,"cavUnifiedBathPuzzleBinding"),b=r?.behaviors.get(CAV_ROSEWATER_BEHAVIOR_ID);
 if(!r||r.parent?.id!==CAV_ROSEWATER_SCENE||f?.status!=="ENABLED"||f?.puzzleKind!=="rosewater-rings"||
 r.getFlag(NS,"cavUnifiedBathFixtureKey")!=="rosewater-ring-main-drain"||
 r.behaviors.size!==1||!b||b.disabled||b.type!=="executeScript"||b.system.source!==SCRIPT||
 b.system.events.size!==EVENTS.length||EVENTS.some(evt=>!b.system.events.has(evt))||
 !getCavRosewaterApprovedSymbols(r)||typeof cfg?.open!=="function")return false;
 const target=cfg.createCampaignConfig({symbols:getCavRosewaterApprovedSymbols(r)});
 return JSON.stringify([...target.solution])==="[1,3,2]";
}
const sluiceProof=()=>{
 const x=slGate();
 return evaluateRosewaterSluiceProof({
  water:x?.getFlag(NS,"cavPondBathWaterState"),
  transition:x?.getFlag(NS,"cavSluiceStageTransaction"),
  crank:x?.getFlag(NS,"cavSluiceCrankInstall"),
  controller:x?.getFlag(NS,"cavSluiceInstallController")
 });
};
const drained=()=>sluiceProof().ready;
export function describeCavRosewaterRingGM(){
 if(!elected())return{status:"not-elected-gm"};
 const r=region();return{status:sourceReady()?"ready":"not-commissioned",drained:drained(),session:r?.getFlag(NS,CAV_ROSEWATER_SESSION)??null,
  symbolsApproved:!!getCavRosewaterApprovedSymbols(r),sluiceProof:sluiceProof(),behaviorCount:r?.behaviors.size??null,
  sceneUuid:r?.parent?.uuid??null,ringRegionUuid:r?.uuid??null,canonDegrees:[90,270,180]};
}
async function actionFromPlayer(req,author,messageId){
 if(!elected()||!sourceReady()||!drained()||req?.version!==1||req.sceneId!==CAV_ROSEWATER_SCENE||req.regionId!==CAV_ROSEWATER_REGION)return"denied";
 const user=game.users.get(author),s=game.scenes.get(CAV_ROSEWATER_SCENE),r=region(),token=s.tokens.get(req.tokenId),actor=token?.actor;
 if(!user?.active||user.isGM||user.viewedScene!==CAV_ROSEWATER_SCENE||!token||token.hidden||
 actor?.type!=="character"||!actor.testUserPermission(user,"OWNER")||
 !r.testPoint(position(token,s)))return"denied";
 const prev=r.getFlag(NS,CAV_ROSEWATER_SESSION)??null;
 if(prev?.lastMessageId===messageId)return"already-processed";
 const plan=planRosewaterGMAction(prev,req);
 if(plan.status!=="ready")return plan.status;
 const reservation={version:1,status:"reserved",revision:prev?.revision??0,
  positions:prev?.positions??[0,0,0],lastMessageId:messageId,requesterId:author,actorId:actor.id,operation:req.op,proposed:plan.next};
 await r.setFlag(NS,CAV_ROSEWATER_SESSION,reservation);
 const next={...plan.next,lastMessageId:messageId,requesterId:author,actorId:actor.id};
 await r.setFlag(NS,CAV_ROSEWATER_SESSION,next);
 if(JSON.stringify(r.getFlag(NS,CAV_ROSEWATER_SESSION))!==JSON.stringify(next))throw Error("Rosewater GM session write uncertain");
 return next.status==="done"?"solved":"updated";
}
export function installCavRosewaterRingGMService(){
 if(typeof Hooks==="undefined"||game?.world?.id!==WORLD)return false;
 if(globalThis[HOOK]?.id)return true;
 const id=Hooks.on("createChatMessage",async (msg,options,author)=>{
  if(!elected())return;
  const req=msg.getFlag(NS,"cavRosewaterRingRequest");
  if(!req)return;
  const user=msg.user;
  if(!user||user.id!==author||user.isGM||!user.active||globalThis[BUSY])return;
  globalThis[BUSY]=true;let result="reconcile";
  try{result=await actionFromPlayer(req,author,msg.id)}
  catch(e){console.error("[CAV Rosewater] GM write needs reconciliation",e)}
  finally{globalThis[BUSY]=false}
  const responses={updated:"One concentric stone ring turns a quarter circle.",solved:"The three Rosewater rings align. The central seal releases.",
   incorrect:"The central seal refuses to turn; the symbols are misaligned.","already-solved":"The three rings are already aligned.",
   denied:"The mechanism does not respond.",reconcile:"The lock requires Gamemaster reconciliation.",
   "stale-or-invalid":"The rings shifted before your command. Reopen the panel.",
   "already-processed":"This adjustment has already been accepted."};
  try{await ChatMessage.create({speaker:{alias:"Rosewater Reliquary"},whisper:[author],
   content:"<p>"+(responses[result]??"The lock remains silent.")+"</p>"})}
  catch(e){console.warn("[CAV Rosewater] feedback unavailable",e)}
 });
 globalThis[HOOK]={id};return true;
}
export async function handleCavRosewaterRingRegionEvent(r,event){
 if(game?.world?.id!==WORLD||game.user?.isGM||!canvas?.ready||
  r?.id!==CAV_ROSEWATER_REGION||r.parent?.id!==CAV_ROSEWATER_SCENE)return;
 const key="__CAV_ROSEWATER_POINTER_"+r.parent.id,old=globalThis[key];
 if(event?.name==="behaviorUnviewed"||event?.name==="behaviorDeactivated"){
  if(old?.handler)canvas.stage.off("pointertap",old.handler);
  delete globalThis[key];return;
 }
 if(event?.name!=="behaviorViewed")return;
 if(old?.handler)canvas.stage.off("pointertap",old.handler);
 const handler=async e=>{
  if(!canvas?.ready||canvas.scene?.id!==CAV_ROSEWATER_SCENE||(e.button!==undefined&&e.button!==0))return;
  const xy=canvas.stage.toLocal(e.global);
  if(!r.testPoint({x:xy.x,y:xy.y,elevation:0})||globalThis[key+"_busy"])return;
  const owned=canvas.tokens.controlled.filter(t=>t.actor?.type==="character"&&!t.document.hidden&&t.actor.testUserPermission(game.user,"OWNER"));
  if(owned.length!==1||!r.testPoint(position(owned[0].document,canvas.scene)))return;
  const a=r.getFlag(NS,CAV_ROSEWATER_SYMBOL_FLAG),symbols=getCavRosewaterApprovedSymbols(r);
  if(r.getFlag(NS,"cavUnifiedBathPuzzleBinding")?.status!=="ENABLED"||!a||!symbols)return;
  const api=game.modules.get("regionwright-puzzles-locks")?.api?.rosewater;
  if(typeof api?.open!=="function")return;
  globalThis[key+"_busy"]=true;
  try{await api.open({region:r,symbols,readState:()=>r.getFlag(NS,CAV_ROSEWATER_SESSION),
   onAction:async ({op,ring,direction,expectedRevision})=>{
    const activeGM=game.users.activeGM;
    if(!activeGM?.active)return;
    await ChatMessage.create({content:"<p>You turn the Rosewater lock.</p>",whisper:[activeGM.id,game.user.id],
     flags:{[NS]:{cavRosewaterRingRequest:{version:1,sceneId:CAV_ROSEWATER_SCENE,regionId:CAV_ROSEWATER_REGION,
      tokenId:owned[0].document.id,op,ring,direction,expectedRevision}}}});
   }})}
  catch(e){console.error("[CAV Rosewater] UI unavailable",e)}
  finally{globalThis[key+"_busy"]=false}
 };
 canvas.stage.on("pointertap",handler);globalThis[key]={handler};
}
