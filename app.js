import express from "express";
import morgan from "morgan";
import contributionController from "./controllers/contributionController.js";
import errorController from "./controllers/errorController.js";
import groupController from "./controllers/groupController.js";
import memberController from "./controllers/memberController.js";
import payoutController from "./controllers/payoutController.js";
import reportController from "./controllers/reportController.js";

const app = express();

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

app.use(express.json());

app.post("/api/groups", groupController);
app.post("/api/members", memberController);
app.post("/api/contributions", contributionController);
app.post("/api/payouts", payoutController);
app.get("/api/report", reportController);

// Global Error Handler
app.use(errorController);

export default app;
