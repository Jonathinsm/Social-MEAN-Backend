const User = require('../models/user');
const Follow = require('../models/follow');
const Publication = require('../models/publication');
const jwt = require('../services/jwt');

const bcrypt  = require('bcrypt-nodejs');
const  mongoosePaginate = require('mongoose-pagination');
const fs = require('fs');
const path = require('path');

function home (req,res) {
    res.status(200).send({
        message: "Working"
    });
};

// Create User
function saveUser(req,res){
    var params = req.body;
    var user  = new User();
    console.log(req.body);

    //Requering all filed nescesari
    if(params.name && params.surname && params.nick
         && params.email && params.password){
            
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.role = 'ROLE_USER';
            user.image = null;
            user.phrase = params.phrase;

            User.find({ $or: [
                {email: user.email.toLowerCase()},
                {nick: user.nick.toLowerCase()}
            ]}).exec((err,users) => {
                if(err)return res.status(500).send({message: 'Error on the request users'});

                if(users && users.length >= 1){
                    return res.status(200).send({message: 'User alrready registred'});
                }else{
                    //Crypting the pass
                    bcrypt.hash(params.password, null, null, (err, hash) => {
                        user.password = hash;
        
                        //Saving an returnnig a response
                        user.save((err, userStored) => {
                            if(err)return res.status(500).send({message: 'Error to save the user'});
        
                            if(userStored){
                                res.status(200).send({user: userStored});
                            }else{
                                res.status(404).send({message: 'User has not registered'})
                            };
                        });
                    });
                };
            });

    }else{
        res.status(200).send({
            message: 'All fields are nescesary'
        });
    };
};

// Lgin User
function loginUser(req,res){
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email},(err, user) => {
        if(err) return res.status(500).send({message: 'Error in the request'});

        if(user){
            bcrypt.compare(password, user.password, (err, check) => {
                if(check){
                    
                    if(params.gettoken){
                        //Generate and get back token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }else{
                        user.password = undefined;
                        //Return user data
                        return res.status(200).send({user});                         
                    };
                  
                }else{
                    return res.status(500).send({message: 'User cant identify'});
                };
            });
        }else{
            return res.status(500).send({message: 'User cant identify'});
        };
    });
};

//Get data of an user
function getUser(req,res){
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message: 'Error in the request'});
        
        if(!user) return res.status(404).send({message: 'The user not exist'});

        followThisUser(req.user.sub, userId).then((value) => {
            //console.log(value)
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            });
        });
    });
};

//Async peticion for consult follow an followed user
async function followThisUser(identity_user_id, user_id){
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id}).exec()
            .then((following) => {
                return following;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id}).exec()
            .then((followed) => {
                return followed;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        return {
            following: following,
            followed: followed
        }
    } catch(e){
        console.log(e);
    };
};

//Return a list of users paginates
function getUsers(req,res){
    var identify_user_id = req.user.sub;
    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 5;

    User.find({}).sort('_id').paginate(page, itemsPerPage, (err, users, total) =>{
        if(err) return res.status(500).send({message: 'Error in the request'});

        if(!users) if(err) return res.status(404).send({message: 'There is no users availables'});

        followUserIds(identify_user_id).then((value)=>{
            return res.status(200).send({
                users,
                users_following: value.following,
                users_follow_me: value.followed,
                total,
                pages: Math.ceil(total/itemsPerPage)
            });
        });
    });
 };

 async function followUserIds(user_id){

    try{
        //Obejter los usuarios que seguimos          //El select es para mostrar los campos que yo quiera
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
    
        //Obejter los usuarios que me siguen          //El select es para mostrar los campos que yo quiera
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

function getCounters(req,res){
    var userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;
    }
        getCountFollow(userId).then((value)=>{
            return res.status(200).send(value);
        })
};

async function getCountFollow(user_id){
    try{
        
        var following = await Follow.count({"user":user_id}).exec()
        .then(count=>{
            return count;
        })
        .catch((err)=>{
            return handleError(err);
        });
        
        var followed = await Follow.count({"followed":user_id}).exec()
        .then(count=>{
            return count;
        })
        .catch((err)=>{
            return handleError(err);
        });

        var publications = await Publication.count({"user":user_id}).exec()
        .then(count=>{
            return count;
        })
        .catch((err)=>{
            return handleError(err);
        });
        
        return {
            following: following,
            followed: followed,
            publications: publications
        }
    }catch(e){
        
        console.log(e);
    };
};


 // Edition of users
 function updateUser(req,res){
    var userId = req.params.id;
    var update = req.body;

    // delete the property password
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'You dont have permissions for update the user'});
    };

    User.find({ $or: [
        {email: update.email.toLowerCase()},
        {nick: update.nick.toLowerCase()}
    ]}).exec((err, user)=>{

        var user_isset = false;

        user.forEach((user)=>{
            if(user && user._id != userId) user_isset = true;
        });

        if(user_isset) return res.status(404).send({message: 'Data already in use.'});
        

        User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdated) =>{
            if(err) return res.status(404).send({message: 'Error in the request'});
    
            if(!userUpdated) return res.status(404).send({message: 'The user cant be updated'});
    
            return res.status(200).send({user: userUpdated});
        });    
    });
 };

// Upload image files/user avatar
function uploadImage(req,res){
    var userId  = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);

        var file_split = file_path.split('\/');
        console.log(file_split);
        
        var file_name = file_split[2];
        console.log(file_name);

        var ext_split = file_name.split('\.');
        console.log(ext_split);

        var file_ext = ext_split[1];
        console.log(file_ext);

        if(userId != req.user.sub){
            //Return an error if user is invalid
            return removeFilesOfUploads(res, file_path, 'You dont haver permissions to updatte image user');
        };

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            //Update file of the logued user
            User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err,userUpdated) => {
                if(err) return res.status(404).send({message: 'Error in the request'});

                if(!userUpdated) return res.status(404).send({message: 'The user cant be updated'});
                userUpdated.password = null;
                return res.status(200).send({user: userUpdated});
            })
        }else{
            //Return an error if file extansion is ivalid
            return removeFilesOfUploads(res, file_path, 'Invalid extension');
        }
    }else{
        //Return an error if the file cant load
        return res.status(200).send({message: 'Files has no send'});
    };
};

//Interrup uploading file
function removeFilesOfUploads(res, file_path, message){
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    });
};

function getImageFile(req,res){
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/'+image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file))
        }else{
            res.status(200).send({message:'Image do not exist..'});
        };
    });
};

module.exports = {
    home,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
};