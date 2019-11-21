var express = require('express')
var session = require('express-session')

var app = express().router;

// Attempts to log the user in
app.post('/attemptlogin', function (req, res) {

    console.log(req.body);
  
    db.serialize(function () {
      connection.query("SELECT * FROM user WHERE email = ?", req.body.email, function callback(error, results, fields) {
        if (error != null) {
          console.log(error);
        } else {
          if (results == undefined) {
            req.session.login_error = "Invalid email and/or password!";
            res.redirect("/");
          }
          // check the email and password are valid before allowing the user
          // to view the users page. 
          else if (req.body.password == results.password) {
  
            // set an email session variable to indicate that a user is logged in
            req.session.email = req.body.email;
            req.session.userInfo =
              {
                email: results.email,
                firstName: results.fullName,
                lastName: results.lastName
              }
  
            // check if the user type
            if (results.accountType == "administrator") {
              req.session.accountType = "administrator";
              res.redirect("/homepage")
              // if user send to user panel
            } else if (results.accountType == "student") {
              req.session.accountType = "student";
  
              req.session.accountType = "student";
              res.redirect("/homepage");
            }
            // if the input was not valid, re-render the login page with an error message
          } else {
            req.session.login_error = "Invalid email and/or password!";
            res.redirect("/login");
          }
        }
      });
    })
  });
  
  // registration page
  app.get('/register', function (req, res) {
  
    registererror = req.session.register_error;
    req.session.register_error = "";
  
    res.render("register", { errormsg: registererror });
  });
  
  // user registers new account
  app.post('/registeruser', function (req, res) {
    // The middleware gives us a JSON object in req.body with the keys/values
    // of the form inputs.
    console.log(req.body);
  
    // validation to make sure the passwords match
    if (req.body.password == req.body.confirmPassword) {
      connection.query("INSERT into user (email, password, type, first_name, last_name, secret_question, secret_answer) VALUES (?,?,?,?,?,?,?)", [req.body.email, req.body.password, "student", req.body.firstName, req.body.lastName, req.body.secretQuestion, req.body.secretAnswer], function callback(error, results, fields) {
        if (error != null) {
          console.log(error)
        } else {
  
          req.session.email = req.body.email;
          req.session.accountType = "student";
  
          console.log(req.session);
  
          // redirect to student homepage for logged-in students
          res.redirect("/homepage");
        }
      })
    } else {
      req.session.register_error = "Passwords do not match."
      // redirect to student homepage for logged-in students
      res.redirect("/register");
    }
  })

  module.exports = app;