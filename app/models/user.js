var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users', 
  hasTimestamps: true,
  links: function(){
    return this.belongsToMany(Link);
  }, 
  clicks: function(){
    return this.belongsToMany(Click);
  }

  //to do initialize

});

module.exports = User;