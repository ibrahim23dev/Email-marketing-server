import { Router } from "express";
import { sendSMSController } from "../controllers/sms.controller";

const router = Router();

router.post("/send", sendSMSController);

export default router;