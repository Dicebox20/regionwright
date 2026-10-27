import {createHash} from "node:crypto";
export const SHA_OARS_ROWBOAT="55205e21926418bf764081c4f2e21d372d103fec08f834a08cb44bdfdfce71a8";
export const SHA_CARRIAGE="a8b0ffc1037c5d0c65fb812bed1230a0dd22a1d00102c261d0766d9714f00d77";
export const SHA_ATTIC_HATCH="160447535fe8d31d77270c7a2b2971dab18eaa879a415115fa721f1fde739c69";
export const shaCavNative=s=>createHash("sha256").update(s.trim()).digest("hex");
function replaceUnique(src,expected,oldBlock,newBlock,label){
 if(typeof src!=="string"||shaCavNative(src)!==expected)throw Error("Original "+label+" native source differs; STOP");
 const a=src.indexOf(oldBlock);
 if(a<0||src.indexOf(oldBlock,a+oldBlock.length)!==-1)throw Error("Ambiguous "+label+" proof anchor; STOP");
 const next=src.slice(0,a)+newBlock+src.slice(a+oldBlock.length);
 if(next===src)throw Error("No native change for "+label);
 return next;
}
const ROWBOAT_OLD=[
"const ownsOars=actor.items.contents.some(i=>i.getFlag?.(SCOPE,'cavPickupSourceUuid')==='Item.CAVOARSPOND00001' ||",
"  (i.name==='Wooden Oars' && i.getFlag?.(SCOPE,'cavFirstActPickup')==='donovans_shack_freely_available'));"
].join("\n");
const ROWBOAT_NEW=[
"// Accept only the original DONE Oars grant from Donovan's Shack, not tags alone.",
"const oarsRegion=game.scenes.get('CAVEXT01Yard0001')?.regions.get('CAV01R0000000006');",
"const oarsClaim=oarsRegion?.getFlag(SCOPE,'cavOarsPickup');",
"const ownsOars=oarsRegion?.uuid==='Scene.CAVEXT01Yard0001.Region.CAV01R0000000006'&&",
" oarsClaim?.status==='done'&&oarsClaim.actorId===actor.id&&",
" oarsClaim.sourceUuid==='Item.CAVOARSPOND00001'&&typeof oarsClaim.itemId==='string'&&",
" actor.items.contents.filter(i=>i.id===oarsClaim.itemId&&i.name==='Wooden Oars'&&",
"  i.getFlag?.(SCOPE,'cavPickupSourceUuid')===oarsClaim.sourceUuid&&",
"  i.getFlag?.(SCOPE,'cavPickupRegionUuid')===oarsRegion.uuid).length===1;"
].join("\n");
const CARRIAGE_OLD=[
"const keyPresent=actor.items.contents.some(i=>i.getFlag?.(SCOPE,'cavVanityRewardSourceUuid')===ITEM_KEY &&",
"  i.getFlag?.(SCOPE,'cavVanityRewardRegionUuid')===VANITY && i.name==='Carriage Key');"
].join("\n");
const CARRIAGE_NEW=[
"// The Carriage Key is authentic only after the original Vanity TWO-key award commits DONE.",
"const vanityRegion=game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVVANITYREG0001');",
"const vanityClaim=vanityRegion?.getFlag(SCOPE,'cavVanityKeysClaim');",
"const keyPresent=vanityRegion?.uuid===VANITY&&vanityClaim?.status==='done'&&",
" vanityClaim.actorId===actor.id&&vanityClaim.mirrorUuid==='Item.CAVMIRRORSUNK001'&&",
" Array.isArray(vanityClaim.rewardUuids)&&vanityClaim.rewardUuids.length===2&&",
" vanityClaim.rewardUuids[0]==='Item.CAVBRASSKEYVAN01'&&vanityClaim.rewardUuids[1]===ITEM_KEY&&",
" Array.isArray(vanityClaim.embeddedItemIds)&&vanityClaim.embeddedItemIds.length===2&&",
" vanityClaim.embeddedItemIds[0]!==vanityClaim.embeddedItemIds[1]&&",
" actor.items.contents.filter(i=>i.id===vanityClaim.embeddedItemIds[1]&&i.name==='Carriage Key'&&",
"  i.getFlag?.(SCOPE,'cavVanityRewardSourceUuid')===ITEM_KEY&&",
"  i.getFlag?.(SCOPE,'cavVanityRewardRegionUuid')===VANITY).length===1;"
].join("\n");
const HATCH_OLD=[
"const genuine=actor.items.contents.some(i=>i.name==='Ladder Hook'&&",
" i.getFlag?.(SCOPE,'cavCarriageRewardSourceUuid')===HOOK&&",
" i.getFlag?.(SCOPE,'cavCarriageRewardRegionUuid')===SOURCE);"
].join("\n");
const HATCH_NEW=[
"// Lower only on the original Family Carriage DONE Hook receipt and exact Actor Item.",
"const carriageRegion=game.scenes.get('CAVEXT01Yard0001')?.regions.get('CAV01R0000000008');",
"const carriageClaim=carriageRegion?.getFlag(SCOPE,'cavFamilyCarriageHookClaim');",
"const genuine=carriageRegion?.uuid===SOURCE&&carriageClaim?.status==='done'&&",
" carriageClaim.actorId===actor.id&&carriageClaim.sourceUuid===HOOK&&",
" typeof carriageClaim.embeddedItemId==='string'&&",
" actor.items.contents.filter(i=>i.id===carriageClaim.embeddedItemId&&i.name==='Ladder Hook'&&",
"  i.getFlag?.(SCOPE,'cavCarriageRewardSourceUuid')===HOOK&&",
"  i.getFlag?.(SCOPE,'cavCarriageRewardRegionUuid')===SOURCE).length===1;"
].join("\n");
export const patchCavRowboat=s=>replaceUnique(s,SHA_OARS_ROWBOAT,ROWBOAT_OLD.replace(/\n/g,"\r\n"),ROWBOAT_NEW.replace(/\n/g,"\r\n"),"Rowboat Oars");
export const patchCavCarriage=s=>replaceUnique(s,SHA_CARRIAGE,CARRIAGE_OLD,CARRIAGE_NEW,"Carriage Key");
export const patchCavAtticHatch=s=>replaceUnique(s,SHA_ATTIC_HATCH,HATCH_OLD,HATCH_NEW,"Attic Ladder Hook");
