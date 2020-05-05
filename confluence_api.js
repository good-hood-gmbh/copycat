var API = require('confluence-restapi');

class ConfluenceAPI {
  constructor() {
    this.api = API.create({
      user: process.env.WIKI_NAME,
      password: process.env.WIKI_PASS,
      baseUrl: process.env.WIKI_URL
    })
  }
  
  findPage(id) {
    const params = {
      embeddedContentRender : "current",
      status: "current"
    }
    const api = this.api;
    return new Promise(function(resolve, reject) {
      api.content.getContentById(id, params, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });  
    })
  }

  updateContent(id, request) {
    const params = {
      conflictPolicy: "abort",
      status : 'current'
    };
    const api = this.api;
    return new Promise(function(resolve, reject) {
      api.content.updateContent(id, params, request, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    })
  }

  getContent(id) {
    const params = {
      embeddedContentRender: "current",
      status: 'current',
      expand: "body.storage"
    };
    const api = this.api;
    return new Promise(function(resolve, reject) {
      api.content.getContentById(id, params, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    })
  }

  async appendMessages(id, messages, channel, user) {
    const data = await this.findPage(id);
    const content = await this.getContent(id);
    
    let startCode = `<ac:structured-macro ac:name="code" ac:schema-version="1" ac:macro-id="${this.createUUID()}"><ac:plain-text-body><![CDATA[`;
    let endCode = `]]></ac:plain-text-body></ac:structured-macro>`;
    
    const postedContent = messages.map( message => {
      let formatted = message.content.replace(/```([^]*?)```/g, `${startCode}$1${endCode}`);
      return `<a href="${message.link.replace("&", "&amp;")}">${new Date(Math.floor(message.timestamp) * 1000).toLocaleString()} by ${message.user}</a><br />
      ${formatted}`
    }).join("<br/><br/>");

    let value = `${content.body.storage.value}<br /><p><b>${new Date(Date.now()).toLocaleDateString()} UPD from #${channel} by ${user}:</b><br />${postedContent}</p>`;
    
    const request = {
      id: id,
      status: "current",
      title: data.title,
      type: "page",
      space: { key: data.space.key },
      version: { number: data.version.number + 1 },
      body: {
        storage: {
          value: value,
          representation: "storage"
        }
      }
    }
    try {
     await this.updateContent(id, request);   
    } catch (error) {
      console.log(error);
    }
  }
  
  createUUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
  }
}

module.exports = {
  ConfluenceAPI
}