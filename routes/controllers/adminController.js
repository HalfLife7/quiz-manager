var express = require('express');

var router = express.Router()

// middleware to redirect users to the homepage if they do not have valid session data
function checkLogin(req, res, next) {
    if (!req.session.loggedIn) {
        req.session.loginError = "You need to be logged in!";
        res.redirect('/');
    } else {
        res.locals.userInfo = req.session.userInfo;
        res.locals.homepageActive = "inactive";
        res.locals.leaderboardActive = "inactive";
        res.locals.manageQuizzesActive = "inactive";
        res.locals.statisticsActive = "inactive";
        res.locals.adminPanelActive = "active";
        next();
    }

}
router.use(checkLogin);

// middleware to check if valid account type, if not send them back to the homepage
function unauthorizedAccess(req, res, next) {
    if (req.session.student) {
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
        res.locals.admin = "true";
    } else if (req.session.student == "true") {
        res.locals.student = "true";
    } else if (req.session.teacher == "true") {
        res.locals.teacher = "true";
    }
    next();
};

router.use(checkAccountType);


// mysql
var mysql = require('mysql');
var pool = mysql.createPool({
    connectionLimit: 99,
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'quizmanager'
});

/**
 * route for admin panel
 */
router.get('/userstatistics', function (req, res) {
    pool.query('SELECT user_id, email, first_name, last_name, account_type, last_date_active FROM user', function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            userData = results;
            console.log(userData);
            res.render('adminpanel', { userData: userData });
        }
    })
})

// export these routes up to routes.js
module.exports = router;