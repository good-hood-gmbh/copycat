const { App } = require("@slack/bolt");

class AppHelper {
  constructor(app) {
    this.app = app;
  }
  
  async findUser(context, id) {
    try {
      var user = await this.app.client.users.info({
        token: context.botToken,
        user: id
      });
    } catch (error) {
      console.log(error);
    }
    return user
  }
  
  async findMessage(context, channel, timestamp, thread) {
    try {
      if (thread) {
        var message = await this.app.client.conversations.replies({
          token: context.botToken,
          channel: channel, 
          latest: timestamp, 
          inclusive: true,
          limit: 1,
          ts: thread
        })
      } else {
        var message = await this.app.client.conversations.history({
          token: context.botToken,
          channel: channel, 
          latest: timestamp,
          inclusive: true,
          limit: 1
        });  
      }
    } catch (error) {
      console.log(error);
    }
    return message.messages.find(element => element.ts == timestamp)
  }
  
  async postEphemeral(context, channel, user, message) {
    try {
      await this.app.client.chat.postEphemeral({
        token: context.botToken,
        channel: channel,
        text: message,
        user: user
      });
    } catch (error) {
      console.log(error);
      if (error.data.error === 'channel_not_found' || error.data.error === 'not_in_channel') {
        await this.app.client.chat.postMessage({
          token: context.botToken,
          channel: user,
          text: message
        });
      } else {
         console.log(error); 
      }
    }
  }

  async postMessage(context, channel, user, message) {
    try {
      await this.app.client.chat.postMessage({
        token: context.botToken,
        channel: channel,
        text: message
      });
    } catch (error) {
      if (error.data.error === 'channel_not_found' || error.data.error === 'not_in_channel') {
        await this.app.client.chat.postMessage({
          token: context.botToken,
          channel: user,
          text: message
        });
      } else {
         console.log(error.name); 
      }
    }
  }
}

module.exports = {
  AppHelper
}