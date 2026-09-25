import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuantity } from "./quantity";

describe("parseQuantity", () => {
  it("accepts whole numbers in range", () => {
    assert.deepEqual(parseQuantity("1", 10), { ok: true, value: 1 });
    assert.deepEqual(parseQuantity("3", 10), { ok: true, value: 3 });
    assert.deepEqual(parseQuantity("5", 10), { ok: true, value: 5 });
  });

  it("rejects 0, negatives, text, and huge numbers", () => {
    assert.equal(parseQuantity("0", 10).ok, false);
    assert.equal(parseQuantity("-2", 10).ok, false);
    assert.equal(parseQuantity("abc", 10).ok, false);
    assert.equal(parseQuantity("999999", 10).ok, false);
  });

  it("rejects more than available stock", () => {
    const result = parseQuantity("8", 3);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.message, /stock/i);
    }
  });
});
