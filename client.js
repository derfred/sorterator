if(typeof(Function.prototype.bind) != "function") {
  Function.prototype.bind = function(self, var_args) {
    var thisFunc = this;
    var leftArgs = Array.slice(arguments, 1);
    return function(var_args) {
      var args = leftArgs.concat(Array.slice(arguments, 0));
      return thisFunc.apply(self, args);
    };
  };
}

var json = JSON.stringify;

function Client(port) {
  this.socket = new io.Socket('localhost', {
    port: port,
    transports: ["xhr-multipart"]
  });

  if(this.socket.connect()) {
    this.socket.on('connect', this.connected.bind(this));
    this.socket.on('message', this.message.bind(this));
  }

  $("#registration").submit(this.register.bind(this));
  $("#initialization").submit(this.initialize.bind(this));
  $("a#reset").click(this.reset.bind(this));

  $("#board a").live("click", this.click.bind(this));

  // this tracks the start click time
  this.start = false;
}

Client.prototype.run = function() {
  
}

Client.prototype.connected = function() {
  $("#connecting").hide();
  this.socket.send(json({"action": "inquire"}));
}

// actions coming from the server
Client.prototype.message = function(msg) {
  var data = JSON.parse(msg);
  if(typeof(this["message_"+data.action]) == "function") {
    this["message_"+data.action](data);
  }
}

Client.prototype.message_require_registration = function(data) {
  $("#board *").remove();
  $("#registration").show();
  $("#initialization").hide();
}

Client.prototype.message_require_initialization = function(data) {
  $("#initialization").show();
}

Client.prototype.message_lay_board = function(data) {
  $("#board *").remove();
  $("#board").width(Math.sqrt(data.numbers.length)*100);

  var board = $("#board");
  for(num in data.numbers) {
    $("<a href='#' id='n"+data.numbers[num]+"'>"+data.numbers[num]+"</a>").appendTo(board);
  }
}

Client.prototype.message_clicked = function(data) {
  $("#board #n"+data.number).addClass("clicked");
}

Client.prototype.message_finished = function(data) {
  $("#finished").show();
}

// actions coming from the player
Client.prototype.reset = function(evt) {
  evt.preventDefault();
  $("#initialization").show();
  $("#finished").hide();
  $("#board *").remove();
}

Client.prototype.register = function(evt) {
  evt.preventDefault();
  var player_name = $("#registration").serializeArray()[0].value;
  this.socket.send(json({"action": "registration", "name": player_name}));
  $("#registration").hide();
}

Client.prototype.initialize = function(evt) {
  evt.preventDefault();

  var total = $("#initialization").serializeArray()[0].value;
  this.socket.send(json({"action": "initialization", "total": total}));

  $("#initialization").hide();
  this.start = false;
}

Client.prototype.click = function(evt) {
  evt.preventDefault();
  var target = $(evt.target);

  if(target.is(".clicked")) {
    return;
  }

  this.socket.send(json({
    "action": "click",
    "number": target.html()
  }));
}
