import { createGroup } from "../services/tracker.js";

export default function groupController(req, res) {
	try {
		const group = createGroup(req.body.weeklyContribution);
		res.status(201).json(group);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}
