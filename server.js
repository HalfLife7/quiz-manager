var express = require('express')
var session = require('express-session')
var path = require('path');
var mustacheExpress = require('mustache-express');
var app = express();

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

// We use the .urlencoded middleware to process form data in the request body,
// which is something that occurs when we use a POST request.
app.use(express.urlencoded({
  extended: false
}));

const views_path = path.join(__dirname, '/views');

app.engine('mustache', mustacheExpress(views_path + '/partials', '.mustache'));
app.set('view engine', 'mustache');
app.set('views', views_path);

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