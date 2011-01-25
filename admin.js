function AdminClient(port) {
  
}

AdminClient.prototype.update_players = function() {
  $.getJSON("/players", $.proxy(this.update_players_div, this));
}

AdminClient.prototype.update_players_div = function(players) {
  $(".player_lists").hide();
  if(players.length == 0) {
    $("#empty_player_list").show();
  } else {
    $("#player_list").show();

    for(var i=0;i<players.length;i++) {
      $("<li>"+players[i].name+" <a href='"+players[i].id+"'>Kick</a></li>").appendTo("#player_list");
    }
  }
}
