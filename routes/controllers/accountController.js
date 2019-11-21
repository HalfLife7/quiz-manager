var express = require('express');
var session = require('express-session')
var passwordHash = require('password-hash');

var router = express.Router()

// mysql
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'quizmanager'
});

router.post('/attemptlogin', function (req, res) {
  console.log(req.body);


  connection.query("SELECT * FROM user WHERE email = ?", req.body.email, function callback(error, results, fields) {
    if (error != null) {
      console.log(error);
    } else {
      console.log(results[0]);

      if (results[0] == undefined) {
        req.session.login_error = "Invalid email!";
        res.redirect("/");
      }
      // check the email and password are valid before allowing the user
      // to view the users page. 
      else if (passwordHash.verify(req.body.password, results[0].password) == true) {
        console.log("correct");

        // set an email session variable to indicate that a user is logged in
        req.session.email = req.body.email;
        req.session.userInfo =
          {
            email: results[0].email,
            firstName: results[0].fullName,
            lastName: results[0].lastName
          }

        // check if the user account_type
        if (results[0].account_type == "administrator") {
          req.session.account_type = "administrator";
          res.redirect("/homepage")
          // if user send to user panel
        } else if (results[0].account_type == "student") {
          console.log("HERE");
          req.session.account_type = "student";
          res.redirect("/homepage");
        }
        // if the input was not valid, re-render the login page with an error message
      } else {
        req.session.login_error = "Invalid password!";
        res.redirect("/");
      }
    }
  });

})

router.get('/register', function (req, res) {
  register_error = req.session.register_error;
  req.session.register_error = "";

  res.render("register", { errormsg: register_error });
})

router.post('/registeruser', function (req, res) {
  console.log(req.body);

  // validation to make sure the passwords match
  if (req.body.password == req.body.confirmPassword) {
    var hashedPassword = passwordHash.generate(req.body.password);

    connection.query("INSERT into user (email, password, account_type, first_name, last_name, secret_question, secret_answer) VALUES (?,?,?,?,?,?,?)", [req.body.email, hashedPassword, "student", req.body.firstName, req.body.lastName, req.body.secretQuestion, req.body.secretAnswer], function callback(error, results, fields) {
      if (error != null) {
        console.log(error)
      } else {

        req.session.email = req.body.email;
        req.session.account_type = "student";

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

router.get('/forgotpassword', function (req, res) {
  forgot_password_error = req.session.forgot_password_error;
  req.session.forgot_password_error = "";
  res.render("forgotpasswordconfirmemail", { errormsg: forgot_password_error })
});

router.post('/forgotpasswordconfirmemail', function (req, res) {
  console.log(req.body);

  connection.query("SELECT email, secret_question, secret_answer FROM user WHERE email = ?", req.body.email, function callback(error, results, fields) {
    if (error != null) {
      console.log(error);
    } else {
      console.log(results[0]);

      if (results[0] == undefined) {
        req.session.forgot_password_error = "Invalid email!";
        res.redirect("/forgotpassword");
      }
      // check the email and password are valid before allowing the user
      // to view the users page. 
      else {
        console.log("correct");

        // store secret question/answer in session and have user confirm in next page
        req.session.forgot_password =
          {
            email: results[0].email,
            secret_question: results[0].secret_question,
            secret_answer: results[0].secret_answer
          }
        console.log(req.session.forgot_password.secret_answer);
        res.redirect('/secretanswer');
      }
    }
  });
});

router.get('/secretanswer', function (req, res) {
  secret_answer_error = req.session.secret_answer_error;
  req.session.secret_answer_error = "";

  // if user didnt enter an e-mail and shouldn't be here, redirect them back to the loginpage
  if (req.session.forgot_password == null) {
    res.redirect('/');
  } else {
    res.render('forgotpasswordsecretquestion', { secret_question: req.session.forgot_password.secret_question, errormsg: secret_answer_error });
  }
})

router.post('/forgotpasswordconfirmsecretanswer', function (req, res) {
  console.log(req.body);
  // if they enter the correct scret answer, send them to update their password
  if (req.body.secret_answer == req.session.forgot_password.secret_answer) {
    req.session.secret_answer_success = "success";
    res.redirect('/updatepassword')
  } else {
    // reload page with error saying incorrect secret answer
    req.session.secret_answer_error = "Incorrect!";
    res.redirect('/secretanswer');
  }
})

router.get('/updatepassword', function (req, res) {
  console.log(req.session);
  update_password_error = req.session.update_password_error;
  req.session.update_password_error = "";

  // if user didnt answer secret successfully, redirect them back to the loginpage
  if (req.session.secret_answer_success == null) {
    res.redirect('/');
  } else {
    res.render('forgotpasswordupdatepassword', { errormsg: update_password_error, email: req.session.forgot_password.email });
  }
})

router.post('/forgotpasswordupdatepassword', function (req, res) {
  console.log(req.body);
  // update the password of the user

  // validation to make sure the passwords match
  if (req.body.password == req.body.confirmPassword && req.body.password != "") {
    var hashedPassword = passwordHash.generate(req.body.password);

    connection.query("UPDATE user SET password = (?) WHERE email = ?", [hashedPassword, req.session.forgot_password.email], function callback(error, results, fields) {
      if (error != null) {
        console.log(error)
      } else {

        req.session.email = req.session.forgot_password.email;
        req.session.account_type = "student";

        // remove session variables related to forgot password
        delete (req.session.forgot_password);

        console.log(req.session);

        // redirect to student homepage for logged-in students
        res.redirect("/homepage");
      }
    })
  } else if (req.body.password == "") {
    req.session.update_password_error = "Password cannot be blank."
    // redirect to student homepage for logged-in students
    res.redirect("/updatepassword");
  } else {
    req.session.update_password_error = "Passwords do not match."
    // redirect to student homepage for logged-in students
    res.redirect("/updatepassword");
  }

})

module.exports = router;