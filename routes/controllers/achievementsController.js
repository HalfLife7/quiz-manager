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
        res.locals.quizzesActive = "inactive";
        res.locals.leaderboardActive = "inactive";
        res.locals.achievementsActive = "active";
        next();
    }
}
router.use(checkLogin);

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

router.get('/achievements', function (req, res) {
    pool.query('SELECT student_achievement.*, achievement.* FROM student_achievement JOIN achievement ON student_achievement.achievement_id =achievement.achievement_id WHERE user_id = (?)', [req.session.userInfo.userId], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
            return;
        } else {
            const achievementData = results;
            console.log(achievementData);
            res.render('achievements', { achievementData: achievementData });
        }
    })

})

module.exports = router;
