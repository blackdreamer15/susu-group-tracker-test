import { createPayout } from "../services/tracker.js";

export default function payoutController(req, res) {
	try {
		const payout = createPayout();
		res.status(201).json(payout);
	} catch (error) {
		const body = { error: error.message };

		if (error.outstanding) {
			body.outstanding = error.outstanding;
		}

		res.status(500).json(body);
	}
}
