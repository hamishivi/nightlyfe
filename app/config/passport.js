'use strict';

var FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/users');
var configAuth = require('./auth');

module.exports = function (passport) {
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
    
    passport.use(new FacebookStrategy({
    clientID:     process.env.FACEBOOK_KEY,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "https://nyghtlyfe.herokuapp.com/auth/facebook/callback",
    passReqToCallback   : true,
  },
    function (request, accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            User.findOne({ 'facebook.id': profile.id }, function (err, user) {
                if (err) {
                    return done(err);
                }

               if (user) {
                    return done(null, user);
                } else {
                    var newUser = new User();

                    newUser.facebook.id = profile.id;
                    newUser.facebook.displayName = profile.displayName;
                    newUser.going = [];

                    newUser.save(function (err) {
                        if (err) {
                            throw err;
                        }

                        return done(null, newUser);
                    });
                }
            });
        });
    }));
};