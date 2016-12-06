'use strict';

var path = process.cwd();
var bodyParser = require('body-parser');
var Venue = require('../models/venues');
var User = require('../models/users');
var mongoose = require('mongoose');
var request = require('request');

module.exports = function (app, passport) {
    function isLoggedIn (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.send('You gotta login before you can access this!');
        }
    }
    

    app.set('view engine', 'ejs');

    // need: list of bars with name, review, number going, imageurl
    app.route('/')
    .get(function (req, res) {
        res.locals.bars = [];
        res.locals.login = req.isAuthenticated();
        res.render(path + '/public/index.ejs');
    });
    
    app.route('/logout')
    .get(function (req, res) {
        req.logout();
        res.redirect('/');
    });
    
    app.get('/auth/facebook', passport.authenticate('facebook'));

    // note we need to keep search intact
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });
    
    app.get('/api/:locale', function(req, res) {
       // grabs business details with simple yelp api search
       res.setHeader('Content-Type', 'application/json')
       var search = req.params.locale;
       var url = "https://api.yelp.com/v3/businesses/search?categories=bars&location="+search
        request({
            url: url,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + process.env.YELP_TOKEN
            }
        }, function(error, response, body){
            if(error) {
                console.log(error);
            } else {
                res.send(body)
            }
        });
    });
    
    app.get('/details/:id', function(req, res) {
        // gets details of specific business
        res.setHeader('Content-Type', 'application/json')
        var search = req.params.id;
        var url = "https://api.yelp.com/v3/businesses/"+search
        var options = {
            url: url,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + process.env.YELP_TOKEN
            }
        }
        request(options, function(error, response, data){
            if(error) {
                console.log(error);
            } else {
                url = "https://api.yelp.com/v3/businesses/"+search + '/reviews'
                options = {
                    url: url,
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + process.env.YELP_TOKEN
                    }
                }
                request(options, function(error, response, body){
                    if(error) {
                        console.log(error);
                    } else {
                        var info = JSON.parse(body);
                        var info2 = JSON.parse(data);
                        Venue.findOne({ 'id': info2.id }, function (err, venue) {
                            if (err) {
                                throw err;
                            }
                            info2.user = false;
                            if (venue) {
                                info2.going = venue.going;
                                if (req.user && contains(req.user.going, venue.id)) {
                                    info2.user = true;
                                }
                                info2.going = venue.going;
                            } else {
                                var newVenue = new Venue();
                                newVenue.id = info2.id;
                                newVenue.name = info2.name;
                                newVenue.going = 0;
                                info2.going = 0;
                                newVenue.save(function (err) {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                            if (info.reviews) {
                                info2.review = info.reviews[0].text
                            }
                            res.send(info2);
                        });
                        
                    }
                });
            }
        });
        
    });
    
    app.get('/addgoing/:venue', function(req, res) {
        if (!req.isAuthenticated()){
            res.send(JSON.stringify({ "loginFail":true }));
            return;
        }
        console.log('hey')
        var venue = req.params.venue;
        var user = req.user.facebook.id;
        Venue.findOne({ 'id': venue }, function (err, venue) {
            if (err) {
                throw err;
            }
            console.log('finding user')
            User.findOne({'facebook.id' : user}, function(err, user) {
                if (err) throw err;
                if (contains(user.going, venue.id)) {
                    venue.going--;
                    removeArr(user.going, venue.id);
                } else {
                    venue.going++;
                    user.going.push(venue.id);
                }
                venue.save(function(err) {
                    if (err) return err;
                });
                user.save(function(err) {
                    if (err) return err;
                });
                console.log('successss')
                res.send(JSON.stringify({success:true}));
            });
        });
    });
}

function contains(arr, val) {
    if (!arr || !val){
        return false;
    }
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
            return true;
        }
    }
}

function removeArr(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
}