module.exports = function(controller) {
  // apiai.hears for intents. in this example is 'hello' the intent
  controller.hears(['help'],'direct_message,direct_mention',function(bot, message) {
    var mdMessage = 'My commands are: <br>';
    mdMessage += '1. ``activate`` - Start Dropbox Authorization to activate my functions. Please open a 1:1 Chat to activate. <br>';
    mdMessage += '2. ``deactivate`` - Deactivate my functions. Please open a 1:1 Chat to deactivate. <br>';
    mdMessage += '3. ``room`` - Tag me in a new room to change the room you want me to upload the files to. ';
    bot.reply(message, {markdown: mdMessage});
  });
};