import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatGhs, parseGhs } from "../utils/money.js";

describe("parseGhs", () => {
	it("converts a two-decimal amount into pesewas", () => {
		assert.equal(parseGhs("50.00"), 5000);
		assert.equal(parseGhs("0.29"), 29);
		assert.equal(parseGhs("19.99"), 1999);
	});

	it("accepts a whole number and one decimal place", () => {
		assert.equal(parseGhs("50"), 5000);
		assert.equal(parseGhs("50.5"), 5050);
		assert.equal(parseGhs("50.50"), 5050);
	});

	it("trims spaces around the amount", () => {
		assert.equal(parseGhs(" 50.00 "), 5000);
	});

	it("rejects zero, negative, over-precise, and malformed amounts", () => {
		const rejected = ["0", "0.00", "-1.00", "50.001", "abc", "", "50.", ".50", "1e2"];

		for (const amount of rejected) {
			assert.throws(() => parseGhs(amount), Error);
		}
	});

	it("rejects a JSON number", () => {
		assert.throws(() => parseGhs(50), /decimal string/);
	});
});

describe("formatGhs", () => {
	it("formats pesewas as a two-decimal string", () => {
		assert.equal(formatGhs(5000), "50.00");
		assert.equal(formatGhs(29), "0.29");
		assert.equal(formatGhs(1999), "19.99");
		assert.equal(formatGhs(5050), "50.50");
		assert.equal(formatGhs(0), "0.00");
	});

	it("round-trips a parsed amount", () => {
		assert.equal(formatGhs(parseGhs("0.29")), "0.29");
		assert.equal(formatGhs(parseGhs("19.99")), "19.99");
		assert.equal(formatGhs(parseGhs("50.5")), "50.50");
	});
});
