// CAV Aqueduct route: read-only authenticity check BEFORE any native teleport/chase commission.
// Validates original consumed Gear + Handle against their original DONE award receipts
// and shares the source Crank -> committed synchronized Pond/Bath drain validator.
import {assessCavNightstandRepairProof} from "./studio-cav-successor-pickup-proof.js";
import {assessCavDrainedPickupWaterReady} from "./studio-cav-drained-pickups.js";
const GEAR="Item.wDKqETOykWEdKF1Z",HANDLE="Item.nRVZJL9JOwEwfnLq";
const refuse=reason=>({ready:false,reason});
const some=x=>typeof x==="string"&&x.length>0;
export function assessCavAqueductCommissioningProof({
 gearLedger=null,handleLedger=null,mechanical=null,roofGearClaim=null,
 nightstandHandleClaim=null,nightstandRepair=null,screwdriverClaim=null,
 crank=null,water=null,transaction=null,pondBackground=null,
 trailPortal=null,dryBathLandingExists=false
}={}){
 if(gearLedger?.status!=="done"||gearLedger.sourceUuid!==GEAR||
  !some(gearLedger.actorId)||!some(gearLedger.consumedActorItemId)||
  roofGearClaim?.status!=="done"||roofGearClaim.sourceUuid!==GEAR||
  roofGearClaim.actorId!==gearLedger.actorId||
  roofGearClaim.embeddedItemId!==gearLedger.consumedActorItemId||
  roofGearClaim.correctTime!=="12:00")
  return refuse("original-roof-gear-consumption-not-reconciled");
 if(handleLedger?.status!=="done"||handleLedger.sourceUuid!==HANDLE||
  !some(handleLedger.actorId)||!some(handleLedger.consumedActorItemId)||
  nightstandHandleClaim?.status!=="done"||nightstandHandleClaim.sourceUuid!==HANDLE||
  nightstandHandleClaim.actorId!==handleLedger.actorId||
  nightstandHandleClaim.embeddedItemId!==handleLedger.consumedActorItemId)
  return refuse("original-nightstand-handle-consumption-not-reconciled");
 if(!assessCavNightstandRepairProof({repair:nightstandRepair,screwdriverClaim}).ready||
  nightstandRepair.actorId!==nightstandHandleClaim.actorId)
  return refuse("original-screwdriver-nightstand-repair-not-reconciled");
 if(mechanical?.status!=="ready"||mechanical.version!==1||
  mechanical.portal!=="CAVPONDAQPORT001"||mechanical.traversalEnabled!==false)
  return refuse("original-aqueduct-mechanical-ready-unverified");
 const drain=assessCavDrainedPickupWaterReady({
  crank,water,transaction,pondBackground,trailPortal,dryBathLandingExists
 });
 if(!drain.ready)return refuse("original-sluice-"+drain.reason);
 return{ready:true,reason:"original-aqueduct-parts-and-drain-reconciled"};
}
