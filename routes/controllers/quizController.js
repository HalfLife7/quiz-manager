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

/**
 * route to get all subjects
 */
router.get('/quizzes/subjects', function (req, res) {
    // get all subjects
    pool.query("SELECT * FROM subject", function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            var subjects = results

            res.render('subjects', { subjectData: subjects })
        }
    });
})

/**
 * route to get all quizzes for a specific subject
 */
router.get('/quizzes/subjects/:subject', function (req, res) {
    console.log(req.params);
    var subject = req.params.subject;
    // get all subjects
    pool.query("SELECT * FROM quiz WHERE subject_id = (SELECT subject_id FROM subject where name = ?)", subject, function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            console.log(results);
            var quizzes = results

            res.render('quizzes', { quizData: quizzes, subjectData: subject })
        }
    });
})

/**
 * route to get specific quiz for testing
 */
router.get('/subjects/quizzes/:quizId/test', function (req, res) {
    console.log(req.session.userInfo);
    const quizId = req.params.quizId
    // get quiz data
    pool.query("SELECT * FROM quiz WHERE quiz_id = ?", quizId, function callback(error, results, fields) {
        if (error != null) {
            //console.log(error);
        } else {
            const quizData = results[0]
            //console.log(quizData);


            pool.query("SELECT * FROM question WHERE quiz_id = ?", quizId, function callback(error, results, fields) {
                if (error != null) {
                    //console.log(error);
                } else {
                    let questionData = results;
                    //console.log(questionData);

                    for (i = 0; i < questionData.length; i++) {
                        questionData[i]["questionNumber"] = i + 1;
                    }
                    res.render('doquiz', { quizData: quizData, quizQuestionsData: questionData });
                }
            });
        }
    });
})

/**
 * route to get answers to populate quiz page
 */
router.get('/subjects/quizzes/:quizId/test/:questionId', function (req, res) {
    const quizId = req.params.quizId;
    const questionId = req.params.questionId;
    // get answers
    pool.query('SELECT question_answer_id, answer_text FROM question_answer WHERE question_id = (?)', [questionId], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            const answerData = results;

            // return answerData
            res.send(JSON.stringify(answerData));
        }
    })
});

/**
 * route to get answer data for each quiz question - used by AJAX call to mark answers
 */
router.post('/subjects/quizzes/:quizId/test/submitquiz', function (req, res) {

    // store JSON values into array (containing the question IDs)
    const questionIds = Object.values(req.body);

    // get all questions
    var query = "SELECT * FROM question_answer WHERE question_id in (?) AND is_correct = true"
    // get questions with question IDs that were on the quiz
    var queryData = [questionIds];

    pool.query(query, queryData, function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
        } else {
            const answerData = results;
            console.log(answerData);
            // send the answers
            res.send(answerData);
        }
    })
})

/**
 * route for form to update grades after marking has complete on quiz page
 */
router.post('/subjects/quizzes/:quizId/test/updategrades', function (req, res) {
    const totalCorrect = req.body.totalCorrect;
    const totalQuestions = req.body.totalQuestions;
    const userId = req.body.userId;
    const quizId = req.params.quizId;
    console.log(totalCorrect);
    console.log(userId);

    // update student grades
    pool.query("INSERT INTO student_grade (user_id, quiz_id, grade_value, percent_value) VALUES (?,?,?,?)", [userId, quizId, totalCorrect, ((totalCorrect / totalQuestions) * 100)], function callback(error, results, fields) {
        if (error != null) {
            console.log(error);
            return;
        } else {
            // update quiz statistics
            pool.query("UPDATE quiz SET average = (SELECT AVG(grade_value) FROM student_grade WHERE quiz_id = (?)), total_attempts = (total_attempts + 1) WHERE quiz_id = (?)", [quizId, quizId], function callback(error, results, fields) {
                if (error != null) {
                    console.log(error);
                    return;
                } else {
                    // insert new entry into student quiz stats (if its their first time progressing on a set of achievements)
                    // OTHERWISE update the existing entries
                    pool.query("INSERT INTO student_quiz_statistics (user_id, quiz_id, subject_id, total_attempts, max_grade, min_grade, average_grade) VALUES(?,?,(SELECT subject_id FROM quiz WHERE quiz_id = ?),(SELECT total_attempts FROM quiz WHERE quiz_id = (?)),(SELECT MAX(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?)),(SELECT MIN(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?)),(SELECT AVG(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?))) ON DUPLICATE KEY UPDATE subject_id = (SELECT subject_id FROM quiz WHERE quiz_id = ?), total_attempts = (total_attempts + 1), max_grade = (SELECT MAX(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?)), min_grade = (SELECT MIN(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?)), average_grade = (SELECT AVG(percent_value) FROM student_grade WHERE user_id = (?) AND quiz_id = (?))", [userId, quizId, quizId, quizId, userId, quizId, userId, quizId, userId, quizId, quizId, userId, quizId, userId, quizId, userId, quizId], function callback(error, results, fields) {
                        if (error != null) {
                            console.log(error);
                            return;
                        } else {
                            // get subject_id of the quiz that was just submitted
                            pool.query('SELECT subject_id from quiz WHERE quiz_id = (?)', [quizId], function callback(error, results, fields) {
                                if (error != null) {
                                    console.log(error);
                                    return;
                                } else {
                                    const quizSubjectId = results[0].subject_id;
                                    // check for achievement unlock
                                    pool.query('SELECT student_quiz_statistics.*, subject.*, (SELECT subject_id FROM quiz WHERE quiz_id = (?)) AS tracked_subject_id FROM student_quiz_statistics JOIN subject ON student_quiz_statistics.subject_id = subject.subject_id WHERE user_id = (?) ', [quizId, userId], function callback(error, results, fields) {
                                        if (error != null) {
                                            console.log(error);
                                            return;
                                        } else {
                                            console.log(results);
                                            let subjectTotalAttempts = 0;
                                            // tally up total_attempts from all quizzes of the same subject_id (of the quiz that was just submitted)
                                            for (i = 0; i < results.length; i++) {
                                                if (results[i].tracked_subject_id == quizSubjectId) {
                                                    subjectTotalAttempts += 1;
                                                }
                                            }
                                            console.log("total attempts " + subjectTotalAttempts);
                                            console.log("subject id " + quizSubjectId);
                                            
                                            // #2 - query achievements and get the achievements related to this subject
                                            pool.query('SELECT * FROM achievement WHERE subject_id = (?)', [quizSubjectId], function callback(error, results, fields) {
                                                if (error != null) {
                                                    console.log(error);
                                                    return;
                                                } else {
                                                    const relatedAchievements = results;
                                                    console.log(relatedAchievements);
                                                    for (i = 0; i < relatedAchievements.length; i++) {
                                                        if (relatedAchievements[i].subject_id == quizSubjectId) {
                                                            const achievementId = relatedAchievements[i].achievement_id;
                                                            const achievementValueGoal = relatedAchievements[i].value_goal;
                                                            // go through achievements related to the subject we just completed
                                                            pool.query('SELECT * FROM student_achievement WHERE achievement_id = (?) and user_id = (?)', [achievementId, userId], function callback(error, results, fields) {
                                                                if (error != null) {
                                                                    console.log(error);
                                                                    return;
                                                                } else {
                                                                    // if there is no entry for this achievement yet, add it
                                                                    console.log(results);
                                                                    if (results.length == 0) {
                                                                        pool.query('INSERT INTO student_achievement (user_id, achievement_id, value_actual, value_goal) VALUES(?,?,?,?)', [userId, achievementId, 1, achievementValueGoal], function callback(error, results, fields) {
                                                                            if (error != null) {
                                                                                console.log(error);
                                                                                return;
                                                                            } else {
                                                                                // do nothing after update, let the loop continue to update any other related acheivements
                                                                            }
                                                                        });
                                                                    } else {
                                                                        const actualAchievement = results[0];
                                                                        console.log(actualAchievement);
                                                                        // if there is already an entry for this achievement, update it IF it isnt already unlocked
                                                                        if (actualAchievement.unlocked != null) {
                                                                            // do nothing if its already unlocked (will be null if it isnt unlocked)
                                                                        } else {
                                                                            // update the progress if not unlocked yet
                                                                            // UPDATE quiz SET average = (SELECT AVG(grade_value) FROM student_grade WHERE quiz_id = (?)), total_attempts = (total_attempts + 1)", [quizId],
                                                                            pool.query('UPDATE student_achievement SET value_actual = (value_actual + 1) WHERE achievement_id = (?) AND user_id = (?)', [achievementId, userId], function callback(error, results, fields) {
                                                                                if (error != null) {
                                                                                    console.log(error);
                                                                                    return;
                                                                                } else {
                                                                                    // do nothing after update, let the loop continue to update any other related acheivements
                                                                                }
                                                                            });
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }
                                                    // if no achievements were unlocked, send the response and end it
                                                    res.send("Successfully updated grades and related achievements!");
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    });
                }
            })
        }
    })
})

// export these routes up to routes.js
module.exports = router;