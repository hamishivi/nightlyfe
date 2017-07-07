'use strict';

var path = process.cwd();
var Venue = require('../models/venues');
var User = require('../models/users');
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
    
    // for generating a new bearer token when needed since Yelp api tokens are time limited
    app.get('/yelp/bearer', isLoggedIn, function(req, res) {
        console.log("getting token");
         if (req.user.facebook.id != process.env.USER_ID) {
             res.send("Only the admin can access this, thanks.");
             return;
         }
         request.post({url:'https://api.yelp.com/oauth2/token', 
            form: {
                grant_type: "client_credentials",
                client_id: process.env.YELP_CLIENTID,
                client_secret: process.env.YELP_CLIENTSECRET
            }}, function(err,httpResponse,body) { 
                 if(err) {
                console.log(err);
            } else {
                res.json(body);
            }
                });
    });

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });
    
    app.get('/api/:locale', function(req, res) {
       // grabs business details with simple yelp api search
       res.setHeader('Content-Type', 'application/json');
       var search = req.params.locale;
       var url = "https://api.yelp.com/v3/businesses/search?categories=bars&location="+search;
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
                res.send(body);
            }
        });
    });
    
    app.get('/details/:id', function(req, res) {
        // gets details of specific business
        res.setHeader('Content-Type', 'application/json');
        var search = req.params.id;
        var url = "https://api.yelp.com/v3/businesses/"+search;
        var options = {
            url: url,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + process.env.YELP_TOKEN
            }
        };
        request(options, function(error, response, searchResponseBody){
            if(error) {
                console.log(error);
            } else {
                url = "https://api.yelp.com/v3/businesses/"+search + '/reviews';
                options = {
                    url: url,
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + process.env.YELP_TOKEN
                    }
                };
                // 
                request(options, function(error, response, reviewResponseBody){
                    if(error) {
                        console.log(error);
                    } else {
                        var reviewBody, searchBody;
                        try {
                        reviewBody = JSON.parse(reviewResponseBody);
                        searchBody = JSON.parse(searchResponseBody);
                        } catch (err) {
                            console.log(err);
                        }
                        if (!searchBody) {
                            // just exit gracefully. The yelp api is erroring out for some reason
                            // kind of hacky but hey it works!
                            return;
                        }
                        Venue.findOne({ 'id': searchBody.id }, function (err, venue) {
                            if (err) {
                                throw err;
                            }
                            searchBody.user = false;
                            if (venue) {
                                searchBody.going = venue.going;
                                if (req.user && contains(req.user.going, venue.id)) {
                                    searchBody.user = true;
                                }
                                searchBody.going = venue.going;
                            } else {
                                var newVenue = new Venue();
                                newVenue.id = searchBody.id;
                                newVenue.name = searchBody.name;
                                newVenue.going = 0;
                                searchBody.going = 0;
                                newVenue.save(function (err) {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                            if (reviewBody.reviews) {
                                searchBody.review = reviewBody.reviews[0].text;
                            }
                            res.send(searchBody);
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
        var venue = req.params.venue;
        var user = req.user.facebook.id;
        Venue.findOne({ 'id': venue }, function (err, venue) {
            if (err) {
                throw err;
            }
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
                res.send(JSON.stringify({success:true}));
            });
        });
    });
};

// returns true if val in arr, false otherwise. arr and val must be truthy values
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

// Removes first occurence of value from arr and shifts indices accordingly
function removeArr(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
}