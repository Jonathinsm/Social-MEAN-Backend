const path = require('path');
const fs = require('fs');
const moment = require('moment');
const paginate = require('mongoose-pagination');
const Publication = require('../models/publication');
const Follow = require('../models/follow');

function savePublication(req,res){

    var params = req.body;

    if(!params.text) return res.status(200).send({message: 'A text is necessary !'});
    
    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored) =>{
        if(err) return res.status(500).send({message: 'Error to save the pulication'});

        if(!publicationStored) return res.status(404).send({message: 'The publication has not been saved'});

        return res.status(200).send({publication: publicationStored});
    });

};

function getPublications(req, res){
    var page = 1;

    if(req.params.page){
        page = req.params.page;
    };

    var itemsPerPage = 4;
    
    Follow.find({user: req.user.sub}).populate('followed').exec((err, follows)=>{
        if(err) return res.status(500).send({message: 'Error to return the follow'});

        var follows_clean = [];

        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });

        follows_clean.push(req.user.sub);
        console.log(follows_clean)
        Publication.find({user: {'$in': follows_clean}}).sort('-created_at')
            .populate('user','_id name surname nick image')
            .paginate(page, itemsPerPage, (err, publications, total) => {
             
            if(err) return res.status(500).send({message: 'Error to return publications'});

            if(!publications) return res.status(404).send({message: 'There is no publications'});

            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total/itemsPerPage),
                page,
                items_per_page: itemsPerPage,
                publications
            });
        });
    });  
};

function getPublicationsUser(req, res){

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    };
    
    var user = req.user.sub;

    if(req.params.user){
        user = req.params.user;
    }

    var itemsPerPage = 4;

    Publication.find({user: user}).sort('-created_at')
        .populate('user')
        .paginate(page, itemsPerPage, (err, publications, total) => {
        
        console.log(err)
            
        if(err) return res.status(500).send({message: 'Error to return publications'});
        

        if(!publications) return res.status(404).send({message: 'There is no publications'});

        return res.status(200).send({
            total_items: total,
            pages: Math.ceil(total/itemsPerPage),
            page,
            items_per_page: itemsPerPage,
            publications
        });
    });
};


function getPublication(req,res){
    var publiacionId = req.params.id;

    Publication.findById(publiacionId, (err, publication)=>{
        if(err) return res.status(500).send({message: 'Error to return the publicatons'});

        if(!publication) return res.status(404).send({message: 'There is no publications'});

        return res.status(200).send({publication});
    });
};

function deletePublication(req,res){
    var publiacionId = req.params.id;

    console.log(req.user.sub);
    Publication.find({'user': req.user.sub, '_id': publiacionId}).remove(err=>{
        if(err) return res.status(500).send({message: 'Error to save the publication'});
           
        return res.status(200).send({message:'Publication has been deleted correctly'});
    });
};

// Upload image publication
function uploadImage(req,res){
    var publicationId  = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;

        var file_split = file_path.split('\/');
        
        var file_name = file_split[2];

        var ext_split = file_name.split('\.');

        var file_ext = ext_split[1];

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            Publication.findOne({'user':req.user.sub, '_id': publicationId}).exec((err, publicacion)=>{
                if(publicacion){
                    //Update document of publication
                    Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new:true}, (err,publicationUpdated) => {
                        if(err) return res.status(404).send({message: 'Error in the request'});

                        if(!publicationUpdated) return res.status(404).send({message: 'The publicaion cant be updated'});
                
                        return res.status(200).send({user: publicationUpdated});
                    })
                }else{
                    return removeFilesOfUploads(res, file_path, 'You dont have privileges for update the publication.')   
                };
            })

        }else{
            //Return an error if file extansion is ivalid
            return removeFilesOfUploads(res, file_path, 'Invalid extension');
        };
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
    var path_file = './uploads/publications/'+image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file))
        }else{
            res.status(200).send({message:'Image do not exist..'});
        };
    });
};

module.exports = {
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile,
    getPublicationsUser
};