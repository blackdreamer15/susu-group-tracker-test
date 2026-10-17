import { createPayout } from "../services/tracker.js";

export default function payoutController(req, res) {
	try {
		const payout = createPayout();
		res.status(201).json(payout);
	} catch (error) {
		const body = {
			status: error.status || "error",
			message: error.message,
		};

		if (error.outstanding) {
			body.outstanding = error.outstanding;
		}

		res.status(error.statusCode || 500).json(body);
	}
}
