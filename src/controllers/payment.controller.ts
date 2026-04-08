import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import PaymentRequest from '../models/paymentRequest.model';
import User from '../models/user.model';

const PACKAGE_MAPPING: Record<number, number> = {
  5: 1000,
  10: 2500,
  20: 5000,
  50: 10000
};

// ======================
// CREATE PAYMENT REQUEST
// ======================
export const createPaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { packageAmount, transactionId, note } = req.body;
    const userId = req.user.id;

    if (!PACKAGE_MAPPING[packageAmount]) {
      res.status(400).json({ ok: false, error: 'Invalid package amount. Valid options: 5, 10, 20, 50' });
      return;
    }

    if (!transactionId) {
      res.status(400).json({ ok: false, error: 'Transaction ID is required' });
      return;
    }

    const paymentRequest = await PaymentRequest.create({
      userId,
      packageAmount,
      creditsToAdd: PACKAGE_MAPPING[packageAmount],
      transactionId,
      note,
      status: 'pending'
    });

    res.status(201).json({
      ok: true,
      message: 'Payment request submitted successfully and is pending admin approval',
      data: paymentRequest
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to create payment request' });
  }
};

// ======================
// APPROVE PAYMENT
// ======================
export const approvePaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      res.status(404).json({ ok: false, error: 'Payment request not found' });
      return;
    }

    if (paymentRequest.status !== 'pending') {
      res.status(400).json({ ok: false, error: `Payment request is already ${paymentRequest.status}` });
      return;
    }

    // Update the request
    paymentRequest.status = 'approved';
    await paymentRequest.save();

    // Give credits to user and make them premium
    await User.findByIdAndUpdate(paymentRequest.userId, {
      $inc: { credits: paymentRequest.creditsToAdd },
      $set: { isPremium: true }
    });

    res.json({
      ok: true,
      message: 'Payment request approved successfully. Credits have been added to the user account.'
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to approve payment request' });
  }
};

// ======================
// GET PAYMENT REQUESTS (Admin)
// ======================
export const getPaymentRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await PaymentRequest.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ ok: true, data: requests });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to retrieve payment requests' });
  }
};
