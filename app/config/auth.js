'use strict';

module.exports = {
    'facebookAuth': {
        'clientID': process.env.FACEBOOK_KEY,
        'clientSecret': process.env.FACEBOOK_SECRET,
        'callbackURL': "https://nyghtlyfe.herokuapp.com/auth/facebook/callback"
    }
};