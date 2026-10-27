// Chat B Turn 15: canonical SG-01 owner-map-only, dormant infrastructure.
// Separate from early four-bust Winder Region and SG-05 Memorial Statue.
// Do NOT enable until real first chase, Waterworks restoration, Allen warning,
// Crooked Man actor, and final elected-GM adjudication are available.
export const SG01_MAP="Maps/cabin-in-the-ashen-veil/sg-01_northwest-grove-corner_moon-bust_owner-pass.png";
export const SG01_SCENE="CAVSG01Scene0001";
export const SG01_NW_WINDER="gksvZIqj8jWdqzn7";
export const SG01_MISSING_PREREQS=Object.freeze(["first-chase","waterworks-restored","allen-warning","crooked-man"]);
export const SG01_SILVER_KEY_SOURCE="Item.IY8fuUG5P0yWIZIh";
export const SG01_REGIONS=Object.freeze([
 Object.freeze({kind:"late-chase",id:"CAVSG01CHASETRG1",behavior:"CAVSG01CHASEBEH1",
   title:"SG-01 - Late Crooked Man chase review approach",
   rect:Object.freeze({x:2220,y:950,width:250,height:195})}),
 Object.freeze({kind:"silver-marker",id:"CAVSG01SILVERKEY",behavior:"CAVSG01SILVRBEH1",
   title:"SG-01 - Silver Tiny Key ground recovery marker",
   rect:Object.freeze({x:1950,y:1450,width:190,height:170})})
]);
const makeBody=(kind,region)=>String.raw`
const NS="dicebox-campaign-helper",WORLD="cabin-in-the-ashen-veil";
if(game?.world?.id!==WORLD||game.user?.isGM!==true||
 game.users?.activeGM?.id!==game.user.id||!game.ready||
 region?.parent?.id!=="CAVSG01Scene0001"||
 region.id!==__RID__)return;
const originalNW=game.scenes.get("CAVSG01Scene0001")?.regions.get("gksvZIqj8jWdqzn7");
if(!originalNW||!originalNW.behaviors.get("7nHv3rf66mG8PJJS"))return;
const ownerStage=region.getFlag(NS,__LEDGER__);
if(ownerStage?.status!=="armed-by-elected-gm")return;
const first=game.scenes.get("CAVAQ01Scene0001")?.regions.get("woZ98KXx0RsWIPpl")?.getFlag(NS,"cavFirstAqueductChase");
const earlyDone=["escaped","captured"].includes(first?.status);
if(!earlyDone||ownerStage?.firstChaseReceiptVerified!==true||
 ownerStage?.waterworksRestoreNativeReadbackVerified!==true||
 ownerStage?.allenWarningReadNativeReceiptVerified!==true||
 ownerStage?.crookedManActorAndEncounterVerified!==true)return;
// Dormant source refuses to change campaign state. A future owner's actual
// elected-GM native adjudication module must implement this Region's effect.
return;
`.replace("__RID__",JSON.stringify(region.id))
 .replace("__LEDGER__",JSON.stringify(kind==="late-chase"?"cavLateSecondChaseEligibility":"cavLateSilverRecoverableMarker"));
export function sourceForSG01(kind){
 const r=SG01_REGIONS.find(x=>x.kind===kind);
 if(!r)throw Error("Unsupported SG01 marker");
 return makeBody(kind,r).trim();
}