const jwt = require('jwt-simple');
const moment = require('moment');
const secret = 'i_am_the_shield_that_guards_the_realms_of_men';

exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat:  moment().unix(),
        exp: moment().add(30, 'days').unix
    }

    return jwt.encode(payload, secret)
}