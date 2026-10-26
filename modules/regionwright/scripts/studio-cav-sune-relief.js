const WORLD="cabin-in-the-ashen-veil",NS="dicebox-campaign-helper",S="CAVSG05Scene0001",R="L15BdSqcbCOLPnIN";
const BAG="CAVSUNEGPBAG0001",KEY="CAVSTUDYBRASS001",GOLD_FLAG="cavSuneGoldClaim",KEY_FLAG="cavSuneBrassKeyClaim";
const HOOK="__CAV_SUNE_RELIEF_GM_SERVICE_v001",LOCK="__CAV_SUNE_RELIEF_GM_BUSY_v001",SLOT="__CAV_SUNE_RELIEF_POINTER_v001";
const validWorld=()=>game?.ready===true&&game.world?.id===WORLD;
const activeGM=()=>validWorld()&&game.user?.isGM&&game.users.activeGM?.id===game.user.id;
export const suneReliefStage=(b,p,g,k)=>!b?"hidden":p!=="solved"?"puzzle":!g?"gold":!k?"key":"complete";
export const suneReliefSourceIds=Object.freeze({bag:BAG,key:KEY,scene:S,region:R});
function locate(){const scene=game.scenes.get(S);return {scene,region:scene?.regions.get(R)};}
function playerNear(uid,tid){
 const user=game.users.get(uid),ctx=locate();if(!user?.active||user.isGM||!ctx.region)return null;
 const t=ctx.scene.tokens.get(tid),a=t?.actor;
 if(!t||t.hidden||a?.type!=="character"||!a.testUserPermission(user,"OWNER"))return null;
 const pt={x:t.x+t.width*ctx.scene.grid.size/2,y:t.y+t.height*ctx.scene.grid.size/2,elevation:0};
 return ctx.region.testPoint(pt)?{...ctx,token:t,actor:a,user}:null;
}
async function processClaim(req,uid){
 if(!activeGM()||req?.version!==1||!["gold","key"].includes(req.action)||req.sceneId!==S||req.regionId!==R)return "denied";
 const ctx=playerNear(uid,req.tokenId);if(!ctx)return "denied";
 const {region,token,actor,user}=ctx;
 if(region.getFlag(NS,"cavSuneBustSequence")?.status!=="completed"||
   region.getFlag("regionwright","slidingMosaic")?.persistent?.status!=="solved")return "blocked";
 const gold=req.action==="gold",ledger=gold?GOLD_FLAG:KEY_FLAG,id=gold?BAG:KEY;
 if(!gold&&region.getFlag(NS,GOLD_FLAG)?.status!=="done")return "blocked";
 const old=region.getFlag(NS,ledger);if(old?.status==="done")return "already";
 if(old?.status==="reserved")return "reconcile";
 const src=game.items.get(id);
 if(!src||src.uuid!=="Item."+id||src.type!==(gold?"container":"loot")||
    src.name!==(gold?"Sune's Cloth Bag (1,000 gp)":"Brass Key")||
    (gold&&Number(src.system?.currency?.gp)!==1000))return "reconcile";
 for(const a of game.actors)if(a.items.some(i=>i.getFlag(NS,"cavSuneReliefSourceUuid")===src.uuid&&
   i.getFlag(NS,"cavSuneReliefRegionUuid")===region.uuid))return "reconcile";
 await region.setFlag(NS,ledger,{status:"reserved",actorId:actor.id,tokenId:token.id,sourceUuid:src.uuid});
 const item=src.toObject();delete item._id;
 item.flags={...item.flags,[NS]:{...item.flags?.[NS],cavSuneReliefSourceUuid:src.uuid,cavSuneReliefRegionUuid:region.uuid,cavSuneReliefReward:req.action}};
 const created=await actor.createEmbeddedDocuments("Item",[item]);
 if(created.length!==1)throw Error("Ambiguous grant; reserved ledger preserved");
 await region.setFlag(NS,ledger,{status:"done",actorId:actor.id,tokenId:token.id,sourceUuid:src.uuid,embeddedItemId:created[0].id});
 try{await ChatMessage.create({speaker:{alias:"Sune's Memorial"},content:gold?
 "<p>You lift the cloth bag of 1,000 gold pieces. A brass glint catches your eye beneath it.</p>":
 "<p>With the bag removed, you take the hidden Brass Study Key from the recess.</p>",whisper:[user.id]});}
 catch(e){console.warn("[CAV Sune] unique reward granted, whisper failed",e);}
 return "done";
}
export function installCabinSuneReliefService(){
 if(typeof game==="undefined"||typeof Hooks==="undefined"||game.world?.id!==WORLD)return false;
 if(globalThis[HOOK]?.hookId)return true;
 const handler=async(message,opts,authorId)=>{
  if(!activeGM())return;
  const req=message?.getFlag?.(NS,"cavSuneReliefClaim");if(!req)return;
  const user=message.user;if(!user||user.id!==authorId||user.isGM||!user.active)return;
  if(globalThis[LOCK])return;globalThis[LOCK]=true;let status;
  try{status=await processClaim(req,authorId);}
  catch(e){console.error("[CAV Sune] reward outcome uncertain",e);status="reconcile";}
  finally{globalThis[LOCK]=false;}
  if(status!=="done"){
   const responses={blocked:"The hidden treasure is not accessible yet.",already:"That treasure was already claimed.",reconcile:"The Gamemaster must reconcile this reward.",denied:"Approach the memorial with an owned character."};
   try{await ChatMessage.create({speaker:{alias:"Sune's Memorial"},content:"<p>"+(responses[status]||"The recess is still.")+"</p>",whisper:[authorId]});}
   catch(e){console.warn("[CAV Sune] private error message unavailable",e);}
  }
 };
 globalThis[HOOK]={hookId:Hooks.on("createChatMessage",handler),version:1};
 return true;
}
export async function handleCabinSuneReliefRegionEvent(region,event){
 if(!validWorld()||region?.id!==R||region.parent?.id!==S||!canvas?.ready||game.user?.isGM)return;
 const name=event?.name,old=globalThis[SLOT];
 if(name==="behaviorUnviewed"||name==="behaviorDeactivated"){if(old?.handler)canvas.stage?.off("pointertap",old.handler);delete globalThis[SLOT];return;}
 if(name!=="behaviorViewed")return;
 if(old?.handler)canvas.stage?.off("pointertap",old.handler);
 const handler=async e=>{
  if(!canvas?.ready||canvas.scene?.id!==S||game.user?.isGM||(e?.button!==undefined&&e.button!==0))return;
  const pos=canvas.stage.toLocal(e.global);
  if(!region.testPoint({x:pos.x,y:pos.y,elevation:0}))return;
  if(globalThis[SLOT+"_BUSY"])return;globalThis[SLOT+"_BUSY"]=true;
  try{
   const owned=canvas.tokens?.controlled?.filter(t=>t.actor?.type==="character"&&t.actor.testUserPermission(game.user,"OWNER"))||[];
   const token=owned.length===1?owned[0].document:null;
   const pt=token&&{x:token.x+token.width*canvas.scene.grid.size/2,y:token.y+token.height*canvas.scene.grid.size/2,elevation:0};
   const near=!!pt&&region.testPoint(pt),D=foundry.applications.api.DialogV2;
   if(!near){await D.prompt({window:{title:"Sune's Memorial"},content:"<p>Stand by the northern relief with one selected character.</p>",ok:{label:"Close"},rejectClose:false});return;}
   const stage=suneReliefStage(region.getFlag(NS,"cavSuneBustSequence")?.status==="completed",
    region.getFlag("regionwright","slidingMosaic")?.persistent?.status,
    region.getFlag(NS,GOLD_FLAG)?.status==="done",region.getFlag(NS,KEY_FLAG)?.status==="done");
   if(stage==="puzzle"){
    const api=game.modules.get("regionwright-puzzles-locks")?.api?.slidingMosaic;
    if(!api?.open){ui.notifications.warn("Regionwright's sliding puzzle is unavailable.");return;}
    await api.open(region.uuid);return;
   }
   if(stage==="hidden"){await D.prompt({window:{title:"Sune's Memorial"},content:"<p>Petal-shaped stone joints keep the relief tightly shut.</p>",ok:{label:"Close"},rejectClose:false});return;}
   const claim=stage==="gold"?"gold":stage==="key"?"key":null;
   const label=claim==="gold"?"Take Cloth Bag (1,000 gp)":claim==="key"?"Take Brass Study Key":"Close";
   const content=stage==="gold"?"<p>A tied cloth bag of gold rests in the newly opened recess.</p>":
     stage==="key"?"<p>With the bag lifted, a brass key glints from beneath the lining.</p>":
     "<p>The recess is empty. Its treasures have already been recovered.</p>";
   await D.prompt({window:{title:"Sune's Memorial"},content,ok:{label,callback:async()=>{
    if(!claim)return true;
    const gm=game.users.activeGM;if(!gm?.active){ui.notifications.warn("Active GM required.");return false;}
    await ChatMessage.create({content:"<p>You reach into Sune's memorial recess.</p>",whisper:[gm.id,game.user.id],
     flags:{[NS]:{cavSuneReliefClaim:{version:1,action:claim,sceneId:S,regionId:R,tokenId:token.id}}}});
    return true;
   }},rejectClose:false});
  }catch(error){console.error("[CAV Sune] relief interaction failed",error);}
  finally{globalThis[SLOT+"_BUSY"]=false;}
 };
 canvas.stage?.on("pointertap",handler);
 globalThis[SLOT]={handler};
}

