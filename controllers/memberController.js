import { addMember } from "../services/tracker.js";

export default function memberController(req, res) {
	try {
		const member = addMember(req.body.name);
		res.status(201).json(member);
	} catch (error) {
		res.status(error.statusCode || 500).json({
			status: error.status || "error",
			message: error.message,
		});
	}
}
