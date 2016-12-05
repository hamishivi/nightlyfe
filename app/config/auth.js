'use strict';

module.exports = {
    'facebookAuth': {
        'clientID': process.env.FACEBOOK_KEY,
        'clientSecret': process.env.FACEBOOK_SECRET,
        'callbackURL': "https://nightlyfe-hamishivi.c9users.io/auth/facebook/callback"
    }
};