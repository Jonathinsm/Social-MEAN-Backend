const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var UserSchema = Schema({
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String,
    phrase: String
})

module.exports = mongoose.model('User', UserSchema);