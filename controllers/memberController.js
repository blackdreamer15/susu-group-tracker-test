import { addMember } from "../services/tracker.js";

export default function memberController(req, res) {
	try {
		const member = addMember(req.body.name);
		res.status(201).json(member);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}
