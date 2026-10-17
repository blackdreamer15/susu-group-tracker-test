import { addMember } from "../services/tracker.js";

export default function memberController(req, res) {
	const member = addMember(req.body.name);
	res.status(201).json({ status: "success", data: member });
}
