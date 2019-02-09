const mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require('../models/follow');

//Save un follow
function saveFollow(req, res){
    var params = req.body;
    var follow  = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;
    follow.save((err, followStored) => {
        if(err) return res.status(500).send({message: 'Error to save the follow'});
        if(!followStored) return res.status(404).send({message: 'The follos has not save'});
        return res.status(200).send({follow: followStored});
    });  
};

//Save un follow
function deleteFollow(req, res){
    var userId = req.user.sub;
    var followId = req.params.id;
    Follow.find({'user': userId, 'followed': followId}).remove(err => {
        if(err) return res.status(500).send({message: 'Error to stop following'});
        return res.status(200).send({message: 'The follow has been removed'});
    });
};

//Save un follow
function getFollowingUsers(req,res){
    var userId = req.user.sub;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    };
    var page =1;
    if(req.params.page){
        page =req.params.page;
    }else {
        page = req.params.id;
    };
    var itemsPerPage = 4;
    Follow.find({user:userId}).populate('followed','_id name surname nick email image').paginate(page, itemsPerPage, (err, follows, total)=>{
        console.log(err)
        if(err) return res.status(500).send({message: 'Error in the server'});
        if(!total) return res.status(404).send({message: 'Yor dont follow anyone'});
        followUserIds(req.user.sub).then((value)=>{
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            follows,
            users_following: value.following,
            users_follow_me: value.followed
            });
        });
    });
};

//Get the users that follow me
function getFollowedUsers(req,res){
    var userId = req.user.sub;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    };
    var page =1;
    if(req.params.page){
        page =req.params.page;
    }else {
        page = req.params.id;
    };
    var itemsPerPage = 4;
    Follow.find({followed:userId}).populate('user').paginate(page, itemsPerPage, (err, follows, total)=>{
        if(err) return res.status(500).send({message: 'Error in the server'});
        if(!total) return res.status(404).send({message: 'Anyone user follow you'});
        followUserIds(req.user.sub).then((value)=>{
            return res.status(200).send({
                total: total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                users_following: value.following,
                users_follow_me: value.followed
            });
        });
    });
};

//Get info of mine and my follows
function getMyFollows(req,res){
    var userId = req.user.sub;
    var find = Follow.find({user: userId});
    if(req.params.followed){
        find = Follow.find({followed: userId});
    };
    find.populate('user followed').exec((err,follows) =>{
        if(err) return res.status(500).send({message: 'Error in the server'});
        if(!follows) return res.status(404).send({message: 'Anyone user follow you'});
        return res.status(200).send({follows});   
    });
};

//Async function thet help to get following and followed users
async function followUserIds(user_id){
    try{
        var following = await Follow.find({'user':user_id }).select({'_id':0, '__v':0, 'user': 0}).exec()
            .then((following) =>{
                var follows_clean = [];
                following.forEach((follow) =>{
                    follows_clean.push(follow.followed);
                });
                return follows_clean;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        var followed = await Follow.find({'followed':user_id }).select({'_id':0, '__v':0, 'followed': 0}).exec()
            .then((following) =>{
                var follows_clean = [];
    
                following.forEach((follow) =>{
                    follows_clean.push(follow.user);
                });
    
                return follows_clean;
            })
            .catch((err)=>{
                return handleerror(err);
            });
    
        return {
            following: following,
            followed: followed
        }
    }catch(e){
        console.log(e);
    };
        
};

module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
};