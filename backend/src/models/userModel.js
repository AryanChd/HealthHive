import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: { type: String, enum: ["user", "doctor", "admin"], default: "user" },

  age: Number,
  gender: { type: String, enum: ["male", "female", "other"] },
  medicalConditions: [String],

  profileImage: String,

  languagePreference: { type: String, default: "en" }, // i18n EN/NP

  createdAt: { type: Date, default: Date.now },
  verifyOtp: {type: String, default: ''},
  verifyOtpExpireAt: {type: Number, default: 0},
  resetOtp: {type: String, default: ''},
  resetOtpExpireAt: {type: Number, default: 0},
});

const userModel = mongoose.model.user || mongoose.model("User", userSchema);

export default userModel;
