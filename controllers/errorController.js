export default function errorController(error, req, res, next) {
	if (!error.statusCode) {
		console.error(error);
		res.status(500).json({
			status: "error",
			message: "Something went very wrong!",
		});
		return;
	}

	if (error.status === "error") {
		res.status(error.statusCode).json({
			status: "error",
			message: error.message,
		});
		return;
	}

	const data = { message: error.message };

	if (error.outstanding) {
		data.outstanding = error.outstanding;
	}

	res.status(error.statusCode).json({ status: "fail", data });
}
