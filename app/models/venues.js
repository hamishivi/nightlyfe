'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Venue = new Schema({
    name: String,
    going: Number,
    id: String
});

module.exports = mongoose.model('Venue', Venue);