$(document).ready(function(){
	var client = new APS(ServerDomain, null, {
		debug: EnableDebug,
		transport: (window.location.hash).substring(1) || ["ws","lp"],
		session: EnableSession
	});
	
	if(EnableDebug)
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
	$("a").on("click", function(e){
		e.preventDefault();
		window.location.hash = $(this).attr("href");
		window.location.reload();
	})
	$(window.location.hash).parent().addClass("active");
})
