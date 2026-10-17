function failResponse(error, includeStack) {
	const data = { message: error.message };

	if (error.outstanding) {
		data.outstanding = error.outstanding;
	}

	if (includeStack) {
		data.stack = error.stack;
	}

	return { status: "fail", data };
}

function errorResponse(error, includeStack) {
	const body = {
		status: "error",
		message: error.message || "Something went very wrong!",
	};
	const data = {};

	if (error.outstanding) {
		data.outstanding = error.outstanding;
	}

	if (includeStack) {
		data.stack = error.stack;
	}

	if (Object.keys(data).length > 0) {
		body.data = data;
	}

	return body;
}

function sendErrorDev(error, res) {
	const body =
		error.status === "fail" ? failResponse(error, true) : errorResponse(error, true);

	res.status(error.statusCode).json(body);
}

function sendErrorProd(error, res) {
	if (!error.isOperational) {
		console.error("ERROR", error);
		res.status(500).json({
			status: "error",
			message: "Something went very wrong!",
		});
		return;
	}

	const body =
		error.status === "fail" ? failResponse(error, false) : errorResponse(error, false);

	res.status(error.statusCode).json(body);
}

export default function errorController(error, req, res, next) {
	error.statusCode = error.statusCode || 500;
	error.status = error.status || "error";

	if (process.env.NODE_ENV === "development") {
		sendErrorDev(error, res);
	} else {
		sendErrorProd(error, res);
	}
}
