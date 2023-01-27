import mongoose from "mongoose";

const magicSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  sessionID: String,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OTP: String,
  code: Number,
  expires: Number
});

export const nmshdMagic = mongoose.model("MagicLogin", magicSchema);
