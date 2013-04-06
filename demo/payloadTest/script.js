$(document).ready(function(){
	var client = new APS("ape.crusthq.com:45138", null, {
		debug: false,
		transport: (window.location.hash).substring(1) || ["wb","lp"],
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
	$("a").on("click", function(e){
		e.preventDefault();
		window.location.hash = $(this).attr("href");
		window.location.reload();
	})
	$(window.location.hash).css({
		padding: "5px 8px",
		background: "#000",
		color: "#fff"
	});
})
