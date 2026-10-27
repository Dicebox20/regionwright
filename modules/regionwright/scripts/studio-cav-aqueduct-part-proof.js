// Cabin Ashen Veil — original Roof Clock Gear / Parents Nightstand Handle proof.
// This is a pure, advisory authorization predicate. No Item or world writes.
import {assessCavNightstandRepairProof} from "./studio-cav-successor-pickup-proof.js";
const PARTS=Object.freeze({
 gear:{uuid:"Item.wDKqETOykWEdKF1Z",name:"Replacement Gear",
  origin:"Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001",marker:"chimney-clock-noon"},
 handle:{uuid:"Item.nRVZJL9JOwEwfnLq",name:"Aqueduct Gate Handle",
  origin:"Scene.CAVHU04Scene0001.Region.CAVPARENTNIGHT01",marker:"repaired-drawer"}
});
const denied=reason=>({ready:false,reason});
const hasText=v=>typeof v==="string"&&v.length>0;

/** A RESERVE-before-create Item is not enough, even when it exists in inventory.
 * Original claimed item may be moved later, but a transfer is a manual
 * reconciliation event, not an automatic identity bypass during gate install.
 */
export function assessCavAqueductPartProof({
 part=null,claim=null,regionUuid=null,source=null,actorId=null,
 items=[],nightstandRepair=null,screwdriverClaim=null
}={}){
 const p=PARTS[part];
 if(!p)return denied("unknown-aqueduct-part");
 if(regionUuid!==p.origin||source?.uuid!==p.uuid||source.name!==p.name||
  source.type!=="loot"||Number(source.quantity)!==1)
  return denied("original-aqueduct-source-unverified");
 if(!Array.isArray(items))return denied("original-aqueduct-inventory-unverified");
 if(items.length>1)return denied("duplicate-original-aqueduct-part");
 if(claim?.status==="reserved")return denied("original-aqueduct-part-award-reserved");
 if(claim?.status!=="done"||claim.sourceUuid!==p.uuid||
   !hasText(claim.actorId)||!hasText(claim.embeddedItemId))
  return denied("original-aqueduct-part-not-awarded");
 if(part==="handle"&&!assessCavNightstandRepairProof({
  repair:nightstandRepair,screwdriverClaim
 }).ready)return denied("original-nightstand-repair-proof-incomplete");
 if(items.length!==1)return denied("original-aqueduct-part-item-missing");
 const i=items[0];
 if(!hasText(actorId)||i.actorId!==actorId||claim.actorId!==actorId||
  i.id!==claim.embeddedItemId||i.type!=="loot"||i.name!==p.name||
  Number(i.quantity)!==1||i.sourceUuid!==p.uuid||i.originUuid!==p.origin||
  i.marker!==p.marker)
  return denied("original-aqueduct-part-provenance-conflict");
 return{ready:true,reason:"original-one-time-aqueduct-part-receipt-verified",itemId:i.id};
}
