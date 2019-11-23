var express = require('express');

var router = express.Router()

// middleware to pass accountType variable to res.render by default
function checkAccountType(req, res, next) {
  if (req.session.admin == "true") {
    res.locals.admin = "true";
  } else if (req.session.student == "true") {
    res.locals.student = "true";
  } else if (req.session.teacher == "true") {
    res.locals.teacher = "true";
  }
  next();
};

router.use(checkAccountType);

// home page
router.get('/', function (req, res) {
  loginError = req.session.loginError;
  req.session.loginError = "";

  // if no user is logged in, display the login page, possibly with an error
  if (req.session.loggedIn != "true") {
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

  unauthorizedAccess = req.session.unauthorizedAccess;
  req.session.unauthorizedAccess = "";

  console.log("four");

  console.log(req.session);
  // if no user is logged in, display the login page, possibly with an error
  if (req.session.loggedIn != "true") {
    res.render("loginpage", { errorMessage: loginError });
  }
  // If a user IS logged in, we don't want them to be able to see the login
  // page (you can't be logged in 2x), so redirect them to the users page
  else {
    console.log("five");
    res.render("../views/homepage", { firstName: req.session.userInfo.firstName, lastName: req.session.userInfo.lastName, accountType: req.session.userInfo.accountType, unauthorizedAccessMessage: unauthorizedAccess });
  }
});

module.exports = router;