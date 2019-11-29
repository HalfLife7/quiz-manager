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
    database: 'quizmanager',
    multipleStatements: true
});

/**
 * route to create a quiz question
 */
router.get('/manage/quizzes/:quizId/question/create', function (req, res) {
    quizId = req.params.quizId
    pool.query("SELECT * FROM quiz WHERE quiz_id = (?)", quizId, function callback(error, results, fields) {
        const quizData = results[0];
        if (error != null) {
            console.log(error);
        } else {
            res.render('createquestion', { quizData: quizData });
        }
    })

})

/**
 * route for form to submit new quiz question
 */
router.post('/manage/quizzes/:quizId/question/create', function (req, res) {
    const quizId = req.params.quizId;
    console.log(req.body);

    let questionData = req.body;


    var answerText = []
    var answerIsCorrect = []

    if (questionData.questionType == "Multiple Choice") {
        const totalAnswers = 4;
        for (i = 1; i <= totalAnswers; i++) {
            if (questionData.isCorrect == "isCorrect" + i) {
                answerIsCorrect[i - 1] = true;
            } else {
                answerIsCorrect[i - 1] = false;
            }
        }
        answerText[0] = questionData.answerText1;
        answerText[1] = questionData.answerText2;
        answerText[2] = questionData.answerText3;
        answerText[3] = questionData.answerText4;
    } else if (questionData.questionType == "True / False") {
        const totalAnswers = 2;
        for (i = 1; i <= totalAnswers; i++) {
            if (questionData.isCorrect == "isCorrect" + i) {
                answerIsCorrect[i - 1] = true;
            } else {
                answerIsCorrect[i - 1] = false;
            }
        }
        answerText[0] = questionData.answerText1;
        answerText[1] = questionData.answerText2;
    }

    const totalAnswers = answerText.length;
    var answerData = new Array();
    for (var i = 0; i < totalAnswers; i++) {

        for (var j = 0; j < 2; j++) {
            if (j == 0) {
                answerData[i] = new Array(answerText[i]);
            } else {
                answerData[i].push(answerIsCorrect[i]);
            }
        }
    }

    console.log(answerText);
    console.log(answerIsCorrect);
    console.log(answerData);

    // insert question into database
    pool.query("INSERT INTO question (quiz_id, text, type) VALUES (?,?,?)", [quizId, questionData.questionText, questionData.questionType], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            // get the question_id of the newly inserted question
            pool.query("SELECT MAX(question_id) AS question_id FROM question ", function callback(error, results, fields) {
                if (error != null) {
                    console.log(error);
                } else {
                    console.log(results);
                    // add the question id to array of arrays for bulk sql insert
                    questionId = results[0].question_id;
                    for (k = 0; k < totalAnswers; k++) {
                        answerData[k].push(questionId);
                    }
                    console.log(answerData);

                    var sql = "INSERT INTO question_answer (answer_text, is_correct, question_id) VALUES ?"

                    // bulk insert answers into database
                    pool.query(sql, [answerData], function callback(error, results, fields) {
                        if (error != null) {
                            console.log(error);
                        } else {
                            // update the total question count for the quiz
                            pool.query('UPDATE quiz SET total_questions = (SELECT COUNT(quiz_id) FROM question WHERE quiz_id = ?) where quiz_id = (?)', [quizId, quizId], function callback(error, results, fields) {
                                if (error != null) {
                                    console.log(error);
                                } else {
                                    console.log(results);
                                    // redirect to edit quiz page with notification
                                    req.session.notification = { headerText: "Create Question", messageText: "Successfully created question!", buttonText: "Okay" }
                                    res.redirect('/manage/quizzes/' + quizId);
                                }
                            })
                        }
                    });
                }
            })
        }
    })

})

/**
 * route to get specific quiz question
 */
router.get('/manage/quizzes/:quizId/question/:questionId', function (req, res) {
    const quizId = req.params.quizId;
    const questionId = req.params.questionId
    // get question details
    pool.query("SELECT * FROM question where (question_id = ?) AND (quiz_id = ?)", [questionId, quizId], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            // console.log(results[0]);
            const questionData = results[0];

            console.log("BEFORE");
            if (questionData.type == "Multiple Choice") {
                res.locals.multipleChoice = "selected";
            } else if (questionData.type == "True / False") {
                res.locals.trueFalse = "selected";
                res.locals.readOnlyAnswers = "readonly";
            }

            // get answers for that question
            pool.query("SELECT * FROM question_answer where question_id = ?", questionId, function callback(error, results, fields) {
                if (error != null) {
                    console.log(error);
                } else {
                    // console.log(results);
                    let questionAnswersData = results;

                    // add incrementing label
                    for (i = 0; i < questionAnswersData.length; i++) {
                        questionAnswersData[i]["questionNumber"] = i + 1;
                    }

                    // convert is_correct to correct/incorrect instead of 0 and 1 to mark which radio button to have preselected
                    for (i = 0; i < questionAnswersData.length; i++) {
                        if (questionAnswersData[i]["is_correct"] == 1) {
                            questionAnswersData[i]["is_correct"] = "correct"
                        } else {
                            questionAnswersData[i]["is_correct"] = "incorrect"
                        }
                    }

                    res.render('editquizquestion', { questionData: questionData, questionAnswersData: questionAnswersData});
                }
            })

        }
    })
})

/**
 * route to update specific quiz question
 */
router.post('/manage/quizzes/:quizId/question/:questionId/edit', function (req, res) {
    const quizId = req.params.quizId
    const questionId = req.params.questionId

    console.log(req.body);

    let questionData = req.body;


    var answerText = []
    var answerIsCorrect = []
    var questionAnswerId = []

    if (questionData.questionType == "Multiple Choice") {
        const totalAnswers = 4;
        for (i = 1; i <= totalAnswers; i++) {
            if (questionData.isCorrect == "isCorrect" + i) {
                answerIsCorrect[i - 1] = true;
            } else {
                answerIsCorrect[i - 1] = false;
            }
        }
        answerText[0] = questionData.answerText1;
        answerText[1] = questionData.answerText2;
        answerText[2] = questionData.answerText3;
        answerText[3] = questionData.answerText4;

        questionAnswerId[0] = questionData.answerId1;
        questionAnswerId[1] = questionData.answerId2;
        questionAnswerId[2] = questionData.answerId3;
        questionAnswerId[3] = questionData.answerId4;
    } else if (questionData.questionType == "True / False") {
        const totalAnswers = 2;
        for (i = 1; i <= totalAnswers; i++) {
            if (questionData.isCorrect == "isCorrect" + i) {
                answerIsCorrect[i - 1] = true;
            } else {
                answerIsCorrect[i - 1] = false;
            }
        }
        answerText[0] = questionData.answerText1;
        answerText[1] = questionData.answerText2;

        questionAnswerId[0] = questionData.answerId1;
        questionAnswerId[1] = questionData.answerId2;
    }

    // build array to contain all answers, with their text, isCorrect, questionAnswerId and questionId
    const totalAnswers = answerText.length;
    var answerData = new Array();
    for (var i = 0; i < totalAnswers; i++) {
        for (var j = 0; j < 4; j++) {
            if (j == 0) {
                answerData[i] = new Array(answerText[i]);
            } if (j == 1) {
                answerData[i].push(answerIsCorrect[i]);
            } else if (j == 2) {
                answerData[i].push(questionAnswerId[i]);
            } else if (j == 3) {
                answerData[i].push(questionId);
            }
        }
    }

    // console.log(answerText);
    // console.log(answerIsCorrect);
    // console.log(questionAnswerId);
    console.log(answerData);

    // update question in database
    pool.query("UPDATE question SET text = ? WHERE question_id = ? AND quiz_id = ?", [questionData.questionText, questionId, quizId], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            // build query string to complete bulk update
            let queries = '';
            answerData.forEach(function (item) {
                queries += mysql.format("UPDATE question_answer SET answer_text = ?, is_correct = ? WHERE question_answer_id = ? AND question_id = ?; ", item)
            });

            // bulk insert answers into database
            pool.query(queries, [answerData], function callback(error, results, fields) {
                if (error != null) {
                    console.log(error);
                } else {
                    //console.log(results);

                    // redirect to edit quiz page with notification
                    req.session.notification = { headerText: "Update Question", messageText: "Successfully updated question!", buttonText: "Okay" }
                    res.redirect('/manage/quizzes/' + quizId);
                }
            });
        }
    })
})

/**
 * route to delete quiz question
 */
router.delete('/manage/quizzes/:quizId/question/:questionId/delete', function (req, res) {
    const quizId = req.params.quizId
    const questionId = req.params.questionId
    console.log(req.params.id);
    // delete answers tied to that question first
    pool.query("DELETE FROM question_answer WHERE question_id = (?)", [questionId], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            console.log(results);
            // then delete the question
            pool.query("DELETE FROM question WHERE question_id = (?)", [questionId], function callback(error, results, fields) {
                if (error != null) {
                    console.log(error);
                } else {
                    // update the total question count for the quiz
                    pool.query('UPDATE quiz SET total_questions = (SELECT COUNT(quiz_id) FROM question WHERE quiz_id = ?) where quiz_id = (?)', [quizId, quizId], function callback(error, results, fields) {
                        if (error != null) {
                            console.log(error);
                        } else {
                            console.log(results);
                            // send response back to page for AJAX request to show success modal
                            res.send("success");
                        }
                    })
                }
            })
        }
    })
})

// export these routes up to routes.js
module.exports = router;