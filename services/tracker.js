import AppError from "../utils/appError.js";
import { formatGhs, parseGhs } from "../utils/money.js";

let group = null;

function requireGroup() {
	if (!group) {
		throw new AppError("No group exists.", 404);
	}
}

function readAmount(amount) {
	try {
		return parseGhs(amount);
	} catch (error) {
		throw new AppError(error.message, 400);
	}
}

function normalizeName(name) {
	if (typeof name !== "string" || name.trim() === "") {
		throw new AppError("Name is required.", 400);
	}

	return name.trim();
}

function findMember(name) {
	const trimmedName = normalizeName(name);
	const member = group.members.find(
		(item) => item.name.toLowerCase() === trimmedName.toLowerCase(),
	);

	if (!member) {
		throw new AppError(`Member ${trimmedName} does not exist.`, 404);
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
		throw new AppError("A group already exists.", 409);
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
		throw new AppError("Membership is locked until the current cycle ends.", 409);
	}

	const trimmedName = normalizeName(name);
	const duplicate = group.members.find(
		(member) => member.name.toLowerCase() === trimmedName.toLowerCase(),
	);

	if (duplicate) {
		throw new AppError(`${duplicate.name} is already a member.`, 409);
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
		throw new AppError(`${member.name} only owes ${formatGhs(owes)}.`, 409);
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
		throw new AppError("The group has no members.", 409);
	}

	const outstanding = group.members
		.filter((member) => member.paid < group.weeklyContribution)
		.map((member) => ({
			member: member.name,
			owes: formatGhs(group.weeklyContribution - member.paid),
		}));

	if (outstanding.length > 0) {
		const error = new AppError(`Week ${group.currentWeek} is not fully paid.`, 409);
		error.outstanding = outstanding;
		throw error;
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
