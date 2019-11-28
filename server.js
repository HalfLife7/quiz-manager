var express = require('express')
var session = require('express-session')
var path = require('path');
var mustacheExpress = require('mustache-express');
var app = express();
// change all routes to lowercase (sometimes db params are uppercase)
var lowercasePaths = require("express-lowercase-paths")
app.use(lowercasePaths())

// mysql
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'quizmanager'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('mySQL Connected!');
});

this.connection.on('error', function(err) {
  console.log('Caught this error: ' + err.toString());
})

// We use the .urlencoded middleware to process form data in the request body,
// which is something that occurs when we use a POST request.
app.use(express.urlencoded({
  extended: false
}));

// set image path
app.use(express.static(__dirname + '/public'));

// set view paths
const viewsPath = path.join(__dirname, '/views');
const viewsPathLogin = path.join(__dirname, '/views/login');
const viewsPathAccount = path.join(__dirname, '/views/account');
const viewsPathQuiz = path.join(__dirname, '/views/quiz');
const viewsPathManageQuiz = path.join(__dirname, '/views/manageQuiz');

app.engine('mustache', mustacheExpress(viewsPath + '/partials', '.mustache'));
app.set('view engine', 'mustache');
app.set('views', [viewsPath, viewsPathLogin, viewsPathAccount, viewsPathQuiz, viewsPathManageQuiz]);

// start session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  secure: true
}))

var routes = require("./routes/routes.js");
app.use('/', routes);


var server = app.listen(3000, function () {
  console.log("Server listening...");
})