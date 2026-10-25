import { access, cp, mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePointBoardAssetsForModule } from "./point-board-assets.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const definitions = [
  { id: "regionwright", title: "Regionwright: Studio" },
  { id: "regionwright-puzzles-locks", title: "Regionwright: Puzzles & Locks" },
  { id: "regionwright-hunting-gathering", title: "Regionwright: Hunting & Gathering" }
];
const requested = process.argv[2];
const modules = requested ? definitions.filter(module => module.id === requested) : definitions;
if (!modules.length) throw new Error(`Unknown module ID: ${requested}`);

async function assertFile(rootPath, relativePath, moduleId) {
  const resolved = path.resolve(rootPath, relativePath);
  if (!resolved.startsWith(`${rootPath}${path.sep}`)) throw new Error(`${moduleId}: manifest path escapes the module: ${relativePath}`);
  await access(resolved);
}

async function listCodeFiles(folder) {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) files.push(...await listCodeFiles(fullPath));
    else if (/\.(?:m?js)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

async function validateImports(folder, moduleId) {
  for (const file of await listCodeFiles(folder)) {
    const source = await readFile(file, "utf8");
    const imports = source.matchAll(/(?:\bfrom\s*|\bimport\s*\()\s*["']([^"']+)["']/g);
    for (const match of imports) {
      const specifier = match[1].split("?")[0];
      if (!specifier.startsWith(".")) continue;
      const resolved = path.resolve(path.dirname(file), specifier);
      const rel = path.relative(folder, resolved);
      if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error(`${moduleId}: cross-folder import in ${path.relative(folder, file)}: ${match[1]}`);
      try { await access(resolved); }
      catch { throw new Error(`${moduleId}: unresolved import in ${path.relative(folder, file)}: ${match[1]}`); }
    }
  }
}

for (const module of modules) {
  const source = path.join(root, "modules", module.id);
  const output = path.join(root, "dist", "modules", module.id);
  const manifestPath = path.join(source, "module.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.id !== module.id) throw new Error(`${module.id}: folder and manifest IDs do not match.`);
  if (manifest.title !== module.title) throw new Error(`${module.id}: unexpected manifest title: ${manifest.title}`);
  const ownedFiles = [manifest.license, manifest.readme, ...(manifest.esmodules ?? []), ...(manifest.styles ?? []), ...(manifest.languages ?? []).map(language => language.path), ...(manifest.packs ?? []).map(pack => pack.path)].filter(Boolean);
  for (const file of ownedFiles) await assertFile(source, file, module.id);
  const pointBoards = await validatePointBoardAssetsForModule(source);
  await validateImports(source, module.id);
  await rm(output, { recursive: true, force: true });
  await mkdir(path.dirname(output), { recursive: true });
  await cp(source, output, { recursive: true });
  console.log(`${module.id} built at ${path.relative(root, output)}`);
  for (const asset of pointBoards) {
    if (asset.kind === "coded-data") console.log(`${module.id}: ${asset.manifest} -> ${asset.width} × ${asset.height} cells, ${asset.layerCount} layers, ${asset.frameCount} max frames, ${asset.activeCells} active cells, ${asset.bytes} bytes.`);
    else console.log(`${module.id}: ${asset.manifest} -> ${asset.width} × ${asset.height}px, ${asset.frameCount} frames, ${asset.bytes} bytes.`);
  }
  if (!pointBoards.length) console.log(`${module.id}: no point-board assets to validate yet.`);
}
