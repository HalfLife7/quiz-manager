var express = require('express');

var router = express.Router()

// mysql
var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 99,
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'quizmanager'
});

// middleware to redirect users to the homepage if they do not have valid session data
function setActive(req, res, next) {
  res.locals.userInfo = req.session.userInfo;
  res.locals.homepageActive = "active";
  res.locals.quizzesActive = "inactive";
  res.locals.leaderboardActive = "inactive";
  res.locals.achievementsActive = "inactive";
  next();
}
router.use(setActive);

// middleware to pass accountType variable to res.render by default
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

// home page
router.get('/', function (req, res) {
  loginError = req.session.loginError;
  req.session.loginError = "";

  // if no user is logged in, display the login page, possibly with an error
  if (req.session.loggedIn != "true") {

    res.render("loginpage", { errorMessage: loginError });
  }
  // If a user IS logged in, we don't want them to be able to see the login
  // page (you can't be logged in 2x), so redirect them to the users page
  else {
    res.redirect("/homepage");
  }
});

/**
 * route to get homepage
 */
router.get('/homepage', function (req, res) {
  loginError = req.session.loginError;
  req.session.loginError = "";

  unauthorizedAccess = req.session.unauthorizedAccess;
  req.session.unauthorizedAccess = "";

  // if no user is logged in, display the login page, possibly with an error
  if (req.session.loggedIn != "true") {
    res.render("loginpage", { errorMessage: loginError });
  }
  // If a user IS logged in, we don't want them to be able to see the login
  // page (you can't be logged in 2x), so redirect them to the users page
  else {
    const userId = req.session.userInfo.userId;
    // get JS time and convert to mySQL datetime
    // https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime/11150727#11150727
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    pool.query("UPDATE user SET last_date_active = (?) WHERE user_id = (?)", [currentDate, userId], function callback(error, results, fields) {
      if (error != null) {
        console.log(error);
      } else {
        // check if any achievements have been unlocked since last visit to homepage
        pool.query('SELECT * FROM student_achievement WHERE user_id = (?) AND unlocked IS NULL ORDER BY value_goal ASC ', [userId], function callback(error, results, fields) {
          if (error != null) {
            console.log(error);
            return;
          } else {
            studentAchievementProgress = results;
            for (i = 0; i < studentAchievementProgress.length; i++) {
              //console.log(studentAchievementProgress[i]);
              // go through achievements and see if any should be unlocked (if their progress has reached the goal - value_actual >= value_goal)
              if (studentAchievementProgress[i].value_actual >= studentAchievementProgress[i].value_goal) {
                const unlockedAchievement = studentAchievementProgress[i];
                // unlock this achievement!
                pool.query('UPDATE student_achievement SET unlocked = (?), date_unlocked = (?) WHERE user_id = (?) AND achievement_id = (?)', ["true", currentDate, userId, unlockedAchievement.achievement_id], function callback(error, results, fields) {
                  if (error != null) {
                    console.log(error);
                  } else {
                    // after unlocked the achievement, send back information to show the user they unlcoked an achievement
                    pool.query('SELECT * FROM achievement WHERE achievement_id = (?)', [unlockedAchievement.achievement_id], function callback(error, results, fields) {
                      if (error != null) {
                        console.log(error);
                      } else {
                        unlockedAchievementData = results[0];
                        // update achievement points for that user
                        // get all the achievements unlocked for that user
                        pool.query('SELECT student_achievement.*, achievement.star FROM student_achievement JOIN achievement ON student_achievement.achievement_id = achievement.achievement_id WHERE user_id = (?) AND unlocked IS NOT NULL', [userId], function callback(error, results, fields) {
                          if (error != null) {
                            console.log(error);
                            return;
                          } else {
                            allStudentAchievements = results;
                            let totalAchievementPoints = 0;
                            // go through achievements and total up point value
                            for (i = 0; i < allStudentAchievements.length; i++) {
                              totalAchievementPoints += allStudentAchievements[0].point_value;
                            }
                            // update the achievement points for taht user
                            pool.query('UPDATE user SET achievement_points = (?) WHERE user_id = (?)', [totalAchievementPoints, userId], function callback(error, results, fields) {
                              if (error != null) {
                                console.log(error);
                              } else {
                                // do nothing after the update
                              }
                            })
                          }
                        })
                      }
                    });
                  }
                })
              }
            }
            res.render("../views/homepage", { userInfo: req.session.userInfo, unauthorizedAccessMessage: unauthorizedAccess });
          }
        })
      }
    })
  }
});

// export these routes up to routes.js
module.exports = router;