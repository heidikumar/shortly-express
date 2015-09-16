var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var authenticate = require('./lib/authenticate.js');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'HeyBuddyWannaBuyATile'
}));

app.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

var restrict = function(req, res, next){
  if (req.session.user){
    next();
  } else {
    req.session.error = "Access denied, bro! Mwahaha!";
    res.redirect('/login');
    // res.send("Access denied, bro! Mwahaha! Try <a href='/login'>Again</a>?");
  }
};


app.get('/', restrict, function(req, res) {
  //TODO : Check if logged in. Go to index if logged in!!!!
  res.render('index');
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/login');
  });
});

app.post('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/login');
  });
});

app.get('/create', restrict, function(req, res) {
  res.render('index');
});

app.get('/links', restrict,  //TO DO: restrict? NOTSUREWHAT TO DO WITHTHIS
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', restrict,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res){
  //todo: render login page
  res.render('login');

});

app.post('/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if(user){
      req.session.regenerate(function(){
        req.session.user = user;
        req.session.success = 'You are awesome!';
        res.redirect('/');
      });
    } else {
      req.session.error = 'You have failed at authentication';
      // res.redirect('/login');
      res.send('Sorry, bud, no such user/pass combo. Try <a href="/login">Login</a> again?');
    }
  });


  // new User({username: req.body.username}).fetch().then(function(found){
  //   if (found){
  //     //check database to login. 
  //     //if everything matches, we redirect
  //       res.redirect(302, '/');
  //   } else {
  //       res.redirect(302, '/signup');
  //   }
  // });

});




app.get('/signup', function(req, res){
  //todo: render signup page
  res.render('signup');
  // res.redirect('/login');
});

app.post('/signup', function(req, res){
  //todo: receive&process signup data

  //todo: redirect (or other way to tell user that they signed up successfully)

  //make a function to check if the username is valid 
    //if not, give alert

  //then
  new User({username: req.body.username}).fetch().then(function(found){
    if (found){
      //TODO send "this user is taken, try again" message
      res.send(200);
    } else {
      bcrypt.genSalt(10, function(err,salt){
        bcrypt.hash(req.body.password, salt, function(err, hash){
          Users.create({
            username: req.body.username,
            password: hash, 
            salt: salt
            //will need a function for salt
          }).then(function(user){
            console.log("Created new user!");
            //TODO redirect them to loggin page
            req.session.regenerate(function(){
              req.session.user = user;
              req.session.success = 'You are awesome!';
              res.redirect('/');
            });

            // res.redirect(302, '/login');
          });
        });
      });
      // console.log("attempting to add new user");
    }
  });

});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
