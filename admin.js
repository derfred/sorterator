var json = JSON.stringify;

function AdminClient(port) {
  this.socket = new io.Socket(null, {
    port: port,
    rememberTransport: false
  });

  if(this.socket.connect()) {
    this.socket.on('message', $.proxy(this.message, this));
  }

  $("#player_list a").live("click", $.proxy(this.kick_player, this));
  $("#initialization").submit($.proxy(this.start_game, this))
}

AdminClient.prototype.update_players = function() {
  $.getJSON("/players", $.proxy(this.update_players_div, this));
}

AdminClient.prototype.message_update_players = function(data) {
  this.update_players_div(data.players);
}

AdminClient.prototype.update_players_div = function(players) {
  $(".player_lists").hide();
  if(players.length == 0) {
    $("#empty_player_list").show();
  } else {
    $("#player_list *").remove();
    $("#player_list").show();

    for(var i=0;i<players.length;i++) {
      $("<li>"+players[i].name+" <a href='"+players[i].id+"'>Kick</a></li>").appendTo("#player_list");
    }
  }
}


AdminClient.prototype.start_game = function(e) {
  e.preventDefault();
  this.socket.send(json({
    "action": "start_game",
    "total": $("#total").val()
  }));
}

AdminClient.prototype.kick_player = function(e) {
  e.preventDefault();
  this.socket.send(json({
    "action": "kick_player",
    "id": $(e.target).attr("href")
  }));
}


AdminClient.prototype.message = function(msg) {
  var data = JSON.parse(msg);
  if(typeof(this["message_"+data.action]) == "function") {
    this["message_"+data.action](data);
  }
}
