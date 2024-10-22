const Listing=require("./models/listing.js");
const Review=require("./models/review.js");
const {listingSchema}=require("./schema.js");
const ExpressError=require("./utils/ExpressError.js");
const {reviewSchema}=require("./schema.js");
const User = require("./models/user.js");
module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You Must be logged in to do that!")
       return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner=async (req,res,next)=>{
    const {id}=req.params;
    let listing=await Listing.findById(id);
   
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","You are not the owner of this listing.");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.validateListing=(req,res,next)=>{
    const {error}=listingSchema.validate(req.body);
    
    if(error){
        let errMsg=error.details.map(el=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }
    else{
        next();
    }
};

module.exports.validateReview = (req, res, next) => {     
    const { error } = reviewSchema.validate(req.body); // Changed 'let' to 'const'
    
    if (error) {         
        let errMsg = error.details.map(el => el.message).join(",");         
        throw new ExpressError(400, errMsg);     
    } else {         
        next();     
    } 
};


module.exports.isReviewAuthor=async (req,res,next)=>{
    const {id,reviewId}=req.params;
    let review=await Review.findById(reviewId);
   
    if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error","You did't created this review.");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.verifyOtpMiddleware = async (req, res, next) => {
    const { userId } = req.query;

    if (!userId) {
        req.flash("error", "Invalid access. Please request a new OTP.");
        return res.redirect("/login");
    }

    const user = await User.findById(userId);
    if (!user || !user.otp || user.otpExpires < Date.now()) {
        req.flash("error", "Invalid or expired OTP. Please request a new one.");
        return res.redirect("/login");
    }

    req.user = user; // Attach user to request for later use
    next();
};

module.exports.verifyOtp = async (req, res, next) => {
    const { userId, otp } = req.body;

    if (!userId && !otp) {
        req.flash("error", "Invalid access. Please request a new OTP.");
        return res.redirect("/login");
    }
   
    next();
};

