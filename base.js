var sys = require('fs');

function Game() {
  this.players = {};
}

Game.prototype.initialize = function(total) {
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
  var player = new Player(name);
  this.players[id] = player;
  return player;
}

Game.prototype.all_players = function(callback) {
  for(id in this.players) {
    callback(this.players[id]);
  }
}

Game.prototype.finished = function() {
  return this.remaining_numbers.length == 0;
}

Game.prototype.finish = function() {
  this.initialized = false;
  this.all_players(function(player) {
    player.reset();
  });
}

Game.prototype.valid_click = function(player_id, number) {
  var player = this.players[player_id];

  // first check if this is the first click for this player
  // then he can choose any number
  if(player.last_number() == undefined) {
    return true;
  }
  
  // then check if it has been clicked by anyone already
  if(this.remaining_numbers.indexOf(number) == -1) {
    return false;
  }

  // then check if it is consequtive to a number any one else just clicked
  // adjust this for different rules
  for(id in this.players) {
    var last_number = this.players[id].last_number();
    if(last_number) {
      if(last_number == this.numbers.length && number == 1) {
        return true;
      } else if(last_number+1 == number) {
        return true;
      }
    }
  }

  // else this fails
  return false;
}

Game.prototype.click = function(id, number, timestamp) {
  var index = this.remaining_numbers.indexOf(number);
  if(index != -1) {
    this.remaining_numbers.splice(index, 1);
    this.players[id].click(number, timestamp);
  }
}


function Player(name) {
  this.name = name;
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
