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
        res.locals.manageQuizzesActive = "active";
        res.locals.statistics = "inactive";
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
var pool  = mysql.createPool({
  connectionLimit : 99,
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'quizmanager'
});

/**
 * route to get all quizzes
 */
router.get('/manage/quizzes', function (req, res) {
    const notification = req.session.notification;
    req.session.notification = "";

    pool.query("SELECT quiz.*, subject.name as subject_name FROM quiz JOIN subject ON quiz.subject_id = subject.subject_id", function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            const allQuizData = results;
            res.render('managequizzes', { allQuizData: allQuizData, notification: notification });
        }
    })
})

/**
 * route to create a new quiz
 */
router.get('/manage/quizzes/create', function (req, res) {
    // get all subjects to fill field
    pool.query("SELECT * FROM subject", function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            const subjectData = results;
            res.render('createquiz', { subjectData: subjectData });
        }
    })
})

/**
 * route for form to create a new quiz
 */
router.post('/manage/quizzes/create', function (req, res) {
    // console.log(req.body);
    pool.query("INSERT INTO quiz (name, description, subject_id, class, total_questions) VALUES (?,?,(SELECT subject_id FROM subject WHERE name = ?),?, 0)", [req.body.name, req.body.description, req.body.subject, req.body.class], function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            req.session.notification = { headerText: "Create Quiz", messageText: "Successfully created quiz!", buttonText: "Okay" }
            res.redirect('/manage/quizzes');
        }
    })
})

/**
 * route to get details of a specific quiz
 */
router.get('/manage/quizzes/:id', function (req, res) {
    const notification = req.session.notification;
    req.session.notification = "";

    const quizId = req.params.id;
    pool.query("SELECT quiz.*, subject.name AS subject_name FROM quiz JOIN subject ON quiz.subject_id = subject.subject_id WHERE quiz_id = ?", quizId, function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            // console.log(results[0]);
            const quizData = results[0];

            pool.query("SELECT * FROM question where quiz_id = ?", quizId, function callback(error, results, fields) {
                if (error != null) {
                    console.error(error);
                    return;
                } else {
                    // console.log(results);
                    const quizQuestionsData = results;

                    pool.query("SELECT * FROM subject", function callback(error, results, fields) {
                        if (error != null) {
                            console.error(error);
                            return;
                        } else {
                            // https://stackoverflow.com/questions/44932502/change-elements-positions-in-an-array-and-shift-elements-in-between
                            function insertAndShift(arr, from, to) {
                                let cutOut = arr.splice(from, 1) [0]; // cut the element at index 'from'
                                arr.splice(to, 0, cutOut);            // insert it at index 'to'
                            }
                            
                            let subjectData = results;

                            // change order to set correct subject data as first item in the dropdown list
                            for (i = subjectData.length - 1 ; i > 0; i--) {

                                if (subjectData[i].name == quizData.subject_name) {
                                    insertAndShift(subjectData, i, 0);
                                }
                            }
                            res.render('editquiz', { quizData: quizData, quizQuestionsData: quizQuestionsData, notification: notification, subjectData: subjectData });
                        }
                    })


                }
            })
        }
    })
})

/**
 * route for form to update details of a specific quiz
 */
router.post('/manage/quizzes/:id/edit', function (req, res) {
    // console.log(req.body);
    // console.log(req.params);
    const quizId = req.params.id;
    pool.query("UPDATE quiz SET name = (?), description = (?), class = (?), total_questions = (SELECT COUNT(quiz_id) FROM question WHERE quiz_id = ?) WHERE quiz_id = (?)", [req.body.name, req.body.description, req.body.class, quizId, quizId], function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            // console.log(results[0]);
            // reload the page with the updated quiz
            req.session.notification = { headerText: "Edit Quiz", messageText: "Successfully updated quiz!", buttonText: "Okay" }
            res.redirect('/manage/quizzes');
        }
    })
})

/**
 * route to delete a specific quiz
 */
router.delete('/manage/quizzes/:id/delete', function (req,res) {
    const quizId = req.params.id
    console.log(req.params.id);
    pool.query("DELETE FROM quiz WHERE quiz_id = (?)", [quizId], function callback(error, results, fields) {
        if (error != null) {
            console.error(error);
            return;
        } else {
            // console.log(results);
            res.send("success");
        }
    })
})

// export these routes up to routes.js
module.exports = router;