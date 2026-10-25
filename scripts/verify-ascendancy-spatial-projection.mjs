import { createAscendancySpatialProjectionPlan, createAscendancySpatialProjectionReceipt } from "./ascendancy-spatial-projection.mjs";

console.log(JSON.stringify(createAscendancySpatialProjectionReceipt(createAscendancySpatialProjectionPlan()), null, 2));
