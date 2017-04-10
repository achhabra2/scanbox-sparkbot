module.exports = function(controller) {
  // apiai.hears for intents. in this example is 'hello' the intent
  controller.hears(['hello'],'direct_message,direct_mention',function(bot, message) {
    var mdMessage = 'Welcome. I am the *ScanBox Bot*. I will help you automatically upload documents to a Spark Space from a Dropbox Folder. Please refer to the ``help`` command for more information. ';
    bot.reply(message, {markdown: mdMessage});
  });
};