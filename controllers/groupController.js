import { createGroup } from "../services/tracker.js";

export default function groupController(req, res) {
	try {
		const group = createGroup(req.body.weeklyContribution);
		res.status(201).json(group);
	} catch (error) {
		res.status(error.statusCode || 500).json({
			status: error.status || "error",
			message: error.message,
		});
	}
}
