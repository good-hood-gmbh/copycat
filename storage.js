const fs = require('fs');

class Storage {
  constructor() {
    this.map = {};
    this.load();
  }

  load() {
    try {
      let data = fs.readFileSync('data.json');
      this.map = JSON.parse(data);  
    }
    catch (error) {
      this.map = {};
    }
  }

  save() {
    let data = JSON.stringify(this.map);
    fs.writeFileSync('data.json', data);
  }  
  
  contains(channel) {
    return channel in this.map
  }
  
  getWikiId(channel) {
    return this.map[channel]
  }
  
  saveWikiId(channel, id) {
    this.map[channel] = id;
    this.save();
  }
}

module.exports = {
  Storage
}