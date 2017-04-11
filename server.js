if(process.env.NODE_ENV != 'production') {
  var env = require('node-env-file');
  env('./.env');
}

process.env.CISCOSPARK_ACCESS_TOKEN = process.env.access_token;

var config = require('./config'),
    mongoose = require('mongoose'),
    Botkit = require('botkit'),
    spark = require('ciscospark'),
    User = require('./models/userController');

var dropboxRouter = require('./router/dropboxRouter');
var userRouter = require('./router/userRouter');

// Connect to our MongoDB Instance
mongoose.connect(config.mongoaddr);
mongoose.Promise = global.Promise;

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.sparkbot({
    // debug: true,
    public_address: process.env.public_address,
    ciscospark_access_token: process.env.access_token,
    studio_token: process.env.studio_token, // get one from studio.botkit.ai to enable content management, stats, message console and more
    secret: process.env.secret, // this is an RECOMMENDED but optional setting that enables validation of incoming webhooks
    webhook_name: 'Cisco Spark bot created with Botkit, override me before going to production',
    studio_command_uri: process.env.studio_command_uri,
});

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller);
});

var bot = controller.spawn({});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log("Cisco Spark: Webhooks set up!");
    });
});


controller.hears(['activate'], 'direct_message', function(bot, message) {
    // Start the OAUTH2 Process for Dropbox
    User.checkUserByEmail(message.original_message.personEmail)
    .then( (user) => {
      if(user) {
        bot.reply(message, 'Seems like you have already activated your Dropbox account. ');  
      }
      else {
        var authUrl = '##[Click Here]' + '(' + process.env.public_address + '/dropbox/auth/' + message.original_message.personEmail + ')';
        var mdMessage = 'Please Authenticate via Dropbox <br>' + authUrl;
        bot.reply(message, {markdown: mdMessage});
        spark.people.get(message.original_message.personId)
          .then((person) => {
            return User.createUser( message, person);
          });
      }
    });
});

controller.hears(['room'], 'direct_message,direct_mention', function(bot, message) {
    // Start the OAUTH2 Process for Dropbox
    User.checkUserByEmail(message.original_message.personEmail)
    .then( (user) => {
      if(user) {
        var update = {
          'spark.room': message.original_message.roomId
        };
        User.updateUserByEmail(message.original_message.personEmail, update)
        .then( ( person ) =>{
          console.log('Updated Notification Room For Person: ' + person.displayName);
        })
        .catch( (err) =>{
          console.error(err);
        });
        bot.reply(message, 'Ok - I will now post your files to this Spark Space. ');  
      }
      else {
        bot.reply(message, 'Looks like you have not activated your dropbox account with me. ');
      }
    });
});

controller.webserver.use('/dropbox', dropboxRouter );
controller.webserver.use('/scanuser', userRouter );