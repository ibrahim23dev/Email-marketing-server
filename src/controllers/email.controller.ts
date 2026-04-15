// src/controllers/email.controller.ts

import { Request, Response } from 'express';
import { sendEmailService } from '../services/email.service';

export const sendEmailController = async (req: Request, res: Response) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'to and subject are required',
      });
    }

    const result = await sendEmailService({ to, subject, text, html });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};