import app from "./app.js";

const server = app.listen(process.env.PORT, process.env.HOST, () => {
	console.log(`Server running on port ${process.env.PORT}...`);
});
