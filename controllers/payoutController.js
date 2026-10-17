import { createPayout } from "../services/tracker.js";

export default function payoutController(req, res) {
	const payout = createPayout();
	res.status(201).json({ status: "success", data: payout });
}
