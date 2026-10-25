/** Iggwilv's Tower — Validate behavior installation (read-only). */

if (!game.user.isGM) throw new Error("Run this macro as a GM.");
const allRegions = game.scenes.contents.flatMap(scene => Array.from(scene.regions ?? []));
const byKey = new Map(allRegions.map(region => [region.flags?.regionwright?.iggwilvTower?.regionKey, region]).filter(([key]) => key));
const rows = [];
const errors = [];

function owned(region, role) {
  return Array.from(region?.behaviors ?? []).filter(behavior => behavior.flags?.regionwright?.iggwilvTowerBehavior?.role === role);
}

function rect(region) {
  const shape = region?.shapes?.[0];
  return shape ? { x: Number(shape.x), y: Number(shape.y), width: Number(shape.width), height: Number(shape.height) } : null;
}

function overlaps(a, b) {
  return Boolean(a && b && a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y);
}

for (let index = 1; index <= 20; index += 1) {
  const number = String(index).padStart(2, "0");
  const source = byKey.get(`T${number}`);
  const destination = byKey.get(`A${number}`);
  const teleports = owned(source, "teleport");
  const destinations = Array.from(teleports[0]?.system?.destinations ?? []);
  const actual = destinations[0] ?? null;
  const ok = Boolean(source && destination && teleports.length === 1 && actual === destination.uuid);
  rows.push({ key: `T${number}`, role: "teleport", count: teleports.length, target: `A${number}`, ok });
  if (!ok) errors.push(`T${number} teleport is missing, duplicated, or points somewhere other than A${number}.`);
}

for (let index = 1; index <= 20; index += 1) {
  const key = `A${String(index).padStart(2, "0")}`;
  const arrival = byKey.get(key);
  const collision = Array.from(arrival?.parent?.regions ?? []).some(candidate => candidate.flags?.regionwright?.iggwilvTower?.kind === "travel" && overlaps(rect(arrival), rect(candidate)));
  if (collision) errors.push(`${key} overlaps a travel trigger and can cause teleport bounce-back.`);
}

const interactionKeys = [
  ...Array.from({ length: 12 }, (_, i) => `G${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 15 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`), "E01", "T11"
];
for (const key of interactionKeys) {
  const controllers = owned(byKey.get(key), "controller");
  const ok = controllers.length === 1 && controllers[0].type === "executeScript";
  rows.push({ key, role: "controller", count: controllers.length, target: "IGG | Runtime Controller", ok });
  if (!ok) errors.push(`${key} does not have exactly one owned controller behavior.`);
}

for (let index = 1; index <= 20; index += 1) {
  const key = `A${String(index).padStart(2, "0")}`;
  const count = Array.from(byKey.get(key)?.behaviors ?? []).length;
  rows.push({ key, role: "arrival-anchor", count, target: "none", ok: count === 0 });
  if (count) errors.push(`${key} must remain behavior-free to prevent teleport loops.`);
}

const p06 = byKey.get("P06");
const t11 = byKey.get("T11");
if (!p06?.flags?.regionwright?.ingredientMixing) errors.push("P06 Ingredient Mixing configuration is missing.");
if (!t11?.flags?.regionwright?.spineMosaic) errors.push("T11 Spine Mosaic configuration is missing.");
if (Array.from(p06?.behaviors ?? []).some(entry => entry.flags?.regionwright?.ingredientMixing?.region)) errors.push("P06 still has Regionwright's unconditional auto-open behavior.");
if (Array.from(t11?.behaviors ?? []).some(entry => entry.flags?.regionwright?.spineMosaic?.region)) errors.push("T11 still has Regionwright's unconditional auto-open behavior.");

console.table(rows);
if (errors.length) {
  console.error("Iggwilv behavior validation errors", errors);
  ui.notifications.error(`Iggwilv validation failed: ${errors.length} issue(s). See console.`);
} else ui.notifications.info("Iggwilv behavior validation passed: all routes and interaction triggers are installed.");
