import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
	addMember,
	createGroup,
	createPayout,
	getReport,
	recordContribution,
	resetGroup,
} from "../services/tracker.js";

function errorFrom(run) {
	try {
		run();
	} catch (error) {
		return error;
	}

	assert.fail("Expected the call to throw.");
}

function startGroup() {
	createGroup("50.00");
	addMember("Ama");
	addMember("Kofi");
	addMember("Esi");
}

function pay(member, amount) {
	return recordContribution(member, amount);
}

describe("tracker", () => {
	beforeEach(() => {
		resetGroup();
	});

	it("creates one group with a weekly contribution", () => {
		assert.deepEqual(createGroup("50.00"), {
			weeklyContribution: "50.00",
			currentWeek: 1,
			membershipOpen: true,
		});
	});

	it("rejects a second group and an invalid contribution", () => {
		createGroup("50.00");

		const duplicate = errorFrom(() => createGroup("20.00"));
		assert.equal(duplicate.statusCode, 409);

		resetGroup();

		const invalid = errorFrom(() => createGroup("0"));
		assert.equal(invalid.statusCode, 400);
	});

	it("adds members in join order and rejects duplicates", () => {
		createGroup("50.00");

		assert.deepEqual(addMember(" Ama "), { name: "Ama", position: 1 });
		assert.deepEqual(addMember("Kofi"), { name: "Kofi", position: 2 });

		const duplicate = errorFrom(() => addMember("ama"));
		assert.equal(duplicate.statusCode, 409);

		const blank = errorFrom(() => addMember("  "));
		assert.equal(blank.statusCode, 400);
	});

	it("rejects a member when no group exists", () => {
		const error = errorFrom(() => addMember("Ama"));
		assert.equal(error.statusCode, 404);
	});

	it("records a partial payment and the remaining balance", () => {
		startGroup();

		assert.deepEqual(pay("Esi", "30.00"), {
			member: "Esi",
			week: 1,
			amount: "30.00",
			paid: "30.00",
			owes: "20.00",
		});

		assert.equal(pay("Esi", "20.00").owes, "0.00");
	});

	it("rejects an unknown member and an overpayment without changing state", () => {
		startGroup();
		pay("Esi", "30.00");
		const before = getReport();

		const unknown = errorFrom(() => pay("Yaa", "10.00"));
		assert.equal(unknown.statusCode, 404);

		const overpaid = errorFrom(() => pay("Esi", "20.01"));
		assert.equal(overpaid.statusCode, 409);
		assert.deepEqual(getReport(), before);
	});

	it("rejects zero and over-precise payments", () => {
		startGroup();

		assert.equal(errorFrom(() => pay("Ama", "0")).statusCode, 400);
		assert.equal(errorFrom(() => pay("Ama", "-1.00")).statusCode, 400);
		assert.equal(errorFrom(() => pay("Ama", "50.001")).statusCode, 400);
	});

	it("locks membership after the first contribution", () => {
		createGroup("50.00");
		addMember("Ama");
		pay("Ama", "50.00");

		const error = errorFrom(() => addMember("Kofi"));
		assert.equal(error.statusCode, 409);
		assert.equal(getReport().membershipOpen, false);
	});

	it("refuses a payout when someone still owes and leaves the week unchanged", () => {
		startGroup();
		pay("Ama", "50.00");
		pay("Kofi", "50.00");
		pay("Esi", "30.00");
		const before = getReport();

		const error = errorFrom(() => createPayout());

		assert.equal(error.statusCode, 409);
		assert.deepEqual(error.outstanding, [{ member: "Esi", owes: "20.00" }]);
		assert.deepEqual(getReport(), before);
	});

	it("pays the pot in join order and reopens membership after the last member", () => {
		startGroup();
		pay("Ama", "50.00");
		pay("Kofi", "50.00");
		pay("Esi", "30.00");
		pay("Esi", "20.00");

		assert.deepEqual(createPayout(), {
			week: 1,
			member: "Ama",
			amount: "150.00",
			currentWeek: 2,
			nextRecipient: "Kofi",
			membershipOpen: false,
		});

		pay("Ama", "50.00");
		pay("Kofi", "50.00");
		pay("Esi", "50.00");
		assert.equal(createPayout().member, "Kofi");

		pay("Ama", "50.00");
		pay("Kofi", "50.00");
		pay("Esi", "50.00");

		const endOfCycle = createPayout();
		assert.equal(endOfCycle.member, "Esi");
		assert.equal(endOfCycle.currentWeek, 4);
		assert.equal(endOfCycle.nextRecipient, "Ama");
		assert.equal(endOfCycle.membershipOpen, true);

		addMember("Yaa");
		pay("Ama", "50.00");
		pay("Kofi", "50.00");
		pay("Esi", "50.00");
		pay("Yaa", "50.00");

		assert.deepEqual(createPayout(), {
			week: 4,
			member: "Ama",
			amount: "200.00",
			currentWeek: 5,
			nextRecipient: "Kofi",
			membershipOpen: false,
		});

		const locked = errorFrom(() => addMember("Kojo"));
		assert.equal(locked.statusCode, 409);
	});

	it("reports balances and payout history", () => {
		startGroup();
		pay("Ama", "50.00");
		pay("Kofi", "50.00");
		pay("Esi", "30.00");

		assert.deepEqual(getReport(), {
			currentWeek: 1,
			weeklyContribution: "50.00",
			membershipOpen: false,
			nextRecipient: "Ama",
			members: [
				{ name: "Ama", paid: "50.00", owes: "0.00", paidInFull: true },
				{ name: "Kofi", paid: "50.00", owes: "0.00", paidInFull: true },
				{ name: "Esi", paid: "30.00", owes: "20.00", paidInFull: false },
			],
			payouts: [],
		});
	});

	it("rejects a payout when the group has no members", () => {
		createGroup("50.00");

		const error = errorFrom(() => createPayout());
		assert.equal(error.statusCode, 409);
		assert.equal(getReport().currentWeek, 1);
		assert.equal(getReport().nextRecipient, null);
	});
});
