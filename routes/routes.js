var express = require('express')

var router = express.Router();

router.use("/", require("./controllers/accountController.js"));
router.use("/", require("./controllers/homeController.js"));
router.use("/", require("./controllers/quizController.js"));
router.use("/", require("./controllers/manageQuizController.js"));

module.exports = router;



