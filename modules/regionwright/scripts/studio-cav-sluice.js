const WORLD="cabin-in-the-ashen-veil",NS="dicebox-campaign-helper";
const SCENE="CAVEXT02Scene001",REGION="CAVEXT02SLUICE01",SOURCE="Item.g3VYdgc1qkgkHGvn";
const BOX_SCENE="CAVEXT03Scene001",BOX_REGION="CAVEXT03BOXREG01";
const STUDY_SCENE="CAVHG05Scene0001",NOTE_REGION="CAVB3E32BD6B01BD";
const DOOR_SCENE="CAVHG06GreatRoom",DOOR_REGION="CAV06R0000000003";
const LEDGER="cavSluiceCrankInstall",STATE="cavPondBathWaterState";
const HOOK="__CAV_SLUICE_CRANK_GM_SERVICE_v001",BUSY="__CAV_SLUICE_CRANK_BUSY_v001";
const UI="__CAV_SLUICE_STATIC_CLICK_v002";
const IMAGE="worlds/cabin-in-the-ashen-veil/assets/puzzle-closeups/ext02-sluice-gate-approved-crop-v001.png";
export const sluiceInstallDecision=(existing,ownedCrank,chainReady)=>{
 if(existing?.status==="done")return "installed";
 if(existing?.status==="reserved")return "reconcile";
 if(existing?.status&&existing.status!=="done")return "reconcile";
 if(!chainReady)return "blocked";
 return ownedCrank?"ready":"missing-crank";
};
function worldReady(){return game?.ready===true&&game.world?.id===WORLD;}
function isGM(){return worldReady()&&game.user?.isGM===true&&game.users?.activeGM?.id===game.user.id;}
function documents(){
 const scene=game.scenes.get(SCENE),region=scene?.regions.get(REGION);
 const box=game.scenes.get(BOX_SCENE)?.regions.get(BOX_REGION);
 const note=game.scenes.get(STUDY_SCENE)?.regions.get(NOTE_REGION);
 const door=game.scenes.get(DOOR_SCENE)?.regions.get(DOOR_REGION);
 return {scene,region,box,note,door};
}
function originalCrank(actor,box){
 return actor.items.find(i=>i.name==="Sluice Crank"&&i.type==="loot"&&Number(i.system?.quantity)===1&&
  i.getFlag(NS,"cavDonovanCrankSourceUuid")===SOURCE&&
  i.getFlag(NS,"cavDonovanCrankRegionUuid")===box?.uuid);
}
// Shared distance contract: private player prompt and authoritative GM must
// use the same proximity check, with no token motion or world mutation.
export function isSluiceCharacterNearControl({token,scene,region}={}){
 const shape=region?.shapes?.[0]?.toObject?.();
 const gridSize=scene?.grid?.size;
 if(shape?.type!=="rectangle"||![shape.x,shape.y,shape.width,shape.height].every(Number.isFinite)||
   shape.width<=0||shape.height<=0||!Number.isFinite(gridSize)||gridSize<=0||!token||
   ![token.x,token.y,token.width,token.height].every(Number.isFinite))return false;
 const x=token.x+token.width*gridSize/2,y=token.y+token.height*gridSize/2;
 return Math.hypot(x-(shape.x+shape.width/2),y-(shape.y+shape.height/2))<=400;
}
// Water-stage operation is stricter than Crank fitting: character center
// must actually be in the ORIGINAL native Sluice rectangle. This preserves
// the Pond safety check and is identical on player UI and elected GM.
export function isSluiceStageTokenAtControl({token,scene,region}={}){
 if(!isSluiceCharacterNearControl({token,scene,region})||
    typeof region?.testPoint!=="function")return false;
 const x=token.x+token.width*scene.grid.size/2;
 const y=token.y+token.height*scene.grid.size/2;
 return region.testPoint({x,y,elevation:0})===true;
}
function playerAtControl(userId,tokenId,scene,region){
 const user=game.users.get(userId),token=scene?.tokens.get(tokenId),actor=token?.actor;
 if(!user?.active||user.isGM||!token||token.hidden||actor?.type!=="character"||
   !actor.testUserPermission(user,"OWNER")||
   !isSluiceCharacterNearControl({token,scene,region}))return null;
 return {user,actor,token};
}
async function installCrank(req,sender){
 if(!isGM()||req?.version!==1||req?.action!=="install-crank"||
    req.sceneId!==SCENE||req.regionId!==REGION)return "denied";
 const {scene,region,box,note,door}=documents();
 if(!region||!box||!note||!door||region.ownership.default<2)return "blocked";
 const ctx=playerAtControl(sender,req.tokenId,scene,region);if(!ctx)return "denied";
 const chainReady=door.getFlag(NS,"cavStudyDoorUnlocked")?.status==="done"&&
  note.getFlag(NS,"cavStudy587Learned")?.status==="done"&&
  box.getFlag(NS,"cavDonovan587LockboxClaim")?.status==="done";
 const item=originalCrank(ctx.actor,box);
 const status=sluiceInstallDecision(region.getFlag(NS,LEDGER),!!item,chainReady);
 if(status!=="ready")return status;
 const source=game.items.get("g3VYdgc1qkgkHGvn");
 if(source?.uuid!==SOURCE||source.name!=="Sluice Crank"||source.type!=="loot")return "reconcile";
 const water=region.getFlag(NS,STATE);
 if(water&&!(water.status==="closed"&&water.pond==="full"&&water.bath==="full"))return "reconcile";
 // This is only the player's one-time physical fitting of the crank. NO sluice open/drain happens here.
 await region.setFlag(NS,LEDGER,{status:"reserved",version:1,actorId:ctx.actor.id,tokenId:ctx.token.id,
  sourceUuid:SOURCE,actorItemId:item.id,boxRegionUuid:box.uuid});
 await ctx.actor.deleteEmbeddedDocuments("Item",[item.id]);
 await region.setFlag(NS,LEDGER,{status:"done",version:1,actorId:ctx.actor.id,tokenId:ctx.token.id,
  sourceUuid:SOURCE,consumedActorItemId:item.id,boxRegionUuid:box.uuid});
 if(!water)await region.setFlag(NS,STATE,{version:1,status:"closed",pond:"full",bath:"full",stage:"initial",source:"cav-sluice-crank-install"});
 try{await ChatMessage.create({speaker:{alias:"The Sluice Gate"},
  content:"<p>You seat the iron crank in the weathered sluice socket. The mechanism can now be operated.</p>",whisper:[ctx.user.id]});}
 catch(e){console.warn("[CAV Sluice] installed; feedback unavailable",e);}
 return "installed";
}
export function installCabinSluiceCrankGMService(){
 if(typeof game==="undefined"||typeof Hooks==="undefined"||game.world?.id!==WORLD)return false;
 if(globalThis[HOOK]?.hookId)return true;
 const handler=async(message,opts,sender)=>{
  if(!isGM())return;
  const request=message?.getFlag?.(NS,"cavSluiceInstallRequest");
  if(!request)return;
  const author=message.user;
  if(!author||author.id!==sender||author.isGM||!author.active)return;
  if(globalThis[BUSY])return;
  globalThis[BUSY]=true;
  let result;
  try{result=await installCrank(request,sender);}
  catch(e){console.error("[CAV Sluice] uncertain crank transaction; check reserved ledger",e);result="reconcile";}
  finally{globalThis[BUSY]=false;}
  if(result==="installed")return;
  const messages={denied:"You cannot work the machinery from here.",blocked:"The sluice is not ready to accept this crank.",reconcile:"The Gamemaster must reconcile the fitted mechanism.", "missing-crank":"The square socket needs its original iron crank."};
  try{await ChatMessage.create({speaker:{alias:"The Sluice Gate"},
    content:"<p>"+(messages[result]||"The mechanism remains still.")+"</p>",whisper:[sender]});}
  catch(e){console.warn("[CAV Sluice] private feedback unavailable",e);}
 };
 globalThis[HOOK]={hookId:Hooks.on("createChatMessage",handler),version:1,world:WORLD};
 return true;
}
export async function handleCabinSluiceRegionEvent(region,event){
 if(!worldReady()||game.user?.isGM||region?.parent?.id!==SCENE||region.id!==REGION||!canvas?.ready)return;
 const ev=event?.name,prior=globalThis[UI];
 if(ev==="behaviorUnviewed"||ev==="behaviorDeactivated"){
  if(prior?.handler)canvas.stage?.off("pointertap",prior.handler);
  delete globalThis[UI];return;
 }
 if(ev!=="behaviorViewed")return;
 if(prior?.handler)canvas.stage?.off("pointertap",prior.handler);
 const handler=async pointer=>{
  if(!canvas?.ready||canvas.scene?.id!==SCENE||game.user?.isGM||(pointer?.button!==undefined&&pointer.button!==0))return;
  const point=canvas.stage.toLocal(pointer.global);
  if(!region.testPoint({x:point.x,y:point.y,elevation:0}))return;
  if(globalThis[UI+"_busy"])return;
  globalThis[UI+"_busy"]=true;
  try{
   const tokens=canvas.tokens?.controlled?.filter(t=>t.actor?.type==="character"&&t.actor.testUserPermission(game.user,"OWNER"))||[];
   const token=tokens.length===1?tokens[0].document:null;
    // Remote inspection is allowed, but do not offer a control operation unless
    // the selected character passes the SAME proximity rule as the elected GM.
    const withinReach=!!token&&isSluiceCharacterNearControl({token,scene:canvas.scene,region});
       const atStageControls=withinReach&&isSluiceStageTokenAtControl({token,scene:canvas.scene,region});
    const state=region.getFlag(NS,LEDGER);
   const installed=state?.status==="done";
   const box=game.scenes.get(BOX_SCENE)?.regions.get(BOX_REGION);
   const eligible=withinReach&&!!originalCrank(token.actor,box)&&!installed;
   const flood=region.getFlag(NS,STATE);
   const safelyConfigured=region.getFlag(NS,"noDrainActivation")===false&&
    region.getFlag(NS,"cavSluiceInstallController")?.drainEnabled===true;
   const busy=region.getFlag(NS,"cavSluiceStageTransaction")?.status==="reserved";
   const stageAction=installed&&safelyConfigured&&!busy&&atStageControls?
     flood?.status==="closed"?"open":flood?.status==="open"?"close":null:null;
   const DialogV2=foundry.applications.api.DialogV2;
   const description=!withinReach?"Select one of your characters near the sluice control to fit the crank or inspect the mechanism.":
      installed&&!atStageControls?"The crank is fitted. Move your character into the sluice control area before opening or closing the gate.":installed?
     flood?.status==="open"?"The original Crank is fitted. The gate is open; the Pond and Bathhouse pools have drained.":
     "The original Crank is fitted. The gate is closed; the Pond and Bathhouse pools remain full.":
     "The stone sluice has an empty square mounting socket. An iron crank would fit here.";
   const body='<figure style="max-width:650px;margin:auto;text-align:center"><img alt="Close-up of the pond sluice gate from the approved map" src="'+IMAGE+'" style="display:block;max-width:100%;max-height:68vh;margin:auto;border:1px solid #86755b"/><figcaption style="font-style:italic;margin:0.7rem 0">'+description+'</figcaption></figure>';
   await DialogV2.prompt({window:{title:"The Sluice Gate"},content:body,
    ok:{label:eligible?"Install Original Crank":stageAction==="open"?"Open Sluice":stageAction==="close"?"Close Sluice":"Close",callback:async()=>{
     if(!eligible&&!stageAction)return true;
     const gm=game.users.activeGM;if(!gm?.active){ui.notifications?.warn("The Gamemaster is unavailable.");return false;}
     const flag=eligible?{cavSluiceInstallRequest:{version:1,action:"install-crank",sceneId:SCENE,regionId:REGION,tokenId:token.id}}:
      {cavSluiceStageRequest:{version:1,action:stageAction,sceneId:SCENE,regionId:REGION,tokenId:token.id}};
     await ChatMessage.create({content:"<p>You work the iron sluice control.</p>",whisper:[gm.id,game.user.id],flags:{[NS]:flag}});
     return true;
    }},rejectClose:false});
  }catch(e){console.warn("[CAV Sluice] static closeup unavailable",e);}
  finally{globalThis[UI+"_busy"]=false;}
 };
 canvas.stage?.on("pointertap",handler);
 globalThis[UI]={handler};
}

