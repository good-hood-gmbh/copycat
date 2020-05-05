// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");
const { AppHelper } = require('./app_helper.js');
const { ConfluenceAPI } = require('./confluence_api.js');
const { Storage } = require('./storage.js');
const { Views } = require('./views.js');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const appHelper = new AppHelper(app);
const api = new ConfluenceAPI();
const storage = new Storage();
const views = new Views();

// All the room in the world for your code
app.command('/wiki', async ({ ack, command, context, say, body }) => {
  // Acknowledge command request
  await ack();
  
  if (!storage.contains(command.channel_id) && command.text !== 'setup') {
    await appHelper.postEphemeral(context, command.channel_id, command.user_id, 'Wiki is not configured for this channel. Please, use `/wiki setup`.');
    
    return
  }
  
  if (command.text === 'setup') {
    try {
      let url = storage.getWikiId(command.channel_id);
      await app.client.views.open({
          token: context.botToken,
          trigger_id: body.trigger_id,
          view: views.setupWiki(command.channel_id, url)
        });
    }
    catch (error) {
      console.log(error);
    }  
  } else {
    const id = storage.getWikiId(command.channel_id);
    const messageParams = command.text.split(/\r?\n|\s/).map(object => {
      try {
        const url = new URL(object);
        const components = url.pathname.split("/");
        const id = components[3].slice(1);
        const timestamp = id.slice(0, id.length - 6) + "." + id.slice(id.length - 6, id.length);
        return { link: object, channel_id: components[2], timestamp: timestamp, thread: url.searchParams.get("thread_ts") };  
      } catch (error) {
        return undefined
      }
    }).filter(object => object);

    let messages = []
    for (const message of messageParams) {
      let result = await appHelper.findMessage(context, message.channel_id, message.timestamp, message.thread);
      let user = await appHelper.findUser(context, result.user);
      
      messages.push({ link: message.link, timestamp: message.timestamp, user: user.user.real_name, content: result.text });
    }

    try {
      api.appendMessages(id, messages, command.channel_name, command.user_name);  
    } catch (error) {
      console.log(error);
    }
  }
  
});

app.shortcut('upload_spec', async ({ ack, shortcut, context, client }) => {
  await ack();
  
  console.log(shortcut);
  
  let id = storage.getWikiId(shortcut.channel.id);
  console.log(id);
  if (!id) {
    try {
      await appHelper.postEphemeral(context, shortcut.channel.id, shortcut.user.id, 'Wiki is not configured for this channel. Please, use `/wiki setup`.');  
    } catch (error) {
      console.log(error);
    }
    
    return;
  }
  
  const user = await appHelper.findUser(context, shortcut.message.user);
  const link = await app.client.chat.getPermalink({ token: context.botToken, channel: shortcut.channel.id, message_ts: shortcut.message_ts });
  api.appendMessages(id, 
                     [{ content: shortcut.message.text, user: user.user.real_name, timestamp: shortcut.message_ts, link: link.permalink }], 
                     shortcut.channel.name, 
                     shortcut.user.name);
});

app.view('setup_callback', async ({ ack, payload, context, body }) => {
  await ack();
  
  console.log(payload);
  
  const user = body['user']['id'];
  let id = payload.state.values.url.url_value.value;
  let channel = payload.state.values.channel_select.channel_id.selected_channel;
  var url = '';
  
  try {
    const data = await api.findPage(id);
    if (!data) { return; }

    storage.saveWikiId(channel, id);
    url = data._links.base + data._links.webui;
  }
  catch (error) {
    console.log(error);
  }
  if (url) {
    try {
      await app.client.conversations.join({
        token: context.botToken,
        channel: channel,
      });  
    } catch (e) { 
      console.log(e); 
    }
    
    await appHelper.postMessage(context, channel, user, 'Spec with url: ' + url + ' has been connected with this channel! :tada:');
  } else {
    await appHelper.postEphemeral(context, channel, user, 'The spec id(' + id + ') is not correct. Please, try another one.');
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
