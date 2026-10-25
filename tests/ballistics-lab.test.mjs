import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  BALLISTIC_PROFILES,
  BALLISTICS_LAB_AIMING_MODES,
  BALLISTICS_LAB_DRAW_STRENGTHS,
  BALLISTICS_LAB_RANGES_YARDS,
  simulateArrowShot,
  simulateArrowToDistance,
  sampleArrowTrajectoryToDistance,
  simulateBallisticsLabShot
} from "../modules/regionwright-hunting-gathering/hunting-engine.js";
import {
  ballisticsLabDiagnosticReport,
  ballisticsLabProjection,
  createBallisticsLabMarkup,
  ensureBallisticsLabCanvas,
  drawBallisticsLabCanvas
} from "../modules/regionwright-hunting-gathering/ballistics-lab.js";

const close = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

test("Ballistics Lab exposes fixed deterministic ranges, draws, aiming modes, and reference profiles", () => {
  assert.deepEqual(BALLISTICS_LAB_RANGES_YARDS, [18,20,25,30,35,40,45,50,55,60,65]);
  assert.deepEqual(BALLISTICS_LAB_DRAW_STRENGTHS, [0.5,0.75,0.9,1]);
  assert.deepEqual(BALLISTICS_LAB_AIMING_MODES, ["traditional","holdover","pin","zero"]);
  assert.equal(BALLISTIC_PROFILES.current.fullDrawSpeedMps, 74.5);
  assert.equal(BALLISTIC_PROFILES.current.kappa, 0.00231);
  assert.equal(BALLISTIC_PROFILES.meyer.arrowMassKg, 0.02062);
  assert.equal(BALLISTIC_PROFILES.warbow.arrowMassKg, 0.085);
  assert.equal(BALLISTIC_PROFILES.warbow.fullDrawSpeedMps, 55.1);
  assert.match(BALLISTIC_PROFILES.warbow.note, /provisional/i);
  assert.match(BALLISTIC_PROFILES.current.note, /diagnostic proxy/i);
});

test("impact-only and sampled trajectory wrappers share one canonical RK4 simulation", () => {
  const options = { distanceYards: 55, speedMps: 61.3, launchElevationRadians: 0.04, launchAzimuthRadians: 0.01, windMph: 0, kappa: 0.00231, sightHeightM: 0.07 };
  const canonical = simulateArrowShot({ ...options, collectSamples: true });
  const impactOnly = simulateArrowToDistance(options);
  const sampled = sampleArrowTrajectoryToDistance(options);
  close(canonical.impact.timeSeconds, impactOnly.timeSeconds);
  close(canonical.impact.xM, impactOnly.xM);
  close(canonical.impact.yM, impactOnly.yM);
  close(canonical.impact.speedMps, impactOnly.speedMps);
  close(canonical.impact.timeSeconds, sampled.impact.timeSeconds);
  close(canonical.impact.xM, sampled.impact.xM);
  close(canonical.impact.yM, sampled.impact.yM);
  assert.ok(sampled.samples.length > 10);
  assert.equal(impactOnly.samples, undefined);
});

test("lab separates raw horizontal fall from automatic-pin point-of-aim error", () => {
  const traditional = simulateBallisticsLabShot({ profileId: "current", distanceYards: 65, drawStrength: 1, aimingMode: "traditional" });
  const pin = simulateBallisticsLabShot({ profileId: "current", distanceYards: 65, drawStrength: 1, aimingMode: "pin" });
  close(traditional.rawHorizontalFallM, 3.427512961221856, 1e-8);
  close(pin.rawHorizontalFallM, traditional.rawHorizontalFallM, 1e-10);
  assert.equal(pin.sightZeroYards, 60);
  assert.equal(traditional.sightZeroYards, null);
  assert.equal(traditional.elevationRadians, 0);
  assert.ok(traditional.pointOfAimErrorM < -3.4);
  assert.ok(pin.pointOfAimErrorM < -0.27 && pin.pointOfAimErrorM > -0.30);
  assert.ok(Math.abs(pin.pointOfAimErrorM) < Math.abs(traditional.pointOfAimErrorM) / 10);
});

test("heavy-warbow reference is slower but carries more launch energy than the Meyer reference", () => {
  const meyer = simulateBallisticsLabShot({ profileId: "meyer", distanceYards: 65, drawStrength: 1, aimingMode: "pin" });
  const warbow = simulateBallisticsLabShot({ profileId: "warbow", distanceYards: 65, drawStrength: 1, aimingMode: "pin" });
  assert.ok(warbow.launchSpeedMps < meyer.launchSpeedMps);
  assert.ok(warbow.flightTimeSeconds > meyer.flightTimeSeconds);
  assert.ok(warbow.rawHorizontalFallM > meyer.rawHorizontalFallM);
  assert.ok(warbow.launchKineticEnergyJ > 128 && warbow.launchKineticEnergyJ < 130);
  assert.ok(meyer.launchKineticEnergyJ > 56 && meyer.launchKineticEnergyJ < 58);
  assert.ok(warbow.impactKineticEnergyJ > meyer.impactKineticEnergyJ);
});

test("trained holdover solves the actual shot to point of aim at every calibration range", () => {
  const expectedAngles = new Map([[20,1.1719104524],[35,1.8293066405],[50,2.5772796006],[65,3.3791895594]]);
  for (const distanceYards of [20,35,50,65]) {
    const shot = simulateBallisticsLabShot({ profileId: "current", distanceYards, drawStrength: 1, aimingMode: "holdover" });
    assert.equal(shot.sightZeroYards, null);
    assert.equal(shot.holdoverRangeYards, distanceYards);
    assert.ok(Math.abs(shot.pointOfAimErrorM) < 1e-8);
    close(shot.elevationDegrees, expectedAngles.get(distanceYards), 1e-8);
  }
});

test("trained holdover compensates for partial draw using actual launch speed", () => {
  const full = simulateBallisticsLabShot({ profileId: "current", distanceYards: 65, drawStrength: 1, aimingMode: "holdover" });
  const partial = simulateBallisticsLabShot({ profileId: "current", distanceYards: 65, drawStrength: 0.75, aimingMode: "holdover" });
  assert.ok(Math.abs(full.pointOfAimErrorM) < 1e-8);
  assert.ok(Math.abs(partial.pointOfAimErrorM) < 1e-8);
  assert.ok(partial.elevationDegrees > full.elevationDegrees);
  assert.ok(partial.flightTimeSeconds > full.flightTimeSeconds);
  assert.equal(partial.holdoverRangeYards, 65);
});

test("trained holdover diagnostics identify compensation without claiming a mechanical sight zero", () => {
  const shot = simulateBallisticsLabShot({ profileId: "current", distanceYards: 65, drawStrength: 1, aimingMode: "holdover" });
  const projection = ballisticsLabProjection(shot, 330);
  const report = ballisticsLabDiagnosticReport(shot, projection);
  assert.match(report, /Aiming: holdover/);
  assert.match(report, /Sight zero: none \(trained holdover at 65 yd\)/);
  assert.ok(Math.abs(projection.pixelOffsetPx) < 1e-6);
});

test("explicit zero is solved at full draw and partial draw falls below the same zero", () => {
  const full = simulateBallisticsLabShot({ profileId: "current", distanceYards: 30, drawStrength: 1, aimingMode: "zero", explicitZeroYards: 30 });
  const partial = simulateBallisticsLabShot({ profileId: "current", distanceYards: 30, drawStrength: 0.75, aimingMode: "zero", explicitZeroYards: 30 });
  assert.equal(full.sightZeroYards, 30);
  assert.ok(Math.abs(full.pointOfAimErrorM) < 1e-8);
  assert.ok(partial.pointOfAimErrorM < -0.2);
  assert.ok(partial.flightTimeSeconds > full.flightTimeSeconds);
});

test("lab projection derives rendered pixel offset from the same physical point-of-aim error", () => {
  const shot = simulateBallisticsLabShot({ profileId: "warbow", distanceYards: 65, drawStrength: 1, aimingMode: "pin" });
  const projection = ballisticsLabProjection(shot, 330);
  assert.ok(projection.viewHeightM >= 1.5);
  close(projection.pixelsPerMeter, 330 / projection.viewHeightM, 1e-12);
  close(projection.pixelOffsetPx, -shot.pointOfAimErrorM * projection.pixelsPerMeter, 1e-10);
  assert.ok(projection.pixelOffsetPx > 0);
  assert.ok(projection.impactYPercent > 50);
  assert.ok(projection.points.includes(","));
  assert.ok(projection.deerTopYPercent < projection.deerBottomYPercent);
});

test("lab markup and copied report expose the calibration facts needed for playtesting", () => {
  const markup = createBallisticsLabMarkup();
  assert.match(markup, /data-rw-ballistics="profile"/);
  assert.match(markup, /Horizontal reference/);
  assert.match(markup, /Trained holdover/);
  assert.match(markup, /Automatic pin sight/);
  assert.match(markup, /Explicit fixed zero/);
  assert.match(markup, /Raw horizontal fall/);
  assert.match(markup, /Point-of-aim error/);
  assert.match(markup, /Copy Diagnostic Report/);
  const shot = simulateBallisticsLabShot({ profileId: "current", distanceYards: 65, drawStrength: 1, aimingMode: "pin" });
  const projection = ballisticsLabProjection(shot, 330);
  const report = ballisticsLabDiagnosticReport(shot, projection);
  assert.match(report, /Regionwright Ballistics Lab v0\.3\.20/);
  assert.match(report, /Raw horizontal fall:/);
  assert.match(report, /Point-of-aim error:/);
  assert.match(report, /Rendered impact offset:/);
  assert.match(report, /Profile note:/);
});

test("Ballistics Lab is active-GM gated and integrated into the H&G module API", async () => {
  const labSource = await readFile(new URL("../modules/regionwright-hunting-gathering/ballistics-lab.js", import.meta.url), "utf8");
  const moduleSource = await readFile(new URL("../modules/regionwright-hunting-gathering/module.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../modules/regionwright-hunting-gathering/styles/hunting-gathering.css", import.meta.url), "utf8");
  assert.match(labSource, /Only the active GM can open Regionwright Ballistics Lab/);
  assert.match(moduleSource, /data-rw-hg-action="hunting-ballistics"/);
  assert.match(moduleSource, /ballisticsLab: openBallisticsLab/);
  assert.match(css, /\.rw-ballistics-plot/);
  assert.match(css, /\.rw-ballistics-diagnostics/);
});










test("Ballistics Lab canvas renderer creates and reuses a recoverable canvas", () => {
  class FakeCanvas {
    constructor(ownerDocument) { this.ownerDocument=ownerDocument; this.attributes=new Map(); this.dataset={}; this.style={}; this.className=""; this.width=720; this.height=330; }
    setAttribute(name,value){ this.attributes.set(name,String(value)); }
    getContext(){ return null; }
  }
  class FakeMount {
    constructor(ownerDocument){ this.ownerDocument=ownerDocument; this.children=[]; this.rect={width:719,height:330}; }
    append(node){ this.children.push(node); }
    querySelector(selector){ return selector==='[data-rw-ballistics-canvas]' ? (this.children.find(c=>c.attributes?.has('data-rw-ballistics-canvas')) ?? null) : null; }
    getBoundingClientRect(){ return this.rect; }
  }
  class FakeDocument { createElement(tag){ assert.equal(tag,'canvas'); return new FakeCanvas(this); } }
  const doc=new FakeDocument(); const mount=new FakeMount(doc);
  const root={ querySelector: selector => selector==='[data-rw-ballistics-plot-mount]' ? mount : mount.querySelector(selector) };
  const first=ensureBallisticsLabCanvas(root); const second=ensureBallisticsLabCanvas(root);
  assert.ok(first); assert.equal(first,second); assert.equal(mount.children.length,1);
  assert.equal(first.className,'rw-ballistics-plot');
  assert.equal(first.attributes.get('data-rw-ballistics-canvas'),'');
  assert.equal(first.attributes.get('width'),'720');
  assert.equal(first.attributes.get('height'),'330');
});

test("Ballistics Lab canvas renderer draws every calibration element from projection data", () => {
  const ops=[];
  const ctx={
    strokeStyle:null, fillStyle:null, lineWidth:0,
    setTransform:(...a)=>ops.push(['setTransform',...a]), clearRect:(...a)=>ops.push(['clearRect',...a]),
    beginPath:()=>ops.push(['beginPath']), setLineDash:a=>ops.push(['dash',...a]), moveTo:(...a)=>ops.push(['moveTo',...a]),
    lineTo:(...a)=>ops.push(['lineTo',...a]), stroke:()=>ops.push(['stroke']), arc:(...a)=>ops.push(['arc',...a]), fill:()=>ops.push(['fill'])
  };
  const canvas={ width:720,height:330,style:{},dataset:{},getContext:()=>ctx };
  const mount={ getBoundingClientRect:()=>({width:720,height:330}), querySelector:sel=>sel==='[data-rw-ballistics-canvas]'?canvas:null };
  const root={ querySelector:sel=>sel==='[data-rw-ballistics-plot-mount]'?mount:mount.querySelector(sel) };
  const projection={launchAxisStartYPercent:53,launchAxisEndYPercent:12,deerTopYPercent:30,deerBottomYPercent:70,impactYPercent:64,pointPairs:[[0,53],[25,40],[50,35],[75,42],[98,64]]};
  const oldComputed=globalThis.getComputedStyle; const oldDpr=globalThis.devicePixelRatio;
  globalThis.getComputedStyle=()=>({getPropertyValue:()=>''}); Object.defineProperty(globalThis,'devicePixelRatio',{value:1,configurable:true});
  try { assert.equal(drawBallisticsLabCanvas(root,projection),true); }
  finally { globalThis.getComputedStyle=oldComputed; Object.defineProperty(globalThis,'devicePixelRatio',{value:oldDpr,configurable:true}); }
  assert.equal(canvas.dataset.rwBallisticsDrawn,'true');
  assert.ok(ops.filter(op=>op[0]==='stroke').length >= 5);
  assert.ok(ops.some(op=>op[0]==='arc'));
  assert.ok(ops.filter(op=>op[0]==='lineTo').length >= 7);
});

test("Ballistics Lab markup ships an HTML canvas and retains the Show/Hide recovery control", async () => {
  const markup=createBallisticsLabMarkup();
  assert.match(markup, /<canvas class="rw-ballistics-plot" data-rw-ballistics-canvas/);
  assert.match(markup, /data-rw-ballistics-action="graph-toggle"/);
  assert.match(markup, /Hide Graph/);
  assert.doesNotMatch(markup, /<svg/);
  const source=await readFile(new URL('../modules/regionwright-hunting-gathering/ballistics-lab.js',import.meta.url),'utf8');
  assert.match(source, /documentRef\.createElement\("canvas"\)/);
  assert.match(source, /drawBallisticsLabCanvas\(root, projection\)/);
  assert.match(source, /if \(visible\) ensureBallisticsLabCanvas\(root\)/);
});
