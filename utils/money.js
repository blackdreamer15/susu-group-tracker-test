function onlyDigits(value) {
	if (value.length === 0) {
		return false;
	}

	for (const character of value) {
		if (character < "0" || character > "9") {
			return false;
		}
	}

	return true;
}

export function parseGhs(amount) {
	if (typeof amount !== "string") {
		throw new Error("Amount must be a decimal string.");
	}

	const parts = amount.trim().split(".");
	const cedisText = parts[0];
	const fractionText = parts[1];
	const invalidAmount = "Amount must be a positive value with at most two decimal places.";

	if (parts.length > 2) {
		throw new Error(invalidAmount);
	}

	if (!onlyDigits(cedisText)) {
		throw new Error(invalidAmount);
	}

	if (fractionText !== undefined && fractionText.length > 2) {
		throw new Error(invalidAmount);
	}

	if (fractionText !== undefined && !onlyDigits(fractionText)) {
		throw new Error(invalidAmount);
	}

	const fraction = (fractionText ?? "0").padEnd(2, "0");
	const pesewas = Number(cedisText) * 100 + Number(fraction);

	if (pesewas <= 0) {
		throw new Error("Amount must be greater than zero.");
	}

	return pesewas;
}

export function formatGhs(pesewas) {
	const cedis = Math.floor(pesewas / 100);
	const fraction = String(pesewas % 100).padStart(2, "0");

	return `${cedis}.${fraction}`;
}
