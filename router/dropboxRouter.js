'use strict'

var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var Dropbox = require('dropbox');
var User = require('../models/userController');
var Promise = require('promise');
var spark = require('ciscospark');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

const credentials = {
  client: {
    id: process.env.db_client_id,
    secret: process.env.db_client_secret
  },
  auth: {
    tokenHost: 'https://api.dropboxapi.com',
    tokenPath: '/oauth2/token',
    authorizeHost: 'https://www.dropbox.com',
    authorizePath: '/oauth2/authorize',
    revokePath: '/oauth2/revoke'
  },
  options: {
      bodyFormat: 'form',
      useBasicAuthorizationHeader: 'False'
  }
};

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);

// Authorization uri definition
const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: process.env.public_address + '/dropbox/callback',
  // scope: 'notifications',
  // state: '3(#0/!~',
});

router.authorizationUri = authorizationUri;

var currentAuth;
// Initial page redirecting to Github
router.get('/auth/:email', (req, res) => {
    currentAuth = req.params.email;
    console.log(authorizationUri);
    res.redirect(authorizationUri);
});

// Callback service parsing the authorization token and asking for the access token
router.get('/callback', (req, res) => {
    const return_code = req.query.code;
    console.log('Returned code from dropbox: ' + return_code);
    const options = {
        code: return_code,
        redirect_uri: process.env.public_address + '/dropbox/callback'
    };

    oauth2.authorizationCode.getToken(options)
        .then((result) => {
            console.log('Token obtained successfully');
            res.redirect('success');
            User.updateDbToken(currentAuth, result)
            .then( (person) =>{
                console.log('Succesfully DB Updated Person');
                return generateCursor(person);
            })
            .then( (filesListResult) => {
                return User.updateDbCursor(currentAuth, filesListResult.cursor);
            })
            .catch( (err) => {
                console.error(err);
            });
        })
        .catch((error) => {
            console.log('Access Token Error', error.message);
            res.redirect('failure');
        });
});

router.get('/success', (req, res) => {
    res.send('Authorization Successful, please close this window!');
});

router.get('/failure', (req, res) => {
    res.send('Authorization failed, please try again later. ');
});

router.get('/', (req, res) => {
    res.send('Hello<br><a href="/auth">Log in with Dropbox</a>');
});

router.get('/webhook', (req, res) => {
    console.log('Received Dropbox Challenge');
    res.send(req.query.challenge);
});

router.post('/webhook', (req, res) => {
    // Receive Incoming WebHook From Dropbox
    console.log('Received Dropbox Webhook');
    // Send 200 OK Response
    res.status(200).end();
    // For each user that has logged a change, let's check the changes
    updateUsers(req.body.delta.users);
});

var generateCursor = ( person ) => {
    return new Promise( ( resolve, reject ) => {
        var dbx = new Dropbox( {accessToken: person.dropbox.access_token} );
        dbx.filesListFolder({path: ''})
        .then( (res) => {
            resolve(res);
        })
        .catch( (err) => {
            reject(err);
        });
    });
};

var getDbFileUpdate = ( person ) => {
    var roomId = person.spark.room;
    var access_token = person.dropbox.access_token;
    var cursor = person.dropbox.cursor;
    var email = person.spark.personEmail;
    return new Promise ( ( resolve, reject ) => {
        //Initialize new Dropbox Instance
        if (access_token && cursor) {
            var dbx = new Dropbox({ accessToken: access_token });
            // List Files for a particular user that have changed since last cursor
            dbx.filesListFolderContinue( {cursor: cursor} )
            .then((res) => {
                console.log('Received File Entries & New Cursor.');
                console.log(res.cursor);
                User.updateDbCursor(email, res.cursor)
                .then((person) =>{
                    console.log('Updated cursor');
                })
                .catch((err) =>{
                    console.log('Error Updating Cursor. ');
                    console.error(err);
                })
                if(res.entries.length > 0) {
                    res.entries.forEach( file => {
                        if(file['.tag'] != 'deleted') {
                            var path = file.path_display;
                            dbx.filesGetTemporaryLink({path: path})
                            .then( fileResponse => {
                                console.log('Pulled File Response Successful.');
                                var message = {
                                    text: 'A File was recently uploaded: ',
                                    roomId: roomId,
                                    files: fileResponse.link
                                };
                                return spark.messages.create( message );
                            })
                            .then( (result) =>{
                                console.log('Sent File to Spark Succesful. ');
                            })
                            .catch( (err) => {
                                console.log('Error iterating file send. ');
                                console.error(err);
                            });
                        }
                    });
                }
            })
            .catch( (err) =>{
                console.log('Error in Get Files Post Webhook: ');
                console.error(err);
            });
        }
        else {
            reject('Access token or Cursor Missing from person Object. ');
        }
    });
};

var updateUsers = (usersArray) => {
    // Obtain Dropbox Token from MongoDB According to Dropbox User ID
    // Also must Obtain Spark info from MongoDB
    usersArray.forEach( (dbuserid) => {
        User.getUserByDbuid(dbuserid)
        .then( (person) => {
            console.log('Passing person object');
            return getDbFileUpdate(person);
        })
        .catch( (err) => {
            console.error(err);
        });
    });
};

module.exports = router;