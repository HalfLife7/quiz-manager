var express = require('express');

var router = express.Router()

// mysql
var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 99,
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'quizmanager'
});

// middleware to redirect users to the homepage if they do not have valid session data
function setActive(req, res, next) {
  res.locals.homepageActive = "active";
  next();
}
router.use(setActive);

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

  // if no user is logged in, display the login page, possibly with an error
  if (req.session.loggedIn != "true") {
    res.render("loginpage", { errorMessage: loginError });
  }
  // If a user IS logged in, we don't want them to be able to see the login
  // page (you can't be logged in 2x), so redirect them to the users page
  else {
    // get JS time and convert to mySQL datetime
    // https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime/11150727#11150727
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    pool.query("UPDATE user SET last_date_active = (?) WHERE user_id = (?)", [currentDate, req.session.userInfo.userId], function callback(error, results,fields) {
      if (error !=null) {
        console.log(error);
      } else {
        res.render("../views/homepage", { userInfo: req.session.userInfo, unauthorizedAccessMessage: unauthorizedAccess });
      }
    })

  }
});

module.exports = router;