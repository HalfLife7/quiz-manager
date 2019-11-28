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
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'quizmanager'
});

router.get('/quizzes/subjects', function (req, res) {
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

router.get('/quizzes/subjects/:subject', function (req, res) {
    console.log(req.params);
    var subject = req.params.subject;
    // get all subjects
    connection.query("SELECT * FROM quiz WHERE subject_id = (SELECT subject_id FROM subject where name = ?)", subject, function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            console.log(results);
            var quizzes = results

            res.render('quizzes', { quizData: quizzes, subjectData: subject })
        }
    });
})

router.get('/subjects/quizzes/:quizId/test', function (req, res) {
    console.log(req.session.userInfo);
    const quizId = req.params.quizId
    // get quiz data
    connection.query("SELECT * FROM quiz WHERE quiz_id = ?", quizId, function callback(error, results, fields) {
        if (error != null) {
            //console.log(error);
        } else {
            const quizData = results[0]
            //console.log(quizData);


            connection.query("SELECT * FROM question WHERE quiz_id = ?", quizId, function callback(error, results, fields) {
                if (error != null) {
                    //console.log(error);
                } else {
                    let questionData = results;
                    //console.log(questionData);

                    for (i = 0; i < questionData.length; i++) {
                        questionData[i]["questionNumber"] = i + 1;
                    }


                    res.render('doquiz', { quizData: quizData, quizQuestionsData: questionData });

                    // // get all questions
                    // var query = "SELECT * FROM question_answer WHERE question_id in (?)"
                    // var queryData = [questionNumbers];

                    // connection.query(query, queryData, function callback(error,results, fields) {
                    //     if (error != null) {
                    //         console.log(error);
                    //     } else {
                    //         const answerData = results;
                    //         console.log(answerData);
                    //         console.log("before");
                    //         console.log(questionData);
                    //         for (i = 0 ; i < answerData.length; i++) {
                    //             for (j = 0; j < questionNumbers.length; j++) {
                    //                 if (answerData[i].question_id == questionNumbers[j]) {
                    //                     questionData[j].push(answerData[i]);
                    //                 }
                    //             }
                    //         }
                    //         console.log("after");
                    //         console.log(questionData);
                    //     }
                    // })
                }
            });
        }
    });
})

router.get('/subjects/quizzes/:quizId/test/:questionId', function (req, res) {
    const quizId = req.params.quizId;
    const questionId = req.params.questionId;
    // get answers
    connection.query('SELECT question_answer_id, answer_text FROM question_answer WHERE question_id = (?)', [questionId], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            const answerData = results;

            // return answerData
            res.send(JSON.stringify(answerData));
        }
    })
});

router.post('/subjects/quizzes/:quizId/test/submitquiz', function (req, res) {
    questionNumbers = [1, 2, 3, 26]
    // get all questions
    var query = "SELECT * FROM question_answer WHERE question_id in (?) AND is_correct = true"
    var queryData = [questionNumbers];

    connection.query(query, queryData, function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            const answerData = results;
            console.log(answerData);

            res.send(answerData);
            //console.log(questionData);
            // for (i = 0; i < answerData.length; i++) {
            //     for (j = 0; j < questionNumbers.length; j++) {
            //         if (answerData[i].question_id == questionNumbers[j]) {
            //             questionData[j].push(answerData[i]);
            //         }
            //     }
            // }
            // console.log("after");
            // console.log(questionData);
        }
    })


})

router.post('/subjects/quizzes/:quizId/test/updategrades', function (req, res) {
    const totalCorrect = req.body.totalCorrect;
    const totalQuestions = req.body.totalQuestions;
    const userId = req.body.userId;
    const quizId = req.params.quizId;
    console.log(totalCorrect);
    console.log(userId);

    // update student grades
    connection.query("INSERT INTO student_grade (user_id, quiz_id, grade_value, percent_value) VALUES (?,?,?,?)", [userId, quizId, totalCorrect, ((totalCorrect / totalQuestions) * 100)], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
            return;
        } else {
            // update quiz statistics
            connection.query("UPDATE quiz SET average = (SELECT AVG(grade_value) FROM student_grade WHERE quiz_id = (?)), total_attempts = (total_attempts + 1)", [quizId], function callback(error, results, fields) {
                if (error != null) {
                    console.log(error);
                    return;
                } else {
                    // update student quiz statistics
                    connection.query("INSERT INTO student_quiz_statistics (user_id, quiz_id, subject_id, total_attempts, max_grade, min_grade, average_grade) VALUES(?,?,(SELECT subject_id FROM quiz WHERE quiz_id = ?),(SELECT total_attempts FROM quiz WHERE quiz_id = (?)),(SELECT MAX(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?)),(SELECT MIN(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?)),(SELECT AVG(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?))) ON DUPLICATE KEY UPDATE subject_id = (SELECT subject_id FROM quiz WHERE quiz_id = ?), total_attempts = (total_attempts + 1), max_grade = (SELECT MAX(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?)), min_grade = (SELECT MIN(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?)), average_grade = (SELECT AVG(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?))", [userId, quizId, quizId, quizId, userId, quizId, userId, quizId, userId, quizId, quizId, userId, quizId, userId, quizId, userId, quizId], function callback(error, results, fields) {
                        if (error != null) {
                            console.log(error);
                            return;
                        } else {
                            // check for achievement unlock
                            connection.query('SELECT * FROM student_quiz_statistics WHERE user_id = (?)', [userId], function callback(error, results, fields) {
                                if (error != null) {
                                    console.log(error);
                                    return;
                                } else {
                                    
                                }
                            })
                            res.end("Successfully updated grades!");
                        }
                    });
                }
            })
        }
    })
})

module.exports = router;