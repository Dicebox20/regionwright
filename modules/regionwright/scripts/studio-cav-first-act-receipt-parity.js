import {createHash} from "node:crypto";

export const ORIGINAL_VANITY_SHA="8be78e1904677af764b63989db85749833895fa32aa0610a7863974e2d26c182";
export const ORIGINAL_HOUR_SHA="7acc56464e73dbf26527d6883154e05f928400c7b983bd646e92fe97dacd3786";
export const sourceSha=s=>createHash("sha256").update(s.trim()).digest("hex");

function strictReplace(original,expectedSha,before,after){
 if(typeof original!=="string"||sourceSha(original)!==expectedSha)
  throw Error("Original source SHA does not match live installed native Behavior. Stop without writing.");
 const index=original.indexOf(before);
 if(index<0||original.indexOf(before,index+before.length)>=0)throw Error("Missing or ambiguous unique proof anchor");
 const next=original.slice(0,index)+after+original.slice(index+before.length);
 if(next===original)throw Error("Unchanged native script");
 return next;
}
const VANITY_FROM=[
"const hasMirror=actor.items.contents.some(i=>i.getFlag?.(SCOPE,'cavPickupSourceUuid')===MIRROR &&",
"  i.getFlag?.(SCOPE,'cavPickupRegionUuid')==='Scene.CAVEXT02Scene001.Region.CAVROWBOATREG001');"
].join("\n");
const VANITY_TO=[
"// Mirror pickup is authentic only after the original Rowboat transaction commits DONE.",
"const mirrorRegion=game.scenes.get('CAVEXT02Scene001')?.regions.get('CAVROWBOATREG001');",
"const mirrorClaim=mirrorRegion?.getFlag(SCOPE,'cavPondMirrorPickup');",
"const hasMirror=mirrorRegion?.uuid==='Scene.CAVEXT02Scene001.Region.CAVROWBOATREG001'&&",
" mirrorClaim?.status==='done'&&mirrorClaim.actorId===actor.id&&mirrorClaim.sourceUuid===MIRROR&&",
" typeof mirrorClaim.itemId==='string'&&",
" actor.items.contents.filter(i=>i.id===mirrorClaim.itemId&&i.name==='Ornate Mirror'&&",
"  i.getFlag?.(SCOPE,'cavPickupSourceUuid')===MIRROR&&",
"  i.getFlag?.(SCOPE,'cavPickupRegionUuid')===mirrorRegion.uuid).length===1;"
].join("\n");
const HOUR_FROM=[
"const genuine=actor.items.contents.some(i=>i.name==='Brass Tiny Key #1'&&",
" i.getFlag?.(SCOPE,'cavVanityRewardSourceUuid')===KEY&&",
" i.getFlag?.(SCOPE,'cavVanityRewardRegionUuid')===VANITY);"
].join("\n");
const HOUR_TO=[
"// Hour Hand unlock requires the original Vanity paired-key DONE receipt, not merely tags.",
"const vanityRegion=game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVVANITYREG0001');",
"const vanityClaim=vanityRegion?.getFlag(SCOPE,'cavVanityKeysClaim');",
"const genuine=vanityRegion?.uuid===VANITY&&vanityClaim?.status==='done'&&",
" vanityClaim.actorId===actor.id&&vanityClaim.mirrorUuid==='Item.CAVMIRRORSUNK001'&&",
" Array.isArray(vanityClaim.rewardUuids)&&vanityClaim.rewardUuids.length===2&&",
" vanityClaim.rewardUuids[0]===KEY&&vanityClaim.rewardUuids[1]==='Item.CAVCARRIAGEKEY01'&&",
" Array.isArray(vanityClaim.embeddedItemIds)&&vanityClaim.embeddedItemIds.length===2&&",
" vanityClaim.embeddedItemIds[0]!==vanityClaim.embeddedItemIds[1]&&",
" actor.items.contents.filter(i=>i.id===vanityClaim.embeddedItemIds[0]&&i.name==='Brass Tiny Key #1'&&",
"  i.getFlag?.(SCOPE,'cavVanityRewardSourceUuid')===KEY&&",
"  i.getFlag?.(SCOPE,'cavVanityRewardRegionUuid')===VANITY).length===1;"
].join("\n");
export const patchCavVanity=source=>strictReplace(source,ORIGINAL_VANITY_SHA,VANITY_FROM,VANITY_TO);
export const patchCavHour=source=>strictReplace(source,ORIGINAL_HOUR_SHA,HOUR_FROM,HOUR_TO);
