var User = require('./userModel');
var Promise = require('promise');

// Return the person by email address in our database
exports.getUserByEmail = ( email ) => {
    return new Promise ( (resolve, reject) => {
        var query = User.findOne({'spark.personEmail': email});
        query.exec().then((person, err) =>{
            if(err)
                reject(err);
            if(person) {
                resolve(person);
            }
            else
                resolve(false);
        });
    });
};

// Return the person by Dropbox UID address in our database
exports.getUserByDbuid = ( dbuserid ) => {
    return new Promise ( (resolve, reject) => {
        var query = User.findOne({'dropbox.uid': dbuserid});
        query.exec().then((person, err) =>{
            if(err)
                reject(err);
            if(person) {
                resolve(person);
            }
            else
                resolve(false);
        });
    });
};

// Check to see if we have a match in our database
exports.checkUserByEmail = ( email ) => {
    return new Promise ( (resolve, reject) => {
        var query = User.findOne({'spark.personEmail': email});
        query.exec().then((person, err) =>{
            if(err)
                reject(err);
            // console.log(typeof person);
            // console.log(person);
            if(person)
                resolve(true);
            if(!person)
                resolve(false);
        });
    });
};


// Update user by using Email Address query
exports.updateUserByEmail = ( email, update ) => {
    return new Promise ( (resolve, reject) => {
        var query = User.findOneAndUpdate({'spark.personEmail': email}, update, {new: true})     
        query.exec().then((person, err) =>{
            if(err)
                reject(err);
            if(person)
                resolve(person);
            if(!person)
                reject('No person object found');
        });
    });
};

exports.updateDbToken = ( email, token ) => {
    var update = {
        'dropbox.uid': token.uid,
        'dropbox.access_token': token.access_token
    };
    return new Promise ( (resolve, reject) => {
        var query = User.findOneAndUpdate({'spark.personEmail': email}, update, {new: true})     
        query.exec().then((person, err) =>{
            if(err)
                reject(err);
            if(person)
                resolve(person);
            if(!person)
                reject('No person object found');
        });
    });
};

exports.updateDbCursor = ( email, cursor ) => {
    var update = {
        'dropbox.cursor': cursor
    };
    return new Promise ( (resolve, reject) => {
        var query = User.findOneAndUpdate({'spark.personEmail': email}, update, {new: true})     
        query.exec().then((person, err) =>{
            if(err)
                reject(err);
            if(person)
                resolve(person);
            if(!person)
                reject('No person object found');
        });
    });
};

// Create new User from Activate Message
exports.createUser = ( message, person ) => {
    return new Promise (( resolve, reject ) => {
        var user = new User({
          displayName: person.displayName,
            spark: {
                personId: message.original_message.personId,
                personEmail: message.original_message.personEmail,
                room: message.channel
            }
        });
        user.save()
        .then((user, err) =>{
          if(err)
            console.error(err);
          console.log('Successfully saved user: ' + user._id);
        });
    });
};