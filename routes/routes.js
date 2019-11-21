var express = require('express')
var session = require('express-session')

var router = express.Router();

router.use("/", require("./controllers/accountController.js"));
router.use("/", require("./controllers/homeController.js"));

module.exports = router;



