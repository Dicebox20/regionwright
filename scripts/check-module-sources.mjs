import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validatePointBoardAssetsForModule } from "./point-board-assets.mjs";

const execFileAsync = promisify(execFile);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const definitions = [
  { id: "regionwright", title: "Regionwright: Studio" },
  { id: "regionwright-puzzles-locks", title: "Regionwright: Puzzles & Locks" },
  { id: "regionwright-hunting-gathering", title: "Regionwright: Hunting & Gathering" }
];

async function codeFiles(folder) {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) files.push(...await codeFiles(fullPath));
    else if (/.(?:m?js)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

async function validateImports(folder, id, file) {
  const source = await readFile(file, "utf8");
  const imports = source.matchAll(/(?:\bfrom\s+|\bimport\s*\()\s*["']([^"']+)["']/g);
  for (const match of imports) {
    const specifier = match[1].split("?")[0];
    if (!specifier.startsWith(".")) continue;
    const resolved = path.resolve(path.dirname(file), specifier);
    const relative = path.relative(folder, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(id + ": import escapes its module in " + path.relative(folder, file) + ": " + match[1]);
    }
    try {
      await access(resolved);
    } catch {
      throw new Error(id + ": unresolved import in " + path.relative(folder, file) + ": " + match[1]);
    }
  }
}

for (const definition of definitions) {
  const folder = path.join(root, "modules", definition.id);
  const manifest = JSON.parse(await readFile(path.join(folder, "module.json"), "utf8"));
  if (manifest.id !== definition.id) throw new Error(definition.id + ": folder and manifest IDs differ.");
  if (manifest.title !== definition.title) throw new Error(definition.id + ": unexpected title " + manifest.title);
  const ownedPaths = [
    manifest.license,
    manifest.readme,
    ...(manifest.esmodules ?? []),
    ...(manifest.styles ?? []),
    ...(manifest.languages ?? []).map(language => language.path),
    ...(manifest.packs ?? []).map(pack => pack.path)
  ].filter(Boolean);
  for (const relative of ownedPaths) {
    const resolved = path.resolve(folder, relative);
    const fromFolder = path.relative(folder, resolved);
    if (fromFolder.startsWith("..") || path.isAbsolute(fromFolder)) throw new Error(definition.id + ": manifest path escapes module: " + relative);
    await access(resolved);
  }
  const pointBoards = await validatePointBoardAssetsForModule(folder);
  for (const asset of pointBoards) {
    if (asset.kind === "coded-data") console.log(`${definition.id}: ${asset.manifest} valid (${asset.width} × ${asset.height} cells, ${asset.layerCount} layers, ${asset.frameCount} max frames, ${asset.activeCells} active cells, ${asset.bytes} bytes).`);
    else console.log(`${definition.id}: ${asset.manifest} valid (${asset.width} × ${asset.height}px, ${asset.frameCount} frames, ${asset.bytes} bytes).`);
  }
  if (!pointBoards.length) console.log(`${definition.id}: no point-board assets to validate yet.`);
  const files = await codeFiles(folder);
  for (const file of files) {
    if (path.relative(folder, file).split(path.sep).includes("macros")) {
      try {
        new AsyncFunction(await readFile(file, "utf8"));
      } catch (error) {
        throw new Error(`${definition.id}: invalid Foundry macro ${path.relative(folder, file)}: ${error.message}`, { cause: error });
      }
    } else {
      await execFileAsync(process.execPath, ["--check", file]);
    }
    await validateImports(folder, definition.id, file);
  }
  console.log(definition.id + ": " + files.length + " JavaScript files checked; manifest and local imports valid.");
}

const tools = await codeFiles(path.join(root, "scripts"));
for (const file of tools) await execFileAsync(process.execPath, ["--check", file]);
console.log("Repository scripts: " + tools.length + " JavaScript files parsed.");
