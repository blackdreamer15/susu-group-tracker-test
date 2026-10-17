import { getReport } from "../services/tracker.js";

export default function reportController(req, res) {
	try {
		res.status(200).json(getReport());
	} catch (error) {
		res.status(error.statusCode || 500).json({
			status: error.status || "error",
			message: error.message,
		});
	}
}
