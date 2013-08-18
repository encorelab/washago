/** 

# Usage Examples

## Instantiate a Rollcall client

// first parameter is the base DrowsyDromedary url, the second
// is the database name
var rollcall = new Rollcall('http://drowsy.badger.encorelab.org', 'rollcall');

## Get all users with tags 'foo' and 'bar'

rollcall.usersWithTags(['foo', 'bar'])
.done(function (users) {
  users.each(function (user) {
    console.log(user.toJSON());
  });
});

## Get the user with username 'akrauss'

rollcall.user('akrauss')
.done(function (user) {
  console.log(user.toJSON());
});

## Get all users based on an arbitrary selector (all users with zero tags)

rollcall.users({'tags':{'$size': 0}})
.done(function (users) {
  users.each(function (user) {
    console.log(user.toJSON());
  });
});

## Set some metadata to a user

rollcall.user('akrauss')
.done(function (user) {
  user.set('favourite_colour', 'green');
  user.save();

  // note that .save() returns a promise, so if you want
  // to wait for that save to finish, you would do something like this:

  user.save()
  .done(function () {
    console.log("Save is done!");
  })
});

## Tag a user

rollcall.user('akrauss')
.done(function (user) {
  user.addTag('mytag');
  user.save();
});

## Replace all of a user's tags

rollcall.user('akrauss')
.done(function (user) {
  user.set('tags', ['alpha', 'beta']);
  user.save();
});

## Create a new user

var newUser = new rollcall.User({
  username: "cmccann",
  tags: ['foo', 'bar']
});
newUser.save();

## Check if a user exists

rollcall.userExists('akrauss')
.done(function (exists) {
  if (exists)
    console.log('user exists!');
  else
    console.log('user DOES NOT exist!');
});

**/


(function () {
  "use strict";

  // a Rollcall 2.0 client
  var Rollcall = function (url, db) {
    this.server = new Drowsy.Server(url);
    this.db = this.server.database(db);

    // User model

    this.User = this.db.Document('users').extend({
      addTag: function (tag) {
        var tags = _.clone(this.get('tags'));
        tags.push(tag);
        this.set('tags', _.uniq(tags));
      },

      removeTag: function (tag) {
        this.set('tags', _.without(tags, tag));
      }
    });

    this.Users = this.db.Collection('users').extend({
      model: this.User
    });
  };

  Rollcall.prototype.users = function(selector) {
    selector = selector || {};

    var users = new this.Users();
    var usersPromise = users.fetch({
      data: {
        selector: JSON.stringify(selector),
        strict: false
      }
    });

    return usersPromise.then(function () { 
      return users;
    });
  };

  Rollcall.prototype.usersWithTags = function(tags) {
    tags = tags || [];
    var selector = {"tags":{"$all": tags}};

    return this.users(selector);
  };

  Rollcall.prototype.user = function(username) {
    var users = new this.Users();
    var usersPromise = users.fetch({
      selector: JSON.stringify({"username":username}),
      strict: false
    });

    var userPromise = usersPromise.then(function () {
      return users.at(0);
    });

    return userPromise;
  };

  Rollcall.prototype.userExists = function(username) {
    return this.user(username)
      .then(function (u) {
        if (u)
          return true;
        else
          return false;
      });
  };

  this.Rollcall = Rollcall;

}).call(this);
