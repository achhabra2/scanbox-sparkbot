var mongoose = require('mongoose');
var userController = require('./userController');
var env = require('node-env-file');
var Promise = require('promise');

env('../.env');

var Dropbox = require('dropbox');

// Connect to our MongoDB Instance
mongoose.connect(process.env.mongo);
mongoose.Promise = global.Promise;


var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  userController.getUserByEmail('amachhab@cisco.com').then((person) => {
      console.log(person.dropbox.access_token);
        var dbx = new Dropbox( {accessToken: person.dropbox.access_token} );
        dbx.filesListFolder({path: ''})
        .then( (res) => {
            console.log(res.cursor);
        })
        .catch( (err) => {
            console.error(err);
        })
  })
});