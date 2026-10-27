// Cabinet Study Door: pure fail-closed proof of the original Sune Brass Key award.
// No world writes, retries, teleport, Item grants, or automatic reconciliation.
const ORIGINAL_KEY="Item.CAVSTUDYBRASS001";
const ORIGINAL_GROVE="Scene.CAVSG05Scene0001.Region.L15BdSqcbCOLPnIN";
const STUDY_DEST="Scene.CAVHG05Scene0001.Region.CAVB9AA3D7BE9560";
const PORTAL_ID="CAVHG06STUDYT001";
const failed=reason=>({ready:false,reason});
export function assessCavStudyDoorUnlock({
 actorId=null,tokenId=null,source=null,goldClaim=null,keyClaim=null,
 keys=[],doorLedger=null,portal=null,landingExists=false
}={}){
 if(doorLedger!==null&&doorLedger!==undefined)return failed("study-door-ledger-needs-reconciliation");
 if(!actorId||!tokenId)return failed("selected-character-not-verified");
 if(source?.uuid!==ORIGINAL_KEY||source?.name!=="Brass Key"||source?.type!=="loot"||
    Number(source?.quantity)!==1)return failed("original-source-key-unverified");
 if(goldClaim?.status!=="done")return failed("original-sune-gold-not-complete");
 if(keyClaim?.status!=="done")return failed("original-brass-key-award-not-complete");
 if(keyClaim.sourceUuid!==ORIGINAL_KEY||keyClaim.actorId!==actorId||
    typeof keyClaim.embeddedItemId!=="string"||!keyClaim.embeddedItemId)
  return failed("key-award-identity-conflict");
 if(!Array.isArray(keys)||keys.length!==1)return failed("key-item-count-uncertain");
 const key=keys[0];
 if(key?.actorId!==actorId||key?.id!==keyClaim.embeddedItemId||
    key?.name!=="Brass Key"||key?.type!=="loot"||Number(key?.quantity)!==1||
    key?.sourceUuid!==ORIGINAL_KEY||key?.sourceRegionUuid!==ORIGINAL_GROVE||
    key?.reliefSourceUuid!==ORIGINAL_KEY||key?.reliefRegionUuid!==ORIGINAL_GROVE||
    key?.reward!=="key")return failed("original-awarded-key-provenance-conflict");
 if(!landingExists)return failed("original-study-landing-not-found");
 if(portal?.id!==PORTAL_ID||portal?.type!=="teleportToken"||portal?.disabled!==true||
    !Array.isArray(portal?.destinations)||portal.destinations.length!==1||
    portal.destinations[0]!==STUDY_DEST)return failed("study-portal-is-not-locked-to-original-landing");
 return {ready:true,reason:"original-award-and-locked-study-portal-verified"};
}
