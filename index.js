const mongoose = require ('mongoose');
const app = require('./app');

mongoose.connect('mongodb://localhost:27017/mean_social', { useNewUrlParser: true })
    .then(() =>{
        console.log('Database Connected');
        //Create server
        app.set('port', process.env.PORT || 3000)
        app.listen(app.get('port'), () => {
            console.log('Server on port', app.get('port'));
        });
    },
    err => {
        console.log(err);
    }
);