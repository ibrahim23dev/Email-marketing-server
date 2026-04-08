import mongoose from "mongoose";

const smsSchema = new mongoose.Schema({
  to: String,
  message: String,
  status: String,
  sid: String,
}, { timestamps: true });

export default mongoose.model("SMS", smsSchema);