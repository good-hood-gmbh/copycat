class Views {
  constructor() {
  }
  
  setupWiki(channel, url) {
    return {
            "callback_id": "setup_callback",
            "type": "modal",
            "title": {
              "type": "plain_text",
              "text": "Wiki Config",
              "emoji": true
            },
            "submit": {
              "type": "plain_text",
              "text": "Save",
              "emoji": true
            },
            "close": {
              "type": "plain_text",
              "text": "Cancel",
              "emoji": true
            },
            "blocks": [
              {
                "type": "input",
                block_id: "channel_select",
                "element": {
                  "type": "channels_select",
                  "response_url_enabled": true,
                  "placeholder": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Select a channel"
                  },
                  initial_channel: channel,
                  action_id: "channel_id"
                },
                "label": {
                  "type": "plain_text",
                  "text": "Channel",
                  "emoji": true
                }
              },
              {
                "type": "input",
                "block_id": "url",
                "element": {
                  "type": "plain_text_input",
                  "action_id": "url_value",
                  "placeholder": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Identifier"
                  },
                  initial_value: url ? url : ''
                },
                "label": {
                  "type": "plain_text",
                  "text": "ID of spec:",
                  "emoji": true
                }
              }
            ]
          }
  }
}

module.exports = {
  Views
}