import { recordContribution } from "../services/tracker.js";

export default function contributionController(req, res) {
	const contribution = recordContribution(req.body.member, req.body.amount);
	res.status(201).json({ status: "success", data: contribution });
}
