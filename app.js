const express          = require("express"),
      app              = express(),
      bodyParser       = require("body-parser"),
      methodOverride   = require("method-override"),
      expressSanitizer = require("express-sanitizer"),
      mongoose         = require("mongoose"),
      flash            = require("connect-flash"),
      passport         = require("passport"),
      LocalStrategy    = require("passport-local"),
      Post             = require("./models/post"),
      Comment          = require("./models/comment"),
      User             = require("./models/user");

const commentRoutes    = require("./routes/comments"),
      postRoutes       = require("./routes/posts"),
      indexRoutes      = require("./routes/index");

// APP CONFIG             
mongoose.set('useNewUrlParser', true); //Fixed deprication errors
mongoose.set('useUnifiedTopology', true); //Fixed deprication errors

// mongoose.connect("mongodb://localhost/fishtank_diary_app");

mongoose.connect('mongodb+srv://pmasonsocal:Engaged91717@cluster0-l04lq.mongodb.net/<FishTankDiary>?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true
}).then(() => {
    console.log('Connected to DB!');
}).catch(err => {
    console.log('ERROR:', err.message);
});

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(flash());

// MOMENT CONFIG
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialize: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/",indexRoutes);
app.use("/posts/:id/comments/", commentRoutes);
app.use("/posts", postRoutes);

// // SERVER INIT
// app.listen(process.env.PORT, process.env.IP, function(){
//     console.log("SERVER IS RUNNING!");
// });

// TESTING LOCAL ROUTE - BE SURE TO DISABLE SERVER INIT
app.listen(3000, function(){
    console.log("SERVER IS RUNNING!");
});

