var express = require('express')
var session = require('express-session')

var app = express();

module.exports = function(app) {
    app.use("/", require("/account/accountController.js"));
    app.use("/home", require("/home/homeController.js"));
}


