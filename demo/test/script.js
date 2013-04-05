$(document).ready(function(){
	var client = new APS("ape2.crusthq.com:53630", null, {
		debug: false,
		transport: "lp", // lp || wb
		session: false
	});
    
	window.client = client;
	
	var chan = randomString(8);
	window.sendPayload = function(times){
		for(var i = 0; times > i; i++){
			this.send("something", {value: true}, true);
		}
		$("#sent").text(function(index, text){
            return parseInt(text) + times;
        })
	}
	/*
	 * Subscribe to channel
	 */
	client.sub(chan, {
		joined: function(user, channel){
          sendPayload = sendPayload.bind(channel);
          $("form").show();
		},
		something: function(){
          $("#recieved").text(function(index, text){
            return parseInt(text) + 1;
          })
		}
	});
	
  $("form").on("submit", function(e){
    e.preventDefault();
    var load = parseInt($("#load").val());
    sendPayload(load)
  }).hide()
	
})
