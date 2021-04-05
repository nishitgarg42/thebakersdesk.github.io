require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const client = require('@mailchimp/mailchimp_marketing');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));



// Session
app.use(session({
  secret:"our website",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());



// Mongodb
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://admin:Nishit1234@cluster0.mstzw.mongodb.net/cakeDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const productsSchema = {
  image: String
};

const Product = mongoose.model("Product", productsSchema);

const limit = 12;

// set storage engine
const storage = multer.diskStorage({
  destination: "./public/images/cakes/",
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init upload
const upload = multer({storage:storage}).array("myImage");



passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Google oauth20
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://thebakersdesk.herokuapp.com/auth/google/adminupload",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    if(117894744322725689893 == profile.id || 101123713274390916666 == profile.id){
      return cb(null, profile);
    }else{
      return cb(null);
    }
  }
));




// Home Route
app.get("/", async (req, res) => {
  const page = 1;
  const limitHomePage = 6;

  try {
    // execute query with page and limit values
    const foundProducts = await Product.find()
      .sort({ _id: -1 })
      .skip((page - 1) * limitHomePage)
      .limit(limitHomePage * 1)
      .exec();

    // return response with posts, total pages, and current page
    res.render("home", {dataSrc: foundProducts});
  } catch (err) {
    console.error(err.message);
  }
})


// Cake Route
app.route("/cake")

.get(async (req, res) => {
  const page = req.query.page ? req.query.page : 1;

  try {
    // execute query with page and limit values
    const foundProducts = await Product.find()
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .exec();

    // get total documents in the Posts collection
    const count = await Product.countDocuments();

    // return response with posts, total pages, and current page
    res.render("cake", {dataSrc: foundProducts, totalPages: Math.ceil(count / limit), currentPage: page});
  } catch (err) {
    console.error(err.message);
  }
})

.post(async (req, res) => {
  const goPage = parseInt(req.body.goPage);

  const count = await Product.countDocuments();
  const totalPages = Math.ceil(count / limit);

  if(goPage == 0 ){
    res.redirect("cake?page=1");
  }if(goPage < totalPages){
    res.redirect("cake?page=" + goPage);
  }else{
    res.redirect("cake?page=" + totalPages);
  };
});


// Menu and About us Route
app.get("/menu", function(req, res){
  res.render("menu");
})

app.get("/aboutus", function(req, res){
  res.render("aboutus");
})

// Contact Us Route
app.post("/contactus", function(req, res) {
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const email = req.body.email;
  const birthDate = req.body.yourBirthdate;

  const data = {
    members: [{
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME1: firstName,
        LNAME2: lastName,
        BDAY1: birthDate
      }
    } ]
  };

  const jsonData = JSON.stringify(data);

  client.setConfig({
    apiKey: process.env.MAILCHIMP_APIKEY,
    server: "us1",
  });

  const run = async () => {
    const response = await client.lists.batchListMembers(process.env.MAILCHIMP_AUDIENCE_ID, jsonData);
  };

  run();
  res.render("subscribe");
});

// admin signin
app.get("/adminsignin", function(req, res){
  res.render("adminsignin");
})

// google signin and authentication
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get('/auth/google/adminupload',
  passport.authenticate('google', { failureRedirect: '/adminsignin' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/adminupload');
  });

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/adminsignin");
});

// Admin Section
app.route("/adminupload")

.get(function(req, res){
  if (req.isAuthenticated()){
    res.render("adminupload");
  } else {
    res.redirect("/adminsignin");
  }
})
// upload image
.post(function(req, res){
  upload(req, res, (err) => {
    if(err){
      res.render("adminupload", {msg:err});
    }else{
    req.files.forEach(function(data){
      const newProduct = new Product({
        image: data.filename
      });
      newProduct.save();
    });
    res.render("adminupload", {afterUpload:"Successfully Added New Photos"});
    }
  })
});


// admin view section
app.route("/adminview")

.get(async function(req, res){
  if (req.isAuthenticated()){
    const page = req.query.page ? req.query.page : 1;

    try {
      // execute query with page and limit values
      const foundProducts = await Product.find()
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();

      // get total documents in the Posts collection
      const count = await Product.countDocuments();

      // return response with posts, total pages, and current page
      res.render("adminview", {dataSrc: foundProducts, totalPages: Math.ceil(count / limit), currentPage: page});
    } catch (err) {
      console.error(err.message);
    }
  } else {
    res.redirect("/adminsignin");
  }
})


.post(async (req, res) => {
  const goPage = parseInt(req.body.goPage);

  const count = await Product.countDocuments();
  const totalPages = Math.ceil(count / limit);

  if(goPage == 0 ){
    res.redirect("adminview?page=1");
  }if(goPage < totalPages){
    res.redirect("adminview?page=" + goPage);
  }else{
    res.redirect("adminview?page=" + totalPages);
  };
});

// Delete Image from Gallery
app.post("/delete", function(req, res){
  const deleteItem = (req.body.deleteItem);
  const deleteImageAddress = ("public/images/cakes/" + req.body.deleteImageAddress);

  Product.findByIdAndDelete(deleteItem, function(err){
    if(err){
      console.log(err);
    }
  });

  fs.unlink(deleteImageAddress, (err) => {
  if (err){
    console.log(err);
  }
})

res.redirect("/adminview");
})

const port = process.env.PORT || 3000;

app.listen(port, () => console.log("server is running on port " + port + "."));
