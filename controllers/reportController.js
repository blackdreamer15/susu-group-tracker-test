import { getReport } from "../services/tracker.js";

export default function reportController(req, res) {
	try {
		res.status(200).json(getReport());
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}
