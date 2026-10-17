import { createGroup } from "../services/tracker.js";

export default function groupController(req, res) {
	const group = createGroup(req.body.weeklyContribution);
	res.status(201).json({ status: "success", data: group });
}
