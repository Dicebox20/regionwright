// Chat B Turn 16. Original gazebo: two once-only native executeScript behaviors.
// Self-contained scripts; elected-GM token-in-Region + separate explicit confirmation.
// No shared Studio module registry edits or player-supplied proof/flags are trusted.
// Visual source is EXACT historical original eye Item art; map remains unchanged.
export const GAZEBO_SCENE="CAVEXT05Scene001";
export const GAZEBO_LANTERN_REGION="CAVEXT05LANTERN1";
export const GAZEBO_EYE_REGION="CAVEXT05EYE2MARK";
export const GAZEBO_EYE_TILE="CAVEXT05EYE2TILE";
export const GAZEBO_IGNITION_BEHAVIOR="CAVLANTERNIGNIT1";
export const GAZEBO_EYE_BEHAVIOR="CAVEXT05EYE2BEH1";
export const GAZEBO_EYE_SOURCE="Item.QIH1ugEWGOO1U6LN";
export const GAZEBO_OIL_SOURCE="Item.CAVLAMPOIL000001";
export const GAZEBO_WICK_SOURCE="Item.o0g8PyGRIbdwVM3m";
export const GAZEBO_APPROVED_MAP="Maps/cabin-in-the-ashen-veil/ext-05_forgotten-gazebo_owner-approved.png";
export const GAZEBO_MARKER_RECT=Object.freeze({x:690,y:390,width:150,height:145});
export const GAZEBO_EYE_VISUAL=Object.freeze({x:735,y:427,width:60,height:60});
// Logic stays disabled by authenticated prior movement+source+one-writer receipt.
// An actual user must deliberately ask the GM to perform each action.
const common=String.raw`
const NS="dicebox-campaign-helper";
if(game?.world?.id!=="cabin-in-the-ashen-veil"||game.version!=="14.367"||
 !game?.ready||!game.user?.isGM||game.users?.activeGM?.id!==game.user.id||
 scene?.id!=="CAVEXT05Scene001"||region?.id!==__REGION__||
 !["tokenMoveIn","tokenMoveWithin"].includes(event?.name))return;
const lantern=scene.regions.get("CAVEXT05LANTERN1");
const marker=scene.regions.get("CAVEXT05EYE2MARK");
const tile=scene.tiles.get("CAVEXT05EYE2TILE");
const original=game.items.get("QIH1ugEWGOO1U6LN");
if(!lantern||!marker||!tile||!original||
 original.uuid!=="Item.QIH1ugEWGOO1U6LN"||
 original.type!=="loot"||
 !original.name.includes("Second Glass Eye")||
 original.getFlag(NS,"cabinPuzzleItem")?.status!=="GM_LIBRARY_ONLY"||
 tile.texture.src!==original.img)return;
const obj=event?.data?.token?.document??event?.data?.token;
const t=scene.tokens.get(obj?.id??event?.data?.tokenId);
if(!t||t.hidden||!t.actor||t.actor.type!=="character")return;
const actor=t.actor;
const owners=game.users.contents.filter(u=>u.active&&!u.isGM&&actor.testUserPermission(u,"OWNER"));
const sender=event.userId??event.data?.userId??null;
const owner=sender?owners.find(u=>u.id===sender):(owners.length===1?owners[0]:null);
if(!owner)return;
const center={x:t.x+t.width*scene.grid.size/2,y:t.y+t.height*scene.grid.size/2,elevation:0};
if(!region.testPoint(center))return;
const key="__CAV_B_16_"+region.id;
if(globalThis[key])return;
globalThis[key]=true;
const status=(r,k)=>r.getFlag(NS,k)?.status??"none";
const dup=()=>game.actors.contents.some(a=>a.items.some(i=>
 i.getFlag(NS,"cavLateGazeboEye2SourceUuid")==="Item.QIH1ugEWGOO1U6LN"||
 i.name===original.name));
const confirm=async prompt=>await foundry.applications.api.DialogV2.confirm({
 window:{title:"The Forgotten Gazebo"},
 content:"<p>"+prompt+"</p><p>Only approve if the player has explicitly requested this action.</p>",
 yes:{label:"Confirm player action"},no:{label:"Cancel",callback:()=>false},rejectClose:false});
try{
 if(__TYPE__==="ignite"){
   const oil=lantern.getFlag(NS,"cavLateGazeboOil");
   const wick=lantern.getFlag(NS,"cavLateGazeboWick");
   if(oil?.status!=="done"||wick?.status!=="done"||
     oil.sourceUuid!=="Item.CAVLAMPOIL000001"||
     wick.sourceUuid!=="Item.o0g8PyGRIbdwVM3m"||
     oil.actorId!==actor.id||wick.actorId!==actor.id)return;
   if(status(lantern,"cavLateGazeboIgnition")!=="none"||
      status(marker,"cavLateEyeTwoMarker")!=="hidden"||
      tile.hidden!==true||dup())return;
   if(!await confirm("Light the lantern after correctly installing the original oil and Wick? The cobwebs catch the warm glow, revealing a glass eye to be collected separately."))return;
   await lantern.setFlag(NS,"cavLateGazeboIgnition",{status:"reserved",actorId:actor.id,
     oilUuid:oil.sourceUuid,wickUuid:wick.sourceUuid});
   await marker.setFlag(NS,"cavLateEyeTwoMarker",{status:"reserved",sourceUuid:original.uuid});
   await tile.update({hidden:false});
   if(scene.tiles.get("CAVEXT05EYE2TILE")?.hidden!==false)throw Error("Eye tile reveal uncertain");
   await marker.setFlag(NS,"cavLateEyeTwoMarker",{status:"visible",sourceUuid:original.uuid,
     revealedBy:actor.id});
   await lantern.setFlag(NS,"cavLateGazeboIgnition",{status:"done",actorId:actor.id,
     sourceUuid:original.uuid});
   try{await ChatMessage.create({speaker:{alias:"Forgotten Gazebo"},
      content:"<p>The lantern glows. Its warmth reveals a dark glass eye caught among the cobwebs. The eye can now be recovered from the gazebo.</p>"})}
   catch(e){console.warn("[CAV eye] Reveal committed, chat narration failed",e)}
 }else if(__TYPE__==="claim"){
   const light=lantern.getFlag(NS,"cavLateGazeboIgnition");
   const state=marker.getFlag(NS,"cavLateEyeTwoMarker");
   if(light?.status!=="done"||state?.status!=="visible"||
      status(marker,"cavLateEyeTwoClaim")!=="none"||
      light.actorId!==actor.id||state.sourceUuid!==original.uuid||
      tile.hidden!==false||dup())return;
   if(!await confirm("Pick up the revealed original second glass eye from the gazebo? This is a separate one-time reward."))return;
   await marker.setFlag(NS,"cavLateEyeTwoClaim",{status:"reserved",actorId:actor.id,sourceUuid:original.uuid});
   const data=original.toObject();delete data._id;
   data.flags={...data.flags,[NS]:{...data.flags?.[NS],cavLateGazeboEye2SourceUuid:original.uuid,
      cavLateGazeboEye2OriginRegionUuid:marker.uuid}};
   const created=await actor.createEmbeddedDocuments("Item",[data]);
   const actual=created?.[0]&&actor.items.get(created[0].id);
   if(created?.length!==1||!actual||
     actual.getFlag(NS,"cavLateGazeboEye2SourceUuid")!==original.uuid)
       throw Error("Original eye reward uncertain, reserved ledger stays");
   await marker.setFlag(NS,"cavLateEyeTwoClaim",{status:"done",actorId:actor.id,
     originalSourceUuid:original.uuid,embeddedItemId:actual.id});
   await marker.setFlag(NS,"cavLateEyeTwoMarker",{status:"claimed",sourceUuid:original.uuid,
     claimedBy:actor.id});
   await tile.update({hidden:true});
   try{await ChatMessage.create({speaker:{alias:"Forgotten Gazebo"},whisper:[owner.id],
     content:"<p>You recover Rufus's second glass eye.</p>"})}
   catch(e){console.warn("[CAV eye] Reward committed, whisper failed",e)}
 }
}catch(e){console.error("[CAV eye] Partial native transaction; RECONCILE reserved states, no replay",e)}
finally{globalThis[key]=false;}
`;
export function gazeboNativeBehaviorSource(kind){
 if(!["ignite","claim"].includes(kind))throw Error("unsupported gazebo native stage");
 return common.replace("__REGION__",JSON.stringify(kind==="ignite"?GAZEBO_LANTERN_REGION:GAZEBO_EYE_REGION))
 .replaceAll("__TYPE__",JSON.stringify(kind)).trim();
}