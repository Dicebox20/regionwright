import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const [, , worldRootArg, outputArg] = process.argv;
if (!worldRootArg) throw new Error("Usage: node audit-foundry-world.mjs <world-root>");

const worldRoot = path.resolve(worldRootArg);
const classicLevelUrl = pathToFileURL("C:/Program Files/Foundry Virtual Tabletop/resources/app/node_modules/classic-level/index.js").href;
const { ClassicLevel } = await import(classicLevelUrl);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

function canonical(document) {
  const copy = structuredClone(document);
  delete copy._id;
  delete copy._stats;
  delete copy.sort;
  return JSON.stringify(stable(copy));
}

function digest(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function readLevel(location) {
  const db = new ClassicLevel(location, { keyEncoding: "utf8", valueEncoding: "utf8", readOnly: true });
  const records = [];
  await db.open();
  try {
    for await (const [key, value] of db.iterator()) {
      try {
        const document = JSON.parse(value);
        records.push({ key, document, bytes: Buffer.byteLength(value) });
      } catch {
        records.push({ key, document: null, bytes: Buffer.byteLength(value), parseError: true });
      }
    }
  } finally {
    await db.close();
  }
  return records;
}

async function directories(location) {
  try {
    return (await fs.readdir(location, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name);
  } catch {
    return [];
  }
}

const dataRoot = path.join(worldRoot, "data");
const collectionNames = await directories(dataRoot);
const collections = {};
const allDocuments = [];

for (const name of collectionNames) {
  const records = await readLevel(path.join(dataRoot, name));
  collections[name] = records;
  for (const record of records) if (record.document) allDocuments.push({ collection: name, ...record });
}

const fullCorpus = allDocuments.map(entry => JSON.stringify(entry.document)).join("\n");
const collectionReport = {};
const exactDuplicates = [];
const sameNameGroups = [];

for (const [name, records] of Object.entries(collections)) {
  const parsed = records.filter(record => record.document);
  const hashGroups = Map.groupBy(parsed, record => digest(canonical(record.document)));
  for (const [hash, group] of hashGroups) {
    if (group.length < 2) continue;
    exactDuplicates.push({
      collection: name,
      hash,
      documents: group.map(record => ({
        id: record.document._id ?? String(record.key).split("!").at(-1),
        name: record.document.name ?? null,
        type: record.document.type ?? null,
        folder: record.document.folder ?? null,
        bytes: record.bytes,
        externalReferences: Math.max(0, fullCorpus.split(record.document._id ?? "__missing__").length - 2)
      }))
    });
  }

  const byName = Map.groupBy(parsed.filter(record => record.document.name), record => `${record.document.type ?? ""}\u0000${record.document.name.trim().toLocaleLowerCase()}`);
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    sameNameGroups.push({
      collection: name,
      name: group[0].document.name,
      type: group[0].document.type ?? null,
      count: group.length,
      ids: group.map(record => record.document._id ?? String(record.key).split("!").at(-1)),
      exact: new Set(group.map(record => digest(canonical(record.document)))).size === 1
    });
  }

  collectionReport[name] = {
    documents: parsed.length,
    logicalMB: Number((parsed.reduce((sum, record) => sum + record.bytes, 0) / 1048576).toFixed(2)),
    parseErrors: records.filter(record => record.parseError).length,
    topDocuments: parsed.sort((a, b) => b.bytes - a.bytes).slice(0, 10).map(record => ({
      id: record.document._id ?? String(record.key).split("!").at(-1),
      name: record.document.name ?? null,
      type: record.document.type ?? null,
      kb: Number((record.bytes / 1024).toFixed(1)),
      embeddedItems: Array.isArray(record.document.items) ? record.document.items.length : 0,
      embeddedEffects: Array.isArray(record.document.effects) ? record.document.effects.length : 0,
      tokens: Array.isArray(record.document.tokens) ? record.document.tokens.length : 0,
      walls: Array.isArray(record.document.walls) ? record.document.walls.length : 0,
      regions: Array.isArray(record.document.regions) ? record.document.regions.length : 0
    }))
  };
}

const manifest = JSON.parse(await fs.readFile(path.join(worldRoot, "world.json"), "utf8"));
const packReport = [];
for (const pack of manifest.packs ?? []) {
  const location = path.join(worldRoot, pack.path);
  const records = await readLevel(location);
  const parsed = records.filter(record => record.document);
  const names = new Set(parsed.map(record => `${record.document.type ?? ""}\u0000${record.document.name ?? ""}`));
  const worldCollection = pack.type === "Actor" ? collections.actors : pack.type === "JournalEntry" ? collections.journal : pack.type === "RollTable" ? collections.tables : collections.items;
  const overlaps = (worldCollection ?? []).filter(record => record.document && names.has(`${record.document.type ?? ""}\u0000${record.document.name ?? ""}`));
  packReport.push({
    name: pack.name,
    label: pack.label,
    type: pack.type,
    documents: parsed.length,
    logicalMB: Number((parsed.reduce((sum, record) => sum + record.bytes, 0) / 1048576).toFixed(2)),
    worldNameOverlaps: overlaps.length
  });
}

const report = {
  world: { id: manifest.id, title: manifest.title, coreVersion: manifest.coreVersion, systemVersion: manifest.systemVersion },
  collections: collectionReport,
  exactDuplicates,
  sameNameGroups: sameNameGroups.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  packs: packReport.sort((a, b) => b.logicalMB - a.logicalMB),
  totals: {
    worldDocuments: allDocuments.length,
    logicalWorldMB: Number((allDocuments.reduce((sum, entry) => sum + entry.bytes, 0) / 1048576).toFixed(2)),
    exactDuplicateGroups: exactDuplicates.length,
    exactDuplicateDocuments: exactDuplicates.reduce((sum, group) => sum + group.documents.length - 1, 0),
    sameNameGroups: sameNameGroups.length
  }
};

const serialized = JSON.stringify(report, null, 2);
if (outputArg) {
  await fs.mkdir(path.dirname(path.resolve(outputArg)), { recursive: true });
  await fs.writeFile(path.resolve(outputArg), serialized, "utf8");
  process.stdout.write(`Wrote ${path.resolve(outputArg)}\n`);
} else process.stdout.write(serialized);
