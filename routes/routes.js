var express = require('express')

var router = express.Router();

router.use("/", require("./controllers/loginController.js"));
router.use("/", require("./controllers/homeController.js"));
router.use("/", require("./controllers/quizController.js"));
router.use("/", require("./controllers/accountController.js"));
router.use("/", require("./controllers/leaderboardController.js"));
router.use("/", require("./controllers/achievementsController.js"));
router.use("/", require("./controllers/manageQuizController.js"));
router.use("/", require("./controllers/manageQuizQuestionController.js"));


// DO NOT FORGET TO ADD THIS TO NEW CONTROLLERS
module.exports = router;



