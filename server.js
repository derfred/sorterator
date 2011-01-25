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
}

GameServer.prototype.disconnect = function(client) {
  this.game.unregister_player(client.sessionId);
}

GameServer.prototype.listen = function(port) {
  this.server = http.createServer(this.handle_request.bind(this));
  this.server.listen(port);

  this.socket = io.listen(this.server);
  var game_server = this;
  this.socket.on('connection', function(client){
    client.on('message', game_server.handle_message.bind(game_server, client));
    client.on('disconnect', this.disconnect.bind(this, client));
  }.bind(this));
}

GameServer.prototype.message_initialization = function(client, data) {
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

      response.writeHeader(200);
      response.end(file);
    }.bind(this));
  }.bind(this));
}

// start the server
var server = new GameServer();
server.listen(8000);
