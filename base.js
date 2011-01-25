var fs = require('fs');

function currentDate() {
  var now = new Date();
  return now.getFullYear()+"-"+now.getMonth()+"-"+now.getDate()+"-"+now.getHours()+"-"+now.getMinutes();
}

function Game() {
  this.players = {};
  this.start = false;
}

Game.prototype.initialize = function(total) {
  this.all_players(function(player) {
    player.reset();
  });

  var numbers = [];
  for(var i=1;i<=total;i++) {
    numbers.push(i);
  }

  this.numbers = [];
  while(numbers.length > 0) {
    // magic incantation that extracts a random number from the array generated above
    this.numbers.push(parseInt(numbers.splice(Math.floor(Math.random()*numbers.length), 1)));
  }

  this.remaining_numbers = this.numbers.slice(0, this.numbers.length);
  this.initialized = true;
}

Game.prototype.register_player = function(id, name) {
  var player = new Player(name, id);
  this.players[id] = player;
  return player;
}

Game.prototype.unregister_player = function(id) {
  delete this.players[id];
}

Game.prototype.all_players = function(callback) {
  var result = [];
  for(id in this.players) {
    if(callback) {
      callback(this.players[id]);
    } else {
      result.push(this.players[id]);
    }
  }
  return result
}

Game.prototype.finished = function() {
  return this.remaining_numbers.length == 0;
}

Game.prototype.finish = function() {
  this.dump_clicks();

  this.initialized = false;
  this.start = false;

  this.all_players(function(player) {
    player.reset();
  });
}

Game.prototype.dump_clicks = function() {
  var result = [];
  result.push("time;delta;name;number");

  var prev = 0;
  var clicks = this.clicks_in_order();

  for(var i=0;i<clicks.length;i++) {
    var delta = clicks[i].timestamp - prev;
    result.push(clicks[i].timestamp+";"+delta+";"+clicks[i].player.name+";"+clicks[i].number);
    prev = clicks[i].timestamp;
  }

  fs.writeFile(currentDate()+".csv", result.join("\n"));
}

Game.prototype.valid_click = function(player_id, number) {
  // first click, only accept 1
  if(this.remaining_numbers.length == this.numbers.length) {
    return number == 1;
  }

  var clicks = this.clicks_in_order();
  clicks.reverse();
  return clicks[0].number+1 == number;
}

Game.prototype.click = function(id, number) {
  var now = new Date().getTime();
  if(this.start == false) {
    this.start = now;
  }

  var index = this.remaining_numbers.indexOf(number);
  if(index != -1) {
    this.remaining_numbers.splice(index, 1);
    this.players[id].click(number, (now-this.start));
  }
}

Game.prototype.clicks_in_order = function() {
  var result = [];
  this.all_players(function(player) {
    for(var i=0;i<player.clicks.length;i++) {
      result.push({
        player: player,
        number: player.clicks[i].number,
        timestamp: player.clicks[i].timestamp
      });
    }
  });

  result.sort(function(a, b) {
    return a.timestamp-b.timestamp;
  });

  return result;
}


function Player(name, id) {
  this.name = name;
  this.id = id;
  this.clicks = [];
}

Player.prototype.last_number = function() {
  if(this.clicks.length == 0) {
    return;
  }

  return this.clicks[this.clicks.length-1].number;
}

Player.prototype.click = function(number, timestamp) {
  this.clicks.push({"number": number, "timestamp": timestamp});
}

Player.prototype.reset = function() {
  this.clicks = [];
}

exports["Game"] = Game;
