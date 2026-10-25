import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Lawson GM test macro is a fixed puzzle binding", async () => {
  const source = await readFile(new URL("../modules/regionwright/macros/ascendancy-lawson-rune-memory-gm-test.js", import.meta.url), "utf8");
  assert.match(source, /dbx:puzzle:lawson-rune-memory/);
  assert.match(source, /api\.open\("dbx:puzzle:lawson-rune-memory"\)/);
  assert.doesNotMatch(source, /eval|new Function|socket|fromUuid|createEmbeddedDocuments/);
});
