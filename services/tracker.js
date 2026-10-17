import { formatGhs, parseGhs } from "../utils/money.js";

let group = null;

function fail(statusCode, message, details) {
	const error = new Error(message);
	error.statusCode = statusCode;

	if (details) {
		Object.assign(error, details);
	}

	throw error;
}

function requireGroup() {
	if (!group) {
		fail(404, "No group exists.");
	}
}

function readAmount(amount) {
	try {
		return parseGhs(amount);
	} catch (error) {
		fail(400, error.message);
	}
}

function normalizeName(name) {
	if (typeof name !== "string" || name.trim() === "") {
		fail(400, "Name is required.");
	}

	return name.trim();
}

function findMember(name) {
	const trimmedName = normalizeName(name);
	const member = group.members.find(
		(item) => item.name.toLowerCase() === trimmedName.toLowerCase(),
	);

	if (!member) {
		fail(404, `Member ${trimmedName} does not exist.`);
	}

	return member;
}

function memberView(member) {
	const owes = group.weeklyContribution - member.paid;

	return {
		name: member.name,
		paid: formatGhs(member.paid),
		owes: formatGhs(owes),
		paidInFull: owes === 0,
	};
}

export function resetGroup() {
	group = null;
}

export function createGroup(weeklyContribution) {
	if (group) {
		fail(409, "A group already exists.");
	}

	group = {
		weeklyContribution: readAmount(weeklyContribution),
		currentWeek: 1,
		membershipOpen: true,
		nextIndex: 0,
		members: [],
		payouts: [],
	};

	return {
		weeklyContribution: formatGhs(group.weeklyContribution),
		currentWeek: group.currentWeek,
		membershipOpen: group.membershipOpen,
	};
}

export function addMember(name) {
	requireGroup();

	if (!group.membershipOpen) {
		fail(409, "Membership is locked until the current cycle ends.");
	}

	const trimmedName = normalizeName(name);
	const duplicate = group.members.find(
		(member) => member.name.toLowerCase() === trimmedName.toLowerCase(),
	);

	if (duplicate) {
		fail(409, `${duplicate.name} is already a member.`);
	}

	group.members.push({ name: trimmedName, paid: 0 });

	return {
		name: trimmedName,
		position: group.members.length,
	};
}

export function recordContribution(memberName, amount) {
	requireGroup();

	const member = findMember(memberName);
	const payment = readAmount(amount);
	const owes = group.weeklyContribution - member.paid;

	if (payment > owes) {
		fail(409, `${member.name} only owes ${formatGhs(owes)}.`);
	}

	member.paid += payment;
	group.membershipOpen = false;

	return {
		member: member.name,
		week: group.currentWeek,
		amount: formatGhs(payment),
		paid: formatGhs(member.paid),
		owes: formatGhs(group.weeklyContribution - member.paid),
	};
}

export function createPayout() {
	requireGroup();

	if (group.members.length === 0) {
		fail(409, "The group has no members.");
	}

	const outstanding = group.members
		.filter((member) => member.paid < group.weeklyContribution)
		.map((member) => ({
			member: member.name,
			owes: formatGhs(group.weeklyContribution - member.paid),
		}));

	if (outstanding.length > 0) {
		fail(409, `Week ${group.currentWeek} is not fully paid.`, { outstanding });
	}

	const recipient = group.members[group.nextIndex];
	const pot = group.weeklyContribution * group.members.length;
	const paidWeek = group.currentWeek;

	group.payouts.push({
		week: paidWeek,
		member: recipient.name,
		amount: pot,
	});

	for (const member of group.members) {
		member.paid = 0;
	}

	group.currentWeek += 1;
	group.nextIndex += 1;

	if (group.nextIndex === group.members.length) {
		group.nextIndex = 0;
		group.membershipOpen = true;
	}

	return {
		week: paidWeek,
		member: recipient.name,
		amount: formatGhs(pot),
		currentWeek: group.currentWeek,
		nextRecipient: group.members[group.nextIndex].name,
		membershipOpen: group.membershipOpen,
	};
}

export function getReport() {
	requireGroup();

	return {
		currentWeek: group.currentWeek,
		weeklyContribution: formatGhs(group.weeklyContribution),
		membershipOpen: group.membershipOpen,
		nextRecipient: group.members[group.nextIndex]?.name ?? null,
		members: group.members.map(memberView),
		payouts: group.payouts.map((payout) => ({
			week: payout.week,
			member: payout.member,
			amount: formatGhs(payout.amount),
		})),
	};
}
