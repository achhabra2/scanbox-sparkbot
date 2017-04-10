var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Defining MongoDB Schema for the users
var userSchema = new Schema({
    displayName: String,
    spark: {
        personId: String,
        personEmail: String,
        room: String
    },
    dropbox: {
        uid: String,
        account_id: String,
        access_token: String,
        cursor: String
    },
    createdOn: { 
        type: Date, 
        default: Date.now()
    }
});

module.exports = mongoose.model('User', userSchema);