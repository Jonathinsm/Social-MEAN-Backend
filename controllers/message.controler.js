const moment = require('moment');
const Message = require('../models/message');
const paginate = require('../middlewares/paginate');

const messageCtrl = {};

//Save a menssage
messageCtrl.saveMessage = (req,res)=>{
    var params = req.body;
    if(!params.text || !params.receiver) return res.status(200).send({message: 'Not enough data'});
    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = 'false';
    message.save((err, messageStored)=>{
        if(err) return res.status(500).send({message: 'Error in the request'});
        if(!messageStored) return res.status(404).send({message: 'Error to send the message'});
        return res.status(200).send({message: messageStored});        
    });
};

//Return the received messages
messageCtrl.getReceivedMessages = (req,res)=>{
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Message.find({receiver: userId})
    .populate('emitter', 'name surname nick image _id')
    .sort('-created_at')
    .paginate(page, itemsPerPage, (err, messages, total)=>{
        if(err) return res.status(500).send({message: 'Error in the request'});
        if(!messages) return res.status(404).send({message: 'There is no messages'});
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });
};

//Get the sended messages
messageCtrl.getEmmitMessages = (req,res)=>{
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    };
    var itemsPerPage = 4;
    Message.find({emitter: userId})
    .populate('emitter receiver', 'name surname nick image _id')
    .sort('-created_at')
    .paginate(page, itemsPerPage, (err, messages, total)=>{
        if(err) return res.status(500).send({message: 'Error in the request'});
        if(!messages) return res.status(404).send({message: 'There is no messages'});

        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });
};

//Get the messages not viewed
messageCtrl.getUnviewedMessages = (req,res)=>{
    var userId = req.user.sub;
    Message.count({receiver:userId, viewed:'false'}).exec((err, count) => {
        if(err) return res.status(500).send({message: 'Error in the resuest'});
        return res.status(200).send({
            'unviewed': count
        });
    });
};

//Get the messages viewed
messageCtrl.setViewedMessages = (req,res)=>{
    var userId = req.user.sub;
    Message.update({receiver:userId, viewed:'false'}, {viewed:'true'},{'multi':true}, (err, messagesUpdated)=>{
        if(err) return res.status(500).send({message: 'Error in the request'});
        return res.status(500).send({messages: messagesUpdated});
    });
};

module.exports = messageCtrl;