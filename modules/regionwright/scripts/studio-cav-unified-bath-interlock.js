// Cabin in the Ashen Veil — single-map Bathhouse variant contract.
// Never substitute the discarded standalone BATH-03/04 scene plan for these native Regions.
export const UNIFIED_BATH_SHARED_FIXTURE_IDS=Object.freeze([
 "CAVBBOILERVESL01","CAVBBOILERCTRL01","CAVBSIDENORTH001","CAVBSIDESOUTH001"
]);
export const UNIFIED_BATH_ROSEWATER_ID="CAVBROSEWATER001";
const exact=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const record=(scene,id)=>scene?.regions?.find(r=>r.id===id);
const rect=(r)=>r?.shapes?.length===1&&r.shapes[0]?.type==="rectangle"&&r.shapes[0].width>0&&r.shapes[0].height>0;
export function assessUnifiedBathFixtures({filled,drained}={}){
 if(!filled||!drained||filled.id!=="CAVBATHScene0001"||drained.id!=="8yLMRDvxyw58dydh")return{ok:false,reason:"missing-unified-variant"};
 if(filled.width!==drained.width||filled.height!==drained.height||filled.width!==2160||filled.height!==1440)return{ok:false,reason:"unified-geometry-drift"};
 if(record(filled,UNIFIED_BATH_ROSEWATER_ID))return{ok:false,reason:"ring-present-on-filled-map"};
 for(const id of UNIFIED_BATH_SHARED_FIXTURE_IDS){
  const a=record(filled,id),b=record(drained,id);
  if(!a||!b||!rect(a)||!rect(b)||!exact(a.shapes,b.shapes)||a.fixtureKey!==b.fixtureKey||
     !a.fixtureKey||a.phase!=="PASSIVE_GM_REVIEW"&&a.phase!=="COMMISSIONED"||
     b.phase!=="PASSIVE_GM_REVIEW"&&b.phase!=="COMMISSIONED")
    return{ok:false,reason:"unified-fixture-mismatch",fixtureId:id};
 }
 const ring=record(drained,UNIFIED_BATH_ROSEWATER_ID);
 if(!ring||!rect(ring)||ring.fixtureKey!=="rosewater-ring-main-drain"||
    ring.phase!=="PASSIVE_GM_REVIEW"&&ring.phase!=="COMMISSIONED")
    return{ok:false,reason:"drained-ring-missing"};
 if(ring.sessionStatus&&ring.sessionStatus!=="done"&&ring.sessionStatus!=="unsolved"&&ring.sessionStatus!=="ready")
    return{ok:false,reason:"rosewater-session-pending"};
 return{ok:true,reason:"single-map-geometry-verified",sharedFixtureIds:[...UNIFIED_BATH_SHARED_FIXTURE_IDS],drainedOnly:UNIFIED_BATH_ROSEWATER_ID};
}
