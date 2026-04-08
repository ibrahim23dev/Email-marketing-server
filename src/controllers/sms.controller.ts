import { Request, Response } from "express";
import { sendSMS } from "../services/sms.service";

export const sendSMSController = async (req: Request, res: Response) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      success: false,
      message: "Phone number and message required",
    });
  }

  const result = await sendSMS(to, message);

  if (result.success) {
    return res.json({
      success: true,
      data: result,
    });
  } else {
    return res.status(500).json({
      success: false,
      error: result.error,
    });
  }
};