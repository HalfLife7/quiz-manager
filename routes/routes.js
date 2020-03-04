var express = require('express')

var router = express.Router();

/**
 * router manager, loads each controller in seperate files to keep things organized
 */

router.use("/", require("./controllers/loginController.js"));
router.use("/", require("./controllers/homeController.js"));
router.use("/", require("./controllers/quizController.js"));
router.use("/", require("./controllers/accountController.js"));
router.use("/", require("./controllers/leaderboardController.js"));
router.use("/", require("./controllers/achievementsController.js"));
router.use("/", require("./controllers/manageQuizController.js"));
router.use("/", require("./controllers/manageQuizQuestionController.js"));
router.use("/", require("./controllers/statisticsController.js"));


// export these routes up to server.js
module.exports = router;



