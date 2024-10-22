const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensure emails are unique
    },
    otp: {
        type: String, // Store OTP
    },
    otpExpires: {
        type: Date, // Store OTP expiration time
    },
    isVerified: {
        type: Boolean,
        default: false, // New users are not verified by default
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
