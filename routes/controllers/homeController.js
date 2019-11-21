var express = require('express');
var session = require('express-session')

var router = express.Router()

// home page
router.get('/', function (req, res) {
  loginerror = req.session.login_error;
  req.session.login_error = "";

  // if no user is logged in, display the login page, possibly with an error
  if (!req.session.email) {
    res.render("loginpage", { errormsg: loginerror });
  }
  // If a user IS logged in, we don't want them to be able to see the login
  // page (you can't be logged in 2x), so redirect them to the users page
  else {
    res.redirect("/homepage");
  }
});

// home page
router.get('/homepage', function (req, res) {
    loginerror = req.session.login_error;
    req.session.login_error = "";
  
    // if no user is logged in, display the login page, possibly with an error
    if (!req.session.email) {
      res.render("loginpage", { errormsg: loginerror });
    }
    // If a user IS logged in, we don't want them to be able to see the login
    // page (you can't be logged in 2x), so redirect them to the users page
    else {
      res.render("../views/homepage");
    }
  });

  module.exports = router;