// CAV Roof Clock: pure fail-closed proof of both original physical clock hands.
// Ledger is authoritative; an Item existing after a RESERVED grant is NOT done.
const HANDS=Object.freeze({
 hour:{uuid:"Item.HVZnNaV2SxNWck6H",name:"Grandfather Clock Hour Hand",
  origin:"Scene.CAVHG06GreatRoom.Region.MrWgTyGg0d0DI53Q",claimField:"sourceUuid",
  sourceFlag:"cavGrandfatherClockRewardSourceUuid",regionFlag:"cavGrandfatherClockRewardRegionUuid"},
 minute:{uuid:"Item.smvovibxtjJ9NW56",name:"Attic Clock Minute Hand",
  origin:"Scene.nyF5EX0JiEu23C3p.Region.UtXhS68vd1czWfTG",claimField:"itemUuid",
  sourceFlag:"cavAtticLootSourceUuid",regionFlag:"cavAtticLootRegionUuid"}
});
const denied=reason=>({ready:false,reason});
const str=x=>typeof x==="string"&&x.length>0;

export function assessCavRoofClockHands({actorId=null,hands=null}={}){
 if(!str(actorId)||!hands||typeof hands!=="object")return denied("original-clock-hand-actor-unverified");
 const verified={};
 for(const key of ["hour","minute"]){
  const t=HANDS[key],e=hands[key];
  if(e?.regionUuid!==t.origin||e?.source?.uuid!==t.uuid||
    e?.source?.name!==t.name||e?.source?.type!=="loot"||Number(e.source.quantity)!==1)
   return denied(key+"-original-source-region-unverified");
  if(e.claim?.status==="reserved")return denied(key+"-original-award-reserved");
  if(e.claim?.status!=="done"||e.claim[t.claimField]!==t.uuid||
     e.claim.actorId!==actorId||!str(e.claim.embeddedItemId))
   return denied(key+"-original-award-not-completed");
  if(!Array.isArray(e.items)||e.items.length!==1)
   return denied(key+"-original-tagged-item-count-invalid");
  const i=e.items[0];
  if(i.id!==e.claim.embeddedItemId||i.actorId!==actorId||
    i.name!==t.name||i.type!=="loot"||Number(i.quantity)!==1||
    i.sourceUuid!==t.uuid||i.originUuid!==t.origin)
   return denied(key+"-original-hand-item-identity-conflict");
  verified[key+"ItemId"]=i.id;
 }
 return{ready:true,reason:"both-original-clock-hand-awards-completed",...verified};
}

/** Live elected GM adapter: only read, never mutate or reconcile grants. */
export function assessCavRoofClockHandsGM(actor){
 const N="dicebox-campaign-helper";
 if(typeof game==="undefined"||!game.ready||game.world?.id!=="cabin-in-the-ashen-veil"||
  !game.user?.isGM||game.users.activeGM?.id!==game.user.id||
  actor?.type!=="character")return denied("not-elected-gm-or-character");
 const hands={};
 for(const key of ["hour","minute"]){
  const t=HANDS[key],ids=t.origin.split("."),region=game.scenes.get(ids[1])?.regions.get(ids[3]);
  const item=game.items.get(t.uuid.slice(5));
  const matches=game.actors.contents.flatMap(a=>a.items.contents.flatMap(i=>{
   const sourceUuid=i.getFlag(N,t.sourceFlag),origin=i.getFlag(N,t.regionFlag);
   if(sourceUuid!==t.uuid&&origin!==t.origin)return[];
   return[{actorId:a.id,id:i.id,name:i.name,type:i.type,quantity:i.system?.quantity,
    sourceUuid,originUuid:origin}];
  }));
  hands[key]={regionUuid:region?.uuid,claim:region?.getFlag(N,key==="hour"?"cavGrandfatherClockHourHandClaim":"cavAtticMinuteHandClaim"),
   source:item&&{uuid:item.uuid,name:item.name,type:item.type,quantity:item.system?.quantity},
   items:matches};
 }
 return assessCavRoofClockHands({actorId:actor.id,hands});
}
