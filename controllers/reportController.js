import { getReport } from "../services/tracker.js";

export default function reportController(req, res) {
	res.status(200).json({ status: "success", data: getReport() });
}
