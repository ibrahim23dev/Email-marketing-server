import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID!,
  process.env.TWILIO_TOKEN_AUTH!
);

export const sendSMS = async (to: string, message: string) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_NUMBER!,
      to,
    });

    return {
      success: true,
      sid: response.sid,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};