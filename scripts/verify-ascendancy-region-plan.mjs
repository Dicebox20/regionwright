import { createAscendancyRegionPlan, createAscendancyRegionPlanReceipt } from "./ascendancy-region-plan.mjs";

const plan = createAscendancyRegionPlan();
console.log(JSON.stringify(createAscendancyRegionPlanReceipt(plan), null, 2));
