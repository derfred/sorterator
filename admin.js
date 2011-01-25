function AdminClient(port) {
  
}

AdminClient.prototype.update_users = function() {
  $.getJSON("/users", function(data) {
    console.log(data.length)
  });
}
