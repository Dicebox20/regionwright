import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { promisify } from "node:util";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ids = ["regionwright", "regionwright-puzzles-locks", "regionwright-hunting-gathering"];
const requested = process.argv[2];
const modules = requested ? ids.filter(id => id === requested) : ids;
if (!modules.length) throw new Error(`Unknown module ID: ${requested}`);
const packageDirectory = path.join(root, "dist", "packages");
await mkdir(packageDirectory, { recursive: true });

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

for (const id of modules) {
  const folder = path.join(root, "dist", "modules", id);
  const manifest = JSON.parse(await readFile(path.join(folder, "module.json"), "utf8"));
  if (manifest.id !== id) throw new Error(`${id}: build folder does not match manifest ID.`);
  const archive = path.join(packageDirectory, `${id}-v${manifest.version}.zip`);
  await rm(archive, { force: true });
  await execFileAsync("tar.exe", ["-a", "-c", "-f", archive, "-C", folder, "."]);
  const listing = await execFileAsync("tar.exe", ["-tf", archive]);
  const entries = listing.stdout.split(/\r?\n/).filter(Boolean);
  if (!entries.some(entry => entry.replace(/^\.\//, "") === "module.json")) throw new Error(`${id}: ZIP does not contain its root module.json.`);
  const digest = await sha256(archive);
  await writeFile(`${archive}.sha256`, `${digest}  ${path.basename(archive)}\n`, "utf8");
  console.log(`${id} packaged: ${path.relative(root, archive)} (${entries.length} entries, ${Math.round((await stat(archive)).size / 1024)} KiB)`);
}
