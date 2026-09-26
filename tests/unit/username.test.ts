import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidUsername, normalizeUsername } from "../../lib/username";

describe("normalizeUsername", () => {
  it("normalizes casing, spaces, @ and unsupported characters", () => {
    assert.equal(normalizeUsername("  @@Nestor.Júnior!  "), "nestorjnior");
  });

  it("preserves supported underscores and numbers", () => {
    assert.equal(normalizeUsername("Wish_Box_2026"), "wish_box_2026");
  });

  it("limits usernames to 30 characters", () => {
    assert.equal(normalizeUsername("a".repeat(31)), "a".repeat(30));
  });
});

describe("isValidUsername", () => {
  it("accepts usernames with 3 to 30 supported characters", () => {
    assert.equal(isValidUsername("ana"), true);
    assert.equal(isValidUsername("wish_box_2026"), true);
    assert.equal(isValidUsername("a".repeat(30)), true);
  });

  it("rejects invalid lengths and unsupported characters", () => {
    assert.equal(isValidUsername("ab"), false);
    assert.equal(isValidUsername("a".repeat(31)), false);
    assert.equal(isValidUsername("Ana"), false);
    assert.equal(isValidUsername("ana.silva"), false);
  });
});
