// Cabin Ashen Veil: pure provenance checks for original drained pickups used downstream.
// Never grants, consumes, transfers, or repairs any Item or native world state.
const OPTIONS=Object.freeze({
 weather:{source:"Item.CAVWEATHERKEY001",name:"Weathered Key",
  origin:"Scene.CAVEXT02Scene001.Region.CAVPONDWEATHER01",marker:"cavWeatheredKeySourceUuid"},
 screwdriver:{source:"Item.CAVBATHSCREW0001",name:"Screwdriver",
  origin:"Scene.8yLMRDvxyw58dydh.Region.CAVBATHSCRDRY001",marker:"cavBathScrewdriverSourceUuid"}
});
const deny=reason=>({ready:false,reason});
const text=v=>typeof v==="string"&&v.length>0;

/**
 * Validate original GM pickup claim and the exact embedded Item currently held
 * by the same authentic claiming Actor. A reserved award is always uncertain,
 * even if the Item was created. No transfer/replay is assumed safe automatically.
 */
export function assessCavSuccessorPickup({
 kind=null,source=null,regionUuid=null,claim=null,actorId=null,items=[]
}={}){
 const c=OPTIONS[kind];
 if(!c)return deny("unknown-original-pickup");
 if(source?.uuid!==c.source||source.name!==c.name||source.type!=="loot"||
   Number(source.quantity)!==1||regionUuid!==c.origin)
  return deny("original-pickup-source-unverified");
 if(!Array.isArray(items))return deny("original-inventory-evidence-missing");
 const tagged=items.filter(i=>i?.sourceUuid===c.source||i?.markerUuid===c.source);
 if(tagged.length>1)return deny("duplicate-original-pickup-items");
 if(claim?.status==="reserved")return deny("original-pickup-award-reserved");
 if(claim?.status!=="done")return deny("original-pickup-not-awarded");
 if(claim.sourceUuid!==c.source||!text(claim.actorId)||!text(claim.embeddedItemId))
  return deny("original-pickup-claim-provenance-conflict");
 if(tagged.length!==1)return deny("original-pickup-item-missing");
 const i=tagged[0];
 if(!text(actorId)||claim.actorId!==actorId||i.actorId!==actorId||
  i.id!==claim.embeddedItemId||i.name!==c.name||i.type!=="loot"||Number(i.quantity)!==1||
  i.sourceUuid!==c.source||i.originUuid!==c.origin||i.markerUuid!==c.source)
  return deny("original-pickup-item-identity-conflict");
 return{ready:true,reason:"original-once-only-pickup-receipt-verified",itemId:i.id};
}

/** Nightstand reward follows a real completed Screwdriver pickup AND repair.
 * This proof needs no Item to remain in inventory once the repair was committed.
 */
export function assessCavNightstandRepairProof({repair=null,screwdriverClaim=null}={}){
 if(repair?.status!=="done"||repair.toolSourceUuid!==OPTIONS.screwdriver.source||
  !text(repair.actorId)||screwdriverClaim?.status!=="done"||
  screwdriverClaim.sourceUuid!==OPTIONS.screwdriver.source||
  !text(screwdriverClaim.embeddedItemId)||repair.actorId!==screwdriverClaim.actorId)
  return deny("original-screwdriver-repair-receipts-incomplete");
 return{ready:true,reason:"original-screwdriver-and-repair-completed"};
}
