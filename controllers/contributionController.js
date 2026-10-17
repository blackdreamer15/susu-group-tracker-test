import { recordContribution } from "../services/tracker.js";

export default function contributionController(req, res) {
	try {
		const contribution = recordContribution(req.body.member, req.body.amount);
		res.status(201).json(contribution);
	} catch (error) {
		res.status(error.statusCode || 500).json({
			status: error.status || "error",
			message: error.message,
		});
	}
}
