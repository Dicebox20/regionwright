import assert from "node:assert/strict";
import test from "node:test";
import { invokeBalladControl } from "../scripts/ballad-control-dispatch.mjs";

test("Ballad toolbar dispatch returns and settles the operation promise", async () => {
  let called = 0;
  const api = { premium: { ascendancy: { ballad: { openPreview: async () => { called += 1; return { status: "OBSERVED" }; } } } } };
  const resultPromise = invokeBalladControl(api, "openPreview");
  assert.equal(typeof resultPromise?.then, "function");
  assert.deepEqual(await resultPromise, { status: "OBSERVED" });
  assert.equal(called, 1);
});

test("Ballad toolbar dispatch reports rejected operations instead of losing them", async () => {
  const errors = [];
  const api = { premium: { ascendancy: { ballad: { openAudit: async () => { throw new Error("dialog failed"); } } } } };
  const result = await invokeBalladControl(api, "openAudit", (...entry) => errors.push(entry));
  assert.equal(result, null);
  assert.equal(errors.length, 1);
  assert.match(errors[0][1].message, /dialog failed/);
});
