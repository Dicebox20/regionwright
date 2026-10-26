import{planCavBoilerAction,CAV_BOILER_SESSION,CAV_BOILER_SCENES,CAV_BOILER_REGION_ID}from"./studio-cav-boiler-state.js";
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil";
const HOOK="__CAV_BOILER_GM_CHAT_SERVICE_V001",BUSY="__CAV_BOILER_GM_REQUEST_BUSY_V001";
const SESSION=CAV_BOILER_SESSION;
const BOILER_NATIVE_BEHAVIOR_ID="CAVBOILERSCRPT01";
const BOILER_NATIVE_DISPATCH='await game.modules.get("regionwright")?.api?.campaign?.cabin?.boiler?.handleRegionEvent(region, event);';
const BOILER_NATIVE_EVENTS=Object.freeze(["behaviorViewed","behaviorUnviewed","behaviorDeactivated"]);
const refs=()=>CAV_BOILER_SCENES.map(s=>game.scenes.get(s)?.regions.get(CAV_BOILER_REGION_ID));
const gm=()=>game?.ready&&game.world?.id===WORLD&&game.user?.isGM&&game.users.activeGM?.id===game.user?.id;
const middle=(t,s)=>({x:t.x+t.width*s.grid.size/2,y:t.y+t.height*s.grid.size/2,elevation:0});
const equivalent=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
function sourceReady(regions){
 const m=game.modules.get("regionwright-puzzles-locks")?.api;
 return !!m?.boilerCampaign&&m.boilerCampaign.createConfig().valves.map(v=>v.target).join(",")==="2,1"&&
 regions.length===2&&regions.every(r=>!!r&&r.getFlag(NS,"cavUnifiedBathPuzzleBinding")?.status==="ENABLED"&&
 r.getFlag(NS,"cavUnifiedBathPuzzleBinding")?.puzzleKind==="boiler-pressure"&&
 r.getFlag(NS,"cavUnifiedBathFixtureKey")==="boiler-controls"&&r.behaviors.contents.length===1&&
 r.behaviors.contents[0].id===BOILER_NATIVE_BEHAVIOR_ID&&
 r.behaviors.contents[0].type==="executeScript"&&r.behaviors.contents[0].disabled===false&&
 r.behaviors.contents[0].system?.source===BOILER_NATIVE_DISPATCH&&
 r.behaviors.contents[0].system?.events?.size===BOILER_NATIVE_EVENTS.length&&
 BOILER_NATIVE_EVENTS.every(evt=>r.behaviors.contents[0].system.events.has(evt)));
}
export function describeCabinBoilerPressureGM(){
 if(!gm())return{status:"not-elected-gm"};
 const regions=refs();return{status:sourceReady(regions)?"ready":"not-commissioned",
  variantStatus:regions.map(r=>({uuid:r?.uuid||null,session:r?.getFlag(NS,SESSION)||null,
   binding:r?.getFlag(NS,"cavUnifiedBathPuzzleBinding")?.status??null,
   behaviorCount:r?.behaviors.size??null})),canon:[2,1]};
}
async function request(req,author,messageId){
 if(!gm()||req?.version!==1||!CAV_BOILER_SCENES.includes(req.sceneId)||req.regionId!==CAV_BOILER_REGION_ID)return"denied";
 const user=game.users.get(author),scene=game.scenes.get(req.sceneId),region=scene?.regions.get(CAV_BOILER_REGION_ID),
 token=scene?.tokens.get(req.tokenId),actor=token?.actor,all=refs();
 if(!user?.active||user.isGM||user.viewedScene!==req.sceneId||!token||token.hidden||
  actor?.type!=="character"||!actor.testUserPermission(user,"OWNER")||
  !region?.testPoint(middle(token,scene))||!sourceReady(all))return"denied";
 const [canonical,mirror]=all;
 const current=canonical.getFlag(NS,SESSION)??null,other=mirror.getFlag(NS,SESSION)??null;
 if(!equivalent(current,other))return"reconcile";
 if(current?.lastMessageId===messageId)return"already-processed";
 const proposal=planCavBoilerAction(current,req);if(proposal.status!=="ready")return proposal.status;
 const pending={version:1,status:"reserved",revision:current?.revision??0,positions:current?.positions??{left:0,right:0},
  lastMessageId:messageId,requesterId:author,actorId:actor.id,operation:req.op,proposed:proposal.next};
 // Write canonical first; a crash/uncertain mirror leaves reserved flag, NEVER a silent replay.
 await canonical.setFlag(NS,SESSION,pending);
 await mirror.setFlag(NS,SESSION,pending);
 const next={...proposal.next,version:1,lastMessageId:messageId,requesterId:author,actorId:actor.id};
 await mirror.setFlag(NS,SESSION,next);
 await canonical.setFlag(NS,SESSION,next);
 if(!equivalent(canonical.getFlag(NS,SESSION),mirror.getFlag(NS,SESSION)))throw Error("Boiler mirror verification failed; manual reconcile required");
 return next.status==="done"?"solved":"updated";
}
export function installCabinBoilerGMService(){
 if(typeof Hooks==="undefined"||game?.world?.id!==WORLD)return false;
 if(globalThis[HOOK]?.hookId)return true;
 const id=Hooks.on("createChatMessage",async(msg,options,author)=>{
  if(!gm())return;
  const req=msg.getFlag(NS,"cavBoilerRequest");
  if(!req)return;
  const user=msg.user;if(!user||user.id!==author||user.isGM||!user.active||globalThis[BUSY])return;
  globalThis[BUSY]=true;
  let result="reconcile";
  try{result=await request(req,author,msg.id);}
  catch(e){console.error("[CAV Boiler] GM transaction uncertain",e);result="reconcile"}
  finally{globalThis[BUSY]=false}
  const map={updated:"A valve clicks into place.",solved:"The boiler pressure balances, and the mechanism settles into a steady hum.",
   incorrect:"The gauges disagree. Adjust the valves and try again.",
   "already-solved":"The boiler pressure is already stable.",
   "stale-or-invalid":"The dials have changed. Reopen the control panel.",
   reconcile:"The boiler mechanism requires Gamemaster reconciliation.",
   denied:"Approach the controls with your own character."};
  try{await ChatMessage.create({speaker:{alias:"Bathhouse Boiler"},whisper:[author],content:"<p>"+(map[result]??"The controls do not respond.")+"</p>"})}
  catch(e){console.warn("[CAV Boiler] feedback failure",e)}
 });
 globalThis[HOOK]={version:1,hookId:id};return true;
}
export async function handleCabinBoilerRegionEvent(region,event){
 if(game?.world?.id!==WORLD||game.user?.isGM||!canvas?.ready||
  region?.id!==CAV_BOILER_REGION_ID||!CAV_BOILER_SCENES.includes(region.parent?.id))return;
 const key="__CAV_BOILER_POINTER_"+region.parent.id,old=globalThis[key];
 if(event?.name==="behaviorUnviewed"||event?.name==="behaviorDeactivated"){
  if(old?.handler)canvas.stage.off("pointertap",old.handler);delete globalThis[key];return;
 }
 if(event?.name!=="behaviorViewed")return;
 if(old?.handler)canvas.stage.off("pointertap",old.handler);
 const handler=async ev=>{
  if(!canvas?.ready||canvas.scene?.id!==region.parent.id||(ev.button!==undefined&&ev.button!==0))return;
  const pos=canvas.stage.toLocal(ev.global);
  if(!region.testPoint({x:pos.x,y:pos.y,elevation:0})||globalThis[key+"_busy"])return;
  const owned=canvas.tokens.controlled.filter(t=>t.actor?.type==="character"&&!t.document.hidden&&t.actor.testUserPermission(game.user,"OWNER"));
  if(owned.length!==1||!region.testPoint(middle(owned[0].document,canvas.scene)))return;
  const binding=region.getFlag(NS,"cavUnifiedBathPuzzleBinding");
  if(binding?.status!=="ENABLED")return;
  const api=game.modules.get("regionwright-puzzles-locks")?.api?.boilerCampaign;
  if(typeof api?.open!=="function")return;
  globalThis[key+"_busy"]=true;
  try{
   await api.open({region,readState:()=>game.scenes.get(CAV_BOILER_SCENES[0])?.regions.get(CAV_BOILER_REGION_ID)?.getFlag(NS,SESSION),
    onAction:async ({op,valve,direction,expectedRevision})=>{
     const user=game.users.activeGM;
     if(!user?.active)return;
     await ChatMessage.create({content:"<p>You operate the boiler valves.</p>",whisper:[user.id,game.user.id],
      flags:{[NS]:{cavBoilerRequest:{version:1,sceneId:region.parent.id,regionId:region.id,
       tokenId:owned[0].document.id,op,valve,direction,expectedRevision}}}});
    }});
  }catch(e){console.error("[CAV Boiler] panel unavailable",e)}finally{globalThis[key+"_busy"]=false}
 };
 canvas.stage.on("pointertap",handler);globalThis[key]={handler};
}
