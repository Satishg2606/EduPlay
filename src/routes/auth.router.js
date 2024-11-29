import { Router } from "express";
import { sendOTP } from "../controllers/otp.controller.js";
const authRouter = Router();


authRouter.route("/send-otp").post(sendOTP);
// authRouter.route("/verify-otp").post(verifyOTP);

export default authRouter;