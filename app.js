const express = require('express');
const app = express();

const pgp = require('pg-promise')();
const mustacheExpress = require('mustache-express');
const methodOverride = require('method-override')
const bodyParser = require("body-parser");
const session = require('express-session');
/* BCrypt stuff here */
const bcrypt = require('bcrypt');
const salt = bcrypt.genSalt(10);

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views'); //name of the home folder for html
app.use("/", express.static(__dirname + '/public')); // these are css and js
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'))

app.use(session({// this was all copied and pasted
  // will tell you if you are logegd in or not , what sessions is
  secret: 'youwontguess',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

/* Change this line! */
var db = pgp('postgres://NigelGardner@localhost:5432/project2');

app.get('/', function(req, res){
  if(req.session.user){
    //user is logged in, if true then do this stuff
    let data = {
      "logged_in": true,
      "email": req.session.user.email,
      "firstname": req.session.user.firstName
    };
    res.render('home/index', data);
  } else {
    //user is not logged in
    res.render('home/index'); // this should link the file where line 15 states
    // if the use isn't logged in, we show them a login form and a link to sign up
    // if the user is signed in, then we show them the super secret stuff
  }
});
// this ends line 32

app.post('/home/index', function(req, res){//req is an object from the database
  // res is the stuff we send to the databse
  // this is not renduring a page, POST is saving information
  let data = req.body.email;
  let pass = req.body.password;
   // take the req .body =>email, pass
  //lookup  the email in the database
  let auth_error = "Authorization Failed: Invalid email/password";
  db
    .one("SELECT * FROM users WHERE email = $1", [data])
    .catch(function(){
      res.send(auth_error);
    })
    .then(function(user){ //using a promise
      bcrypt.compare(pass, user.password, function(err, cmp){
        console.log('this is pass' + pass)
        console.log('this is hash' + user.password)
        if(cmp){
          req.session.user = user;//session is a object that holds the user db
          //delete req.session.user.password
          res.redirect("/profile/");
        } else {
          res.send(auth_error);
        }
      });
   //SELECT + FROM users WHERE  email = email
  //Compare that user's hashed pass, to the hash of req.body.email
  //if they match we let the user in(start session)
  //if they dont match we tell tehre was an error
  //email and or password incorrect
    });
});
//finsishes line 49 post home/index - signing in and password

app.get('/profile', function(req, res){
  if(req.session.user){
    //user is logged in, if true then show this stuff
       db
      .any('SELECT * FROM resort')
      .then (function(info){
        let data = {
          "logged_in": true,
          "email": req.session.user.email,
          //this is how you access it in mustache " between the quotes" the key
          "firstname": req.session.user.firstname,
          "aboutMe": req.session.user.aboutme,
          "firstname": req.session.user.firstname,
          "resort": info
         }
    res.render('profile/index', data);
    });
    } else {
    //user is not logged in
      res.redirect('/'); // this should link the file where line 15 states
    }
});
//finishes signing in, this brings up the profile

//create the link to the lobby line 107
app.get('/home', function (req, res){
  if(req.session.user){
    //user is logged in, if true then show this stuff
      db
      .any('SELECT * FROM resort')
      .then (function(info){
        console.log(info)
        let data = {
        "logged_in": true,
        "firstname": req.session.user.firstname,
        "resort": info
        };

       //data is the object resort is the key info is the value
       // same thing as "firstname": req.session.user.firstname
       // console.log(info)
       // let resort_array = {
        //  "name": info,
       //   "security": data
       // }

      res.render('home/lobby', data);
      })
  }else {
    //user is not logged in
      res.redirect('/'); // this should link the file where line 15 states
    }
});
//this ends the route for the lobby in line 107


app.get('/signup', function(req, res){
  res.render('signup/index');
});

app.post('/signup', function(req, res){ // in HTML, this is the route you are posting to under
  //form found in index.html. when you hit the submit button
  let data = req.body;
  let email = data.email;
  let fName = data.firstName;
  let lname = data.lastName;
  let aboutMe = data.aboutMe;
  let skiLevel = data.skiLevel;
  let pass = data.password;
  // HASH the pass
  // save the email and the hashed password
  bcrypt
  .hash(pass, 10, function(err, hash){
      // save the email and hashed password in callback type function
   db.none("INSERT INTO users (email, password, firstName, lastName, aboutMe, skiLevel) VALUES ($1,$2,$3,$4,$5,$6)",[email, hash, fName, lname, aboutMe, skiLevel])
        //hash is the password form the function
        // this array are the values being inserted in the database
      .catch(function(e){//this console logs errors
        res.send('Failed to create user: ' + e);
      })
      .then(function(){

        res.redirect('/');
        });
      //none because we are inserting
    });
});

app.put('/user', function(req, res){//updating a record in the database
  db
    .none("UPDATE users SET email = $1 WHERE email = $2",
      //none - not expecting anything back from DB
      //$ = sanitize - forces it to be a string
      //looking for old email in that row and replace it
      //make a form for  from req.body
      [req.body.email, req.session.user.email]
    ).catch(function(){
      res.send('Failed to update user.');
    }).then(function(){
      res.send('User updated.');
    });
});
//this ends upadting the user email app.put

app.delete ('/user', function(req, res){
  console.log(req.session.user.personid)
  db.none("DELETE FROM users WHERE id = $1", req.session.user.id)
  .then(function(){
    res.send('user deleted')
  })

  });
//this ends line 159 delete account

app.get('/resorts', function(req, res){
  db
    .any('SELECT * FROM resort')
    .then(function(data){
      console.log(data);
      let resort_array = {
        resort: data,
      };
      console.log(resort_array);
      res.render('resorts/index', resort_array)

    })
});

app.get('/resorts/:id', function (req, res){
  var id = req.params.id;

  if(req.session.user){
      db
      .any('SELECT * FROM visited INNER JOIN resort ON visited.resort_id = resort.id INNER JOIN users ON visited.user_id = users.id WHERE resort_id' + id)
      .then (function(info){
        console.log(info);
        let data = {
        "logged_in": true,
        "firstname": req.session.user.firstname,
        "visit": info
        };
      res.render('resorts/visited', data);
      })
  }else {
    //user is not logged in
      res.redirect('/'); // this should link the file where line 15 states
    }
});


app.get("/home/weather", function(req, res){
 const usersdata = req.session.user;

      axios.get("http://api.eventful.com/json/events/search?app_key=F7jWpmt2FtpRWBCX&keywords=edm&date=Future")
      .then(function(response){
         response = response.data.events.event
         // console.log(apiData);
       //  console.log(response)
       //  console.log(data)
        let weather_array = {

         api: response
        };
        res.render("home/weather", weather_array)
      })
      .catch(err =>{
        console.log("api: "+err)
      })

})


app.get('/logout', function(req, res){
  //delete the  session
  req.session.user = false;
  res.redirect("/");
});

app.listen(3000, function () {
  console.log('we in this bitch');
});
