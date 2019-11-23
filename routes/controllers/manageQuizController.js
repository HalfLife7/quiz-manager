var express = require('express');

var router = express.Router()

// middleware to redirect users to the homepage if they do not have valid session data
function checkLogin(req, res, next) {
    if (!req.session.loggedIn) {
        req.session.loginError = "You need to be logged in!";
        res.redirect('/');
    } else {
        next();
    }
    
}
router.use(checkLogin);

// middleware to check if valid account type, if not send them back to the homepage
function unauthorizedAccess(req, res, next) {
    console.log("two");
    if (req.session.student) {
        console.log("three");
        req.session.unauthorizedAccess = "Unauthorized access!";
        res.redirect('/homepage');
    } else {
        next();
    }
    
}
router.use(unauthorizedAccess);

// middleware to pass accountType variable to res.render by default (for nav bar display purposes)
function checkAccountType(req, res, next) {
    if (req.session.admin == "true") {
        res.locals.test = "true";
    } else if (req.session.student == "true") {
        res.locals.test = "true";
    } else if (req.session.teacher == "true") {
        res.locals.test = "true";
    }
    next();
};

router.use(checkAccountType);


// mysql
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'quizmanager'
});

router.get('/manage/quizzes', function (req, res) {
    console.log("one");
    res.render('managequizzes');
})


module.exports = router;