const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const ejsMate=require("ejs-mate");
const listingRouter=require("./routes/listing.js");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
app.engine("ejs",ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
const methodOverride=require("method-override");
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");
const flash=require("connect-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const paymentRoutes = require('./routes/paymentRoute');
require('dotenv').config();

async function main(){
    await mongoose.connect(process.env.MONGO_URI);
}

main().then(()=>{
    console.log("Connected to DB");
}).catch((err)=>{
    console.log(err);
});

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, // Use your MongoDB connection string
        collectionName: "sessions" // Name of the collection to store sessions
    }),
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

app.use(paymentRoutes);




app.get("/",async (req,res)=>{
    try{
        if (req.isAuthenticated()) {
            // If the user is logged in, redirect to /listings
            return res.redirect("/listings");
        }
        let {username,email,password}=req.body;
    const newUser=new User({email,username});
    const registeredUser=await User.register(newUser,password);
    // console.log(registeredUser);
    req.login(registeredUser,(err)=>{
        if(err){
            return next(err);  
        }
        req.flash("success","Welcome To WanderLust!");
        res.redirect("/listings");
    })
  
    } catch(e){

        res.redirect("/signup");
    }
});

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});



// app.all("*",(req,res,next)=>{
//     next(new ExpressError(404,"Page Not Found"));
// });

// app.all("*",(req,res,next)=>{
//     console.log("Page Not Found");
// });


app.listen(8080,(req,res)=>{
    console.log("Server is running on Port :8080");
});
