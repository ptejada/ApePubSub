$(document).ready(function(){
	var server = "ape2.crusthq.com";
	addLine("You must enter a server address or leave it blank to the default server.");
	addLine("<form>APE Server: <input type='text' value=''></form>");
	
	var input = $("form input");
	//input.val('');
	//input.focus().val(server);
	input.focus()
	
	$("form").on("submit", function(){
		if(input.val() == "")
			input.val(server);
		start(input.val());
		input.prop("disabled", true);
		return false;
	});
})

function addLine(content){
	$("#console").append("<div><b>>> </b>"+content+"</div>");
}

function start(server){
	setTimeout(function(){
		if(client.state == 0){
			addLine("Can't connect to APE Server <a target='_blank' href='http://"+server+"'>"+server+"</a>");
			addLine("Make sure the APS framework is installed and server is running");
		}
	},2000);	
	
	window.chanName = "test_" + randomString(4).toLowerCase();
	window.client = new APS(server);
	client.option.session = false;
	
	var bot = {};
	
	var Events = {
		
		joined: function(user, channel){
			//4
			addLine("Subscribed to channel <u>" + channel.name +"</u>");
			//5
			addLine("Waiting for <u>bot</u> nodes...");
			$("<iframe/>").attr("src", "./bot.htm").attr("id","bot")
				.css("display","none").appendTo("body");
		},
		join: function(user, channel){
			bot = client.getPipe(user.pubid);
			//6
			addLine("New <u>bot</u> connected on channel <u>" + channel.name +"</u>");
			//7
			addLine("Waiting for <u>bot</u> payload...");
		},
		left: function(user, channel){
			//20-22
			addLine("the <u>bot</u> has been kicked out!");
			addLine("Framework seems to be working just fine!");
			addLine("Congratulations!");
			$("#bot").remove();
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
				//16
				addLine("Testing <u>user</u> to <u>user</u> communication...");
				bot.pub("Hi!");
				//bot.send("message","Hi!");
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
			
			//User events
			client.user.on({
				message: function(message, from){
					if(bot.name == from.name && message == "Hi!"){
						//17
						addLine("Communication is great!");
						//18
						addLine("<u>bot</u> is no longer needed...")
						//19
						addLine("Kicking <u>bot</u> out...")
						client.getChannel(chanName).send("kick","NOW");
					}else{
						//17
						addLine("Sorry, communication failed!");
					}
					
				}
			})
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