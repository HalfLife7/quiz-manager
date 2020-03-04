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

var connection;

// https://stackoverflow.com/questions/20210522/nodejs-mysql-error-connection-lost-the-server-closed-the-connection
// if the sql connection closes due to timeout, recreate the connection
function handleDisconnect() {
  // Recreate the connection, since
  // the old one cannot be reused.
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'quizmanager'
  });

  connection.connect(function (err) {
    if (err) {
      console.log('error when connecting to db:', err);
      // We introduce a delay before attempting to reconnect,
      // to avoid a hot loop, and to allow our node script to
      // process asynchronous requests in the meantime.                                
      // If you're also serving http, display a 503 error.
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('mySQL Connected!');
    }
  });

  connection.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

// We use the .urlencoded middleware to process form data in the request body,
// which is something that occurs when we use a POST request.
app.use(express.urlencoded({
  extended: false
}));

// set image path
// app.use(express.static('/css'));
// app.use(express.static('/images/badges'));
// app.use(express.static('/badges/profilepictures'));
// app.use(express.static('/js'));

app.use(express.static(path.join(__dirname, 'public')));

// set view paths
const viewsPath = path.join(__dirname, '/views');
const viewsPathLogin = path.join(__dirname, '/views/login');
const viewsPathAccount = path.join(__dirname, '/views/account');
const viewsPathQuiz = path.join(__dirname, '/views/quiz');
const viewsPathAchievements = path.join(__dirname, '/views/achievements');
const viewsPathLeaderboard = path.join(__dirname, '/views/leaderboard');
const viewsPathManageQuiz = path.join(__dirname, '/views/manageQuiz');
const viewsPathStatistics = path.join(__dirname, '/views/statistics');


app.engine('mustache', mustacheExpress(viewsPath + '/partials', '.mustache'));
app.set('view engine', 'mustache');
app.set('views', [viewsPath, viewsPathLogin, viewsPathAccount, viewsPathQuiz, viewsPathManageQuiz, viewsPathAchievements, viewsPathLeaderboard, viewsPathStatistics]);

// start session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  secure: true
}))

// load routes from routes.js
var routes = require("./routes/routes.js");
app.use('/', routes);


var server = app.listen(8080, '10.0.0.4', function () {
  console.log("Server listening...");
})