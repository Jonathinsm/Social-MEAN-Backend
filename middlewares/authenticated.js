const jwt  = require('jwt-simple');
const moment  = require('moment');
const secret = 'i_am_the_shield_that_guards_the_realms_of_men';

exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({
            message:'The request hasnt the header of authentication'
        })
    }
    var tocken = req.headers.authorization.replace(/['"]+/g, '');
    try{
        var payload = jwt.decode(tocken, secret);
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                message: 'Tocken has expired'
            });
        }
    }catch(ex){
        return res.status(401).send({
            message: 'Invalid tocken'
        });        
    }
    req.user = payload;
    next();
}