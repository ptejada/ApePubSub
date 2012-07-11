$(document).ready(function(){
	start("ape2.crusthq.com");
})

function start(server){
	
	window.chanName = "testingRoom";
	//window.chanName = "test" + randomString(1);
	window.client = new APS(server);
	
	client.user.name = "test" + randomString(2);
	client.options.session = false;
	client.debug = true;
	
	var Events = {
		
		joined: function(user, channel){
			//4
			addLine("Subscribed to channel <u>" + channel.name +"</u>");
			//5
			addLine("Waiting for <u>bot</u> nodes...");
			//$("<iframe/>").attr("src", "./bot.htm").appendTo("body");
		},
		join: function(user, channel){
			//6
			addLine("New node connected on channel <u>" + channel.name +"</u>");
		},
		left: function(user, channel){
			
		},
		message: function(message, from, channel){
			
		},
		data: function(data, from, channel){
			
		}
	};
	
	//1
	addLine("Connecting to APE Server <u>" + server +"</u>");
	client.on({
		ready: function(){
			//2
			addLine("Client is now connected");
			//3
			addLine("Subscribing to <u>"+chanName+"</u> channel");
		},
		dead: function(){
			//.*
			addLine("Server connection failed!");
		}
	})
	
	/*
	 * Subscribe to channel
	 */
	
	client.sub(chanName, Events);
}


function addLine(content){
	$("#console").append("<div><b>>> </b>"+content+"</div>");
}
