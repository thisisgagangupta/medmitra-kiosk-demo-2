import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER; // e.g. '+15005550006' for testing

const twilioClient = twilio(accountSid, authToken);

export const sendVerificationSMS = async (phone, code) => {
  if (!phone) return; // no phone provided

  try {
    await twilioClient.messages.create({
      body: `Your verification code is: ${code}`,
      from: fromNumber,
      to: phone,
    });
    console.log(`SMS sent to ${phone} with code ${code}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};
