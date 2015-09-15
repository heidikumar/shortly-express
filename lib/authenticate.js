var Users = require('../app/collections/users');
var User = require('../app/models/user');
var bcrypt = require('bcrypt');

var authenticate = function (name, pass, cb){
  console.log("authenticating user: %s, pass:%s",name,pass);
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  // Users.query({where: {username : name}}).fetch().then(function(user){
    new User ({username : name}).fetch().then(function(user){
    // console.log("found user in database:", user);
    if(!user) {
      return cb(new Error('cannot find user, dagnabit!'));
    } else { //if user exists, compare hashed password with hash of new password
        //hash pw they input with salt from user table
        console.log("data from db is...", user);
      console.log("user: %s WITH salt: %s", user.get("username"), user.get("salt"));
      bcrypt.hash(pass, user.get("salt"), function(err, hash) {
        console.log("old hash is: %s, computed hash is: %s", user.get("password"), hash);
        bcrypt.compare(user.get("password"), hash, function(err, res){
          if (res === true) {
            return cb(null, user);
          } else {
            return cb(new Error('wrong password, yo!'));
          }
        });        
      });
    }
  });

  //TODO: hash!
};

module.exports = authenticate;