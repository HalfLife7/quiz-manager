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
        res.locals.leaderboardActive = "active";
        res.locals.achievementsActive = "inactive";
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

/**
 * route to get leaderboard
 */
router.get('/leaderboard', function (req, res) {
    pool.query('SELECT first_name, last_name, nickname, leaderboard_opt_in, leaderboard_use_nickname, achievement_points, account_type, profile_picture_path FROM user WHERE account_type = (?) ORDER BY achievement_points DESC', ["student", req.session.userInfo.userId], function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            let userData = results;
            // loop backwards since array is reindexed after splicing leading to skipped elements
            for (i = userData.length - 1; i >= 0; i--) {
                // console.log(userData[i]);                
                if (userData[i].leaderboard_opt_in == "true") {
                    // determine whether or not they want to use a nickname
                    if (userData[i].leaderboard_use_nickname == "true" && userData[i].nickname != null) {
                        userData[i].displayName = userData[i].nickname;
                    } else {
                        let firstName = userData[i].first_name
                        let lastName = userData[i].last_name;
                        const displayName = firstName + " " + lastName;
                        userData[i].displayName = displayName;
                    }
                } else if (userData[i].leaderboard_opt_in == "false") {
                    // remove them from the list if they are not opt in
                    var index = userData.indexOf(userData[i]);
                    if (index > -1) {
                        userData.splice(index, 1);
                    }
                }
            }
            for (i = 0; i < userData.length; i++) {
                userData[i].rank = (i + 1);
            }

            console.log(userData);
            res.render('leaderboard', { userData: userData });
        }
    })
})

// router.get('/leaderboard/images', function (req, res) {
//     pool.query('SELECT profile_picture_path FROM user WHERE account_type = (?) AND  leaderboard_opt_in = (?) ORDER BY achievement_points DESC', ["student", "true"], function callback(error, results, fields) {
//         if (error != null) {
//             console.error(error);
//             return;
//         } else {
//             const userProfileImages = results;

//             // for (i = 0; i < userProfileImages.length; i++) {
//             //     userProfileImages[i]["profilePictureNumber"] = i + 1;
//             // }

//             res.send(JSON.stringify(userProfileImages));
//         }
//     })
// })

// export these routes up to routes.js
module.exports = router;
