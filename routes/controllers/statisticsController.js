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
        res.locals.statisticsActive = "active";
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
 * route for user statistics
 */
router.get('/userstatistics', function (req, res) {
    pool.query('SELECT user.user_id, user.first_name, user.last_name, user.nickname, user.achievement_points, user.last_date_active, student_grade.average_grade from user LEFT OUTER JOIN (SELECT user_id, ROUND(AVG(percent_value),2) AS average_grade FROM student_grade GROUP BY user_id) student_grade ON user.user_id = student_grade.user_id WHERE account_type = (?)', ["student"], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
            return;
        } else {
            userData = results;
            console.log(userData);
            res.render('userstatistics', { userData: userData });
        }
    })
})

/**
 * route for quiz statistics
 */
router.get('/quizstatistics', function (req, res) {
    pool.query('SELECT quiz.*, subject.name AS subject_name FROM quiz JOIN subject ON quiz.subject_id = subject.subject_id', function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
            return;
        } else {
            quizData = results;
            console.log(quizData);
            res.render('quizstatistics', { quizData: quizData });
        }
    })
})

// export these routes up to routes.js
module.exports = router;