const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const crypto = require("crypto");
const sendOTP = require("../utils/sendotp"); // Sendinblue OTP utility function
const { saveRedirectUrl } = require("../middleware.js");
const {verifyOtpMiddleware,verifyOtp} = require("../middleware.js");

// Render sign-up form
router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

// Sign-up route with OTP sending logic
router.post("/signup", wrapAsync(async (req, res) => {
    try {
        let { username, email, password } = req.body;

        // Generate OTP and expiration
        const otp = crypto.randomBytes(3).toString('hex');
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        // Create a new user without verifying it yet
        const newUser = new User({
            email, 
            username, 
            otp, 
            otpExpires, 
            isVerified: false // User is not verified initially
        });
        const registeredUser = await User.register(newUser, password);

        // Send OTP via email using Sendinblue
        await sendOTP(email, otp);

        req.flash("success", "An OTP has been sent to your email. Please verify it to complete the sign-up.");
        res.redirect(`/verify-otp?userId=${registeredUser._id}`); // Redirect to OTP verification page
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));

// Render OTP verification form
router.get("/verify-otp",verifyOtpMiddleware, (req, res) => {
    const { userId } = req.query;
    req.flash("success", "Please enter the OTP sent to your email to verify your account.");
    res.render("users/verifyOtp.ejs", { userId });
});

// Verify OTP and activate user
router.post("/verify-otp",verifyOtp, wrapAsync(async (req, res) => {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        req.flash("error", "Invalid User");
        return res.redirect("/signup");
    }

    // Check if OTP is valid and not expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
        req.flash("error", "Invalid or expired OTP");
        return res.redirect(`/verify-otp?userId=${userId}`);
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined; // Remove OTP after successful verification
    user.otpExpires = undefined;
    await user.save();

    // Log the user in
    req.login(user, (err) => {
        if (err) return next(err);

        req.flash("success", "Your account has been verified and you are logged in.");
        res.redirect("/listings");
    });
}));

// Logout route
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
    });
    req.flash("success", "Logged Out Successfully!");
    res.redirect("/listings");
});

// Render login form
router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

// Login route with check for verified users
router.post("/login", saveRedirectUrl, passport.authenticate("local", {
    failureRedirect: '/login',
    failureFlash: true
}), async (req, res) => {
    if (!req.user.isVerified) {
        // Generate a new OTP and expiration
        const otp = crypto.randomBytes(3).toString('hex');
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        // Update user with new OTP and expiration
        req.user.otp = otp;
        req.user.otpExpires = otpExpires;
        await req.user.save();

        // Send new OTP via email
        try {
            await sendOTP(req.user.email, otp);
        } catch (error) {
            req.flash("error", "Could not send OTP. Please try again.");
            return res.redirect("/login");
        }

        req.flash("success", "A new OTP has been sent to your email. Please verify it to complete the login.");
        return res.redirect(`/verify-otp?userId=${req.user._id}`); // Redirect to OTP verification page
    }

    req.flash("success", "Welcome To ShelfMaster! You Are Logged In");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
});

module.exports = router;
