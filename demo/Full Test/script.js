$(document).ready(function(){
	start("ape2.crusthq.com");
})

function start(server){
	
	//window.chanName = "testingRoom";
	window.chanName = "test_" + randomString(2);
	window.client = new APS(server);
	
	client.option.session = false;
	client.debug = true;
	
	var Events = {
		
		joined: function(user, channel){
			//4
			addLine("Subscribed to channel <u>" + channel.name +"</u>");
			//5
			addLine("Waiting for <u>bot</u> nodes...");
			$("<iframe/>").attr("src", "./bot.htm").attr("id","bot").appendTo("body");
		},
		join: function(user, channel){
			//6
			addLine("New node connected on channel <u>" + channel.name +"</u>");
			//7
			addLine("Waiting for payload...");
		},
		left: function(user, channel){
			
		},
		message: function(message, from, channel){
			switch(message){
				case "Hello World":
					//8
					addLine("Recived simple string on <u>"+channel.name+"</u> from <u>bot</u>")
					break;
				case "Th!s i$ a Ve&ryC0pLeX $trying !@#$%^&* ()_+=- `~?>< \{][?]},.":
					//10
					addLine("Recived complex string on <u>"+channel.name+"</u> from <u>bot</u>")
				
					break;
			}
			//9,11
			addLine("<i>" +message+ "</i>");
		},
		data: function(data, from, channel){
			switch(data.type){
				case "simple":
					//12
					addLine("Recived simple Object on <u>"+channel.name+"</u> from <u>bot</u>")
					break;
				case "complex":
					//13
					addLine("Recived complex Object on <u>"+channel.name+"</u> from <u>bot</u>");
					//14
					addLine("Testing custom event sent on <u>"+channel.name+"</u>");
					break;
			}
		},
		payload: function(data, from, channel){
			if(data.inprogress == "yes")
				//15
				addLine("Custom event <u>payload</u> recieved!");
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
