const express    = require("express"),
      router     = express.Router(),
      passport   = require("passport"),
      User       = require("../models/user"),
      async      = require("async"),
      nodemailer = require("nodemailer"),
      crypto     = require("crypto"),
      user       = require("../models/user"),
      serveIndex = require('serve-index');

router.use('/.wellknown', express.static('./well-known'), serveIndex('.well-known'));

//RESTful ROUTES
router.get("/", function(req, res){
    res.render("landing");
});

// =============
// AUTH ROUTES
// =============

// show register form
router.get("/register", function(req, res){
    res.render("register", {page: 'register'});
});

// handle signup logic
router.post("/register", function(req, res){
    if(req.body.email !== req.body.emailConfirm){
      req.flash("error", "Your e-mail fields don't match. Please try again.")
      res.render("register", req.body);
    } else if(req.body.password !== req.body.passwordConfirm) {
      req.flash("error", "Your password fields don't match. Please try again.")
      res.render("register", req.body);
    } else {
      if(req.body.adminCode === "secretcode123"){
        newUser.isAdmin = true;
      }
      const newUser = new User({
        username: req.body.username, 
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email
      });
      User.register(newUser, req.body.password, function(err, user){
        if(err){
          console.log(err);
          return res.render("register", {error: err.message});
          }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Fish Tank Diary " + user.username);
            res.redirect("/posts");
        });
      });
    }
  });

// show login form
router.get("/login", function(req, res){
    res.render("login", {page: 'login'});
});

// handling login logic
router.post("/login", passport.authenticate("local", 
{
    successRedirect: "/posts",
    successFlash: true,    
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res){
    
});

// add logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged You Out!");
    res.redirect("/posts");
});

// USER PROFILES
router.get("/users/:id" , function(req, res){
    User.findById(req.params.id, function(err, foundUser){
      if(err){
        req.flash("error", "Something went wrong.");
        res.redirect("/");
      } else {
        res.render("users/show", {user: foundUser});
      }
    });
});

// Add reset Password routes
router.get("/forgot", function(req, res){
    res.render("forgot");
});

router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          const token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        const smtpTransport = nodemailer.createTransport({
          service: 'SendGrid', 
          auth: {
            user: process.env.SENDGRIDUSERNAME,
            pass: process.env.SENDGRIDPASS
          }
        });
        var mailOptions = {
          to: user.email,
          from: process.env.SENDGRIDEMAIL,
          subject: 'Fish Tank Diary Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account on www.fishtankdiary.com.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });

// Checks that reset token is still active
router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
});

//Enter a new password and confirm the password
router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'SendGrid', 
          auth: {
            user: process.env.SENDGRIDUSERNAME,
            pass: process.env.SENDGRIDPASS
          }
        });
        var mailOptions = {
          to: user.email,
          from: process.env.SENDGRIDEMAIL,
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' at www.fishtankdiary.com has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/posts');
    });
  });

module.exports = router;