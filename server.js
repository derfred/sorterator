var http = require('http'), 
    io = require('./socket.io'),
    sys = require('sys'),
    path = require('path'),  
    fs = require('fs'),
    url = require("url"),
    base = require('./base'),
    json = JSON.stringify;


function GameServer() {
  this.game = new base.Game();
  this.clients = {};
}

GameServer.prototype.listen = function(port) {
  this.server = http.createServer(this.handle_request.bind(this));
  this.server.listen(port);

  this.socket = io.listen(this.server);
  var game_server = this;
  this.socket.on('connection', function(client) {
    this.clients[client.sessionId] = client;
    client.on('message', game_server.handle_message.bind(game_server, client));
    client.on('disconnect', this.disconnect.bind(this, client));
  }.bind(this));
}

GameServer.prototype.disconnect = function(client) {
  this.game.unregister_player(client.sessionId);
  this.broadcast_update_players();
  delete this.clients[client.sessionId];
}

GameServer.prototype.broadcast_update_players = function() {
  this.socket.broadcast(json({
    "action": "update_players",
    "players": this.game.all_players()
  }));
}

GameServer.prototype.message_start_game = function(client, data) {
  this.game.initialize(parseInt(data.total));
  this.socket.broadcast(json({
    "action": "lay_board",
    "numbers": this.game.numbers
  }));
}

GameServer.prototype.message_registration = function(client, data) {
  this.game.register_player(client.sessionId, data.name);
  client.send(json({
    "action": "wait"
  }));
  this.broadcast_update_players();
}

GameServer.prototype.message_kick_player = function(client, data) {
  if(this.clients[data.id]) {
    this.clients[data.id].send(json({
      "action": "reset"
    }));
    this.game.unregister_player(data.id);
    this.broadcast_update_players();
  }
}

GameServer.prototype.message_click = function(client, data) {
  var number = parseInt(data.number);
  if(this.game.valid_click(client.sessionId, number)) {
    this.game.click(client.sessionId, number);

    this.socket.broadcast(json({
      "action": "clicked",
      "number": number
    }));

    if(this.game.finished()) {
      this.socket.broadcast(json({
        "action": "finished",
      }));

      this.game.finish();
    }
  }
}


/*
**  the stuff below this line is not that interesting
*/

GameServer.prototype.handle_message = function(client, msg) {
  var data = JSON.parse(msg);
  if(typeof(this["message_"+data.action]) == "function") {
    this["message_"+data.action](client, data);
  }
}

GameServer.prototype.handle_players = function(request) {
  return json(this.game.all_players());
}

GameServer.prototype.request_handler_for = function(request) {
  var handler = this["handle_"+request.url.substring(1)];
  if(typeof(handler) == "function") {
    return handler.bind(this);
  } else {
    return false;
  }
}

GameServer.prototype.handle_request = function(request, response) {
  if(request.url == "/") {
    this.serve_static_file(response, "index.html");
  } else if(this.request_handler_for(request)) {
    try {
      var body = this.request_handler_for(request)(request, response);
      response.writeHeader(200);
      response.end(body);
    } catch(err) {
      this.serve_error(err)
    }
  } else {
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);
    this.serve_static_file(response, filename);
  }
}

GameServer.prototype.serve_error = function(response, err) {
  response.writeHeader(500, {"Content-Type": "text/plain"});
  if(err) {
    response.write(err + "\n");
  }
  response.end();
}

GameServer.prototype.serve_not_found = function(response) {
  response.writeHeader(404, {"Content-Type": "text/plain"});
  response.end("404 Not Found\n");
}

GameServer.prototype.serve_static_file = function(response, filename) {
  path.exists(filename, function(exists) {
    if(!exists) {
      this.serve_not_found(response);
      return;
    }

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        this.serve_error(response, err);
        return;
      }
      var trans_properties = this.identify(filename);
      response.writeHeader(200, trans_properties.header);
      response.end(file, trans_properties.encoding);
    }.bind(this));
  }.bind(this));
}

GameServer.prototype.identify = function(filename) {
  if(filename.match(/\.mp3$/)) {
    return {
      encoding: "binary",
      header: {"Content-Type": "audio/mpeg"}
    };
  } else if(filename.match(/\.ogg$/)) {
    return {
      encoding: "binary",
      header: {"Content-Type": "audio/vorbis"}
    };
  } else {
    return {};
  }
}

// start the server
var server = new GameServer();
server.listen(8000);
