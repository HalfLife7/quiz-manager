var express = require('express');
var session = require('express-session')

var router = express.Router()

// home page
router.get('/', function (req, res) {
  loginError = req.session.loginError;
  req.session.loginError = "";

  // if no user is logged in, display the login page, possibly with an error
  if (!req.session.email) {
    res.render("loginpage", { errorMessage: loginError });
  }
  // If a user IS logged in, we don't want them to be able to see the login
  // page (you can't be logged in 2x), so redirect them to the users page
  else {
    res.redirect("/homepage");
  }
});

// home page
router.get('/homepage', function (req, res) {
    loginError = req.session.loginError;
    req.session.loginError = "";
  
    console.log(req.session);
    // if no user is logged in, display the login page, possibly with an error
    if (!req.session.email) {
      res.render("loginpage", { errorMessage: loginError});
    }
    // If a user IS logged in, we don't want them to be able to see the login
    // page (you can't be logged in 2x), so redirect them to the users page
    else {
      res.render("../views/homepage", {firstName: req.session.userInfo.firstName, lastName:req.session.userInfo.lastName} );
    }
  });

  module.exports = router;