import {createHash} from "node:crypto";

export const CAV_ROOF_ORIGINAL_PLAYER_SHA="60136c5c25faf8de4a9931889a0e6efe1468c4790dd088cc77cd9fbaa2d6a55c";
export const CAV_ROOF_REGION="Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001";
export const CAV_ROOF_BEHAVIOR="i6UNtWSFFaZgkdZD";
export const cavRoofScriptHash=s=>createHash("sha256").update(s.trim()).digest("hex");

const expectSingle=(source,needle,label)=>{
 const first=source.indexOf(needle);
 if(first<0||source.indexOf(needle,first+1)!==-1)throw Error("Roof player parity anchor missing/ambiguous: "+label);
 return source;
};

export function patchCavRoofOriginalPlayerScript(original){
 if(typeof original!=="string"||cavRoofScriptHash(original)!==CAV_ROOF_ORIGINAL_PLAYER_SHA)
  throw Error("Original Rooftop player Behavior source SHA mismatch; manual reconcile, no installation");
 const from="  const hasHour=actor?.items.some(i=>i.name==='Grandfather Clock Hour Hand'&&i.getFlag(NS,'cavGrandfatherClockRewardSourceUuid')==='Item.HVZnNaV2SxNWck6H'&&i.getFlag(NS,'cavGrandfatherClockRewardRegionUuid')==='Scene.CAVHG06GreatRoom.Region.MrWgTyGg0d0DI53Q');\n  const hasMinute=actor?.items.some(i=>i.name==='Attic Clock Minute Hand'&&i.getFlag(NS,'cavAtticLootSourceUuid')==='Item.smvovibxtjJ9NW56'&&i.getFlag(NS,'cavAtticLootRegionUuid')==='Scene.nyF5EX0JiEu23C3p.Region.UtXhS68vd1czWfTG');";
 const to=`  // UI-only proof: original DONE claim and exact embedded Actor Item must agree.
  // The elected GM still performs the authoritative global uniqueness checks.
  const hourClaim=game.scenes.get('CAVHG06GreatRoom')?.regions.get('MrWgTyGg0d0DI53Q')?.getFlag(NS,'cavGrandfatherClockHourHandClaim');
  const minuteClaim=game.scenes.get('nyF5EX0JiEu23C3p')?.regions.get('UtXhS68vd1czWfTG')?.getFlag(NS,'cavAtticMinuteHandClaim');
  const hasHour=!!actor&&hourClaim?.status==='done'&&hourClaim.actorId===actor.id&&hourClaim.sourceUuid==='Item.HVZnNaV2SxNWck6H'&&
   actor.items.some(i=>i.id===hourClaim.embeddedItemId&&i.name==='Grandfather Clock Hour Hand'&&
    i.getFlag(NS,'cavGrandfatherClockRewardSourceUuid')==='Item.HVZnNaV2SxNWck6H'&&
    i.getFlag(NS,'cavGrandfatherClockRewardRegionUuid')==='Scene.CAVHG06GreatRoom.Region.MrWgTyGg0d0DI53Q');
  const hasMinute=!!actor&&minuteClaim?.status==='done'&&minuteClaim.actorId===actor.id&&minuteClaim.itemUuid==='Item.smvovibxtjJ9NW56'&&
   actor.items.some(i=>i.id===minuteClaim.embeddedItemId&&i.name==='Attic Clock Minute Hand'&&
    i.getFlag(NS,'cavAtticLootSourceUuid')==='Item.smvovibxtjJ9NW56'&&
    i.getFlag(NS,'cavAtticLootRegionUuid')==='Scene.nyF5EX0JiEu23C3p.Region.UtXhS68vd1czWfTG');
  // Match elected GM's original 400px clock-center reach restriction.
  const rect=region.shapes?.[0],grid=scene.grid?.size;
  const near=!!doc&&!!rect&&Number.isFinite(grid)&&
   Math.hypot(doc.x+doc.width*grid/2-(rect.x+rect.width/2),doc.y+doc.height*grid/2-(rect.y+rect.height/2))<=400;
  const canEngage=hasHour&&hasMinute&&near;`;
 let out=expectSingle(original,from,"original tags").replace(from,to);
 const status="const status=solved?'The clock has already yielded its gear.':!doc?'Select exactly one character token to try the mechanism.':(!hasHour||!hasMinute)?'The mechanism is missing one or both authentic clock hands.':'Both recovered hands can be fitted to the empty hub.';";
 const statusNew="const status=solved?'The clock has already yielded its gear.':!doc?'Select exactly one character token to try the mechanism.':!near?'Move your character closer to the clock to fit the hands.':(!hasHour||!hasMinute)?'One or both recovered clock hands lack a completed original award.':'Both recovered hands can be fitted to the empty hub.';";
 out=expectSingle(out,status,"status").replace(status,statusNew);
 for(const [oldText,newText] of [
  ["(hasHour&&hasMinute&&!solved?","(canEngage&&!solved?"],
  ["ok:{label:hasHour&&hasMinute&&!solved?","ok:{label:canEngage&&!solved?"],
  ["if(!hasHour||!hasMinute||solved||!doc)return true;","if(!canEngage||solved||!doc)return true;"]
 ]){
  out=expectSingle(out,oldText,oldText).replace(oldText,newText);
 }
 if(out===original||!out.includes("const canEngage=hasHour&&hasMinute&&near;"))throw Error("Roof parity patch did not apply");
 return out;
}
