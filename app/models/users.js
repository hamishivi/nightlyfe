'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    facebook: {
        id: String,
        displayName: String,
    },
    going: []
});

module.exports = mongoose.model('User', User);