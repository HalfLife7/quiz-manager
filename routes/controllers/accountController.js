var express = require('express');
var passwordHash = require('password-hash');

var router = express.Router()

// middleware to redirect users to the homepage if they do not have valid session data
function checkLogin(req, res, next) {
    if (!req.session.loggedIn) {
        req.session.loginError = "You need to be logged in!";
        res.redirect('/');
    } else {
        res.locals.userInfo = req.session.userInfo;
        res.locals.homepageActive = "active";
        res.locals.quizzesActive = "inactive";
        res.locals.leaderboardActive = "inactive";
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

var multer = require('multer');
var path = require('path')

/**
 * route for user profile
 */
router.get('/account/profile/:userId', function (req, res) {
    const notification = req.session.notification;
    req.session.notification = "";

    const userId = req.params.userId;
    pool.query('SELECT * FROM user WHERE user_id = (?)', userId, function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            const userData = results[0];
            res.render('userprofile', { userData: userData, notification: notification });
        }
    })
})

// set storage engine
const storage = multer.diskStorage({
    // set folder for file uploads
    destination: './public/images/profilepictures',
    // set name for file upload
    filename: function (req, file, callback) {
        callback(null, file.fieldname.toLowerCase() + '-' + Date.now() + path.extname(file.originalname).toLowerCase());
    }
});

// https://www.youtube.com/watch?v=9Qzmri1WaaE
// init upload variable, set file limit size to 1mb
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: function (req, file, callback) {
        checkFileType(file, callback);
    }
}).single('profileImage');

// check file type
function checkFileType(file, callback) {
    // allowed extensions
    const fileTypes = /jpeg|jpg|png|gif/;

    // check extension
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());

    // check mime type
    const mimeType = fileTypes.test(file.mimetype);

    if (mimeType && extName) {
        return callback(null, true);
    } else {
        callback({ message: "Invalid file type, images only! - jpeg, jpg, png and gif" });
    }
}

/**
 * route form form to update user profile
 */
router.post('/account/profile/:userId/update', function (req, res) {
    const userId = req.params.userId;
    upload(req, res, function (err) {
        if (err != null) {
            console.log(err);
            req.session.notification = { headerText: "Update Profile", messageText: err.message, buttonText: "Okay", type: "btn-danger" }
            return res.redirect('/account/profile/' + userId);
        } else {
            // check if no image was uploaded
            if (req.file == undefined) {
                console.log(req.body);
                pool.query("UPDATE user SET nickname = (?), program = (?), school = (?) WHERE user_id = (?)", [req.body.nickname, req.body.program, req.body.school, userId], function callback(error, results, fields) {
                    if (error != null) {
                        console.error(error);
                        return;
                    } else {
                        // still update the form if other fields were changed
                        req.session.notification = { headerText: "Update Profile", messageText: "Successfully updated profile!", buttonText: "Okay", type: "btn-success" }
                        return res.redirect('/account/profile/' + userId);
                    }
                })
            } else {
                console.log(req.body);
                console.log(req.file);
                const profileImagePath = "/images/profilepictures/" + req.file.filename;
                // req.file.filename
                pool.query("UPDATE user SET nickname = (?), program = (?), school = (?), profile_picture_path = (?) WHERE user_id = (?)", [req.body.nickname, req.body.program, req.body.school, profileImagePath, userId], function callback(error, results, fields) {
                    if (error != null) {
                        console.error(error);
                        return;
                    } else {
                        req.session.userInfo.profilePicturePath = profileImagePath;
                        req.session.notification = { headerText: "Update Profile", messageText: "Successfully updated profile!", buttonText: "Okay", type: "btn-success" }
                        return res.redirect('/account/profile/' + userId);
                    }
                })


            }

        }
    });
})

/**
 * route to get user settings
 */
router.get('/account/settings/:userId', function (req, res) {
    const notification = req.session.notification;
    req.session.notification = "";

    const userId = req.params.userId;
    pool.query('SELECT * FROM user WHERE user_id = (?)', userId, function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            const userData = results[0];

            // check if user is already opted in or already using nickname
            if (userData.leaderboard_opt_in == "true") {
                res.locals.leaderboardOptIn = "checked";
            }
            if (userData.leaderboard_use_nickname == "true") {
                res.locals.leaderboardUseNickname = "checked";
            }
            res.render('usersettings', { userData: userData, notification: notification });
        }
    })
})

/**
 * route for form to update user settings
 */
router.post('/account/settings/:userId/updatesettings', function (req, res) {
    console.log(req.body);
    const userId = req.params.userId;
    let optIn;
    let useNickname;
    if (req.body.optIn == "on") {
        optIn = "true";
    } else {
        optIn = "false";
    }

    if (req.body.useNickname == "on") {
        useNickname = "true";
    } else {
        useNickname = "false";
    }

    pool.query("UPDATE user SET leaderboard_opt_in = (?), leaderboard_use_nickname = (?) WHERE user_id = (?)", [optIn, useNickname, userId], function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            req.session.notification = { headerText: "Update Settings", messageText: "Successfully updated user settings!", buttonText: "Okay", type: "btn-success" }
            res.redirect('/account/settings/' + userId);
        }
    });
})

/**
 * route for form to update user password
 */
router.post('/account/settings/:userId/updatepassword', function (req, res) {
    const userId = req.params.userId;
    var currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    console.log(req.body);
    // check if current password is correct
    pool.query("SELECT * FROM user WHERE user_id = (?)", [userId], function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            var hashedPassword = results[0].password;

            if (passwordHash.verify(currentPassword, hashedPassword) == true) {
                // password is correct - check if the new passwords match
                if (newPassword == confirmPassword) {
                    // hash the password
                    const hashedNewPassword = passwordHash.generate(newPassword);

                    // update the password
                    pool.query('UPDATE user SET password = (?) WHERE user_id = (?)', [hashedNewPassword, userId], function callback(error, results, fields) {
                        if (error != null) {
                            console.error(error);
                            return;
                        } else {
                            req.session.notification = { headerText: "Update Password", messageText: "Successfully updated password!", buttonText: "Okay", type: "btn-success" }
                            res.redirect('/account/settings/' + userId);
                        }
                    })
                } else {
                    // new passwords to not match
                    req.session.notification = { headerText: "Update Password", messageText: "Passwords do not match!", buttonText: "Okay", type: "btn-danger" }
                    res.redirect('/account/settings/' + userId);
                }
            } else {
                // password is incorrect
                req.session.notification = { headerText: "Update Password", messageText: "Password is incorrect!", buttonText: "Okay", type: "btn-danger" }
                res.redirect('/account/settings/' + userId);
            }
        }
    });
})

// export these routes up to routes.js
module.exports = router;
