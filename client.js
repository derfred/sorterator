var json = JSON.stringify;

function Client(port) {
  this.socket = new io.Socket(null, {
    port: port,
    rememberTransport: false
  });

  if(this.socket.connect()) {
    this.socket.on('connect', $.proxy(this.connected, this));
    this.socket.on('message', $.proxy(this.message, this));
  }

  $("#registration").submit($.proxy(this.register, this));

  $("#board a").live("click", $.proxy(this.click, this));

  // this tracks the start click time
  this.start = false;
}

Client.prototype.run = function() {
  
}

Client.prototype.connected = function() {
  $("#connecting").hide();
  $("#registration").show();
}

// actions coming from the server
Client.prototype.message = function(msg) {
  var data = JSON.parse(msg);
  if(typeof(this["message_"+data.action]) == "function") {
    this["message_"+data.action](data);
  }
}

Client.prototype.message_wait = function(data) {
  $("#please_wait").show();
}

Client.prototype.message_lay_board = function(data) {
  $("#board *").remove();
  $("#board").width(Math.ceil(Math.sqrt(data.numbers.length))*300);

  var board = $("#board");
  for(num in data.numbers) {
    $("<a href='#' id='n"+data.numbers[num]+"'>"+data.numbers[num]+"</a>").appendTo(board);
  }
}

Client.prototype.message_clicked = function(data) {
  $("#board #n"+data.number).addClass("clicked");
}

Client.prototype.message_reset = function(data) {
  $("#please_wait").hide();
  $("#finished").hide();
  $("#board *").remove();
  $("#registration").show();
}

Client.prototype.message_finished = function(data) {
  $("#finished").show();
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
