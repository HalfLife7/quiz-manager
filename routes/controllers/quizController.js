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
        res.locals.quizzesActive = "active";
        next();
    }

}
router.use(checkLogin);

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

router.get('/subjects', function (req, res) {
    // get all subjects
    connection.query("SELECT * FROM subject", function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            var subjects = results

            res.render('subjects', { subjectData: subjects })
        }
    });
})

router.get('/subjects/:subject', function (req, res) {
    console.log(req.params);
    var subject = req.params.subject;
    // get all subjects
    connection.query("SELECT * FROM quiz WHERE subject_id = (SELECT subject_id FROM subject where name = ?)", subject, function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            console.log(results);
            var quizzes = results

            res.render('allquizzesonesubject', { allQuizzes: quizzes, subject: subject})
        }
    });
})

router.get('/subjects/:subject/add', function (req, res) {
    console.log(req.params);
    var subject = req.params.subject;
    // get all subjects
    connection.query("SELECT * FROM quiz WHERE subject_id = (SELECT subject_id FROM subject where name = ?)", subject, function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            console.log(results);
            var quizzes = results

            res.render('allquizzesonesubject', { allQuizzes: quizzes, subject: subject})
        }
    });
})



module.exports = router;