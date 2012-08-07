/*
 * Initialize and configure the client object
 */
var client = new APS("ape.crusthq.com:45138", false, {
	debug: true,
	session: true
});

var channelName = "APS_chatter";

/*
 * Client Events
 */
client.on({
	connect: function(){
		if(!!!client.user.name){
			//Prompt for username if trting to connect without one
			askForUsername();
			
			//Pause connect to gather user information
			return false;
		}
	},
	
	restored: function(){
		//Session has been restored, check if channel was restored if not ask for username
		if(client.getChannel(channelName) == false)
			askForUsername();
	}
});


/*
 * Predefine Events for the channel
 */
client.onChannel(channelName, {
	/*
	 * The current user has just join the channel
	 */
	joined: function(user, channel){
		//Reference to the message input box
		var formInput = $("#chat-form [name='message']");
	
		//get the channel object once and saved it in 'chan' for reference
		var chan = client.getChannel(channelName);
		
		//Enable chat form
		$("#chat-form input").removeProp("disabled");
		
		//Add DOM event to send the typing event to server
		formInput.one("keyup", function(e){
			chan.send("typing", "*");
		});
		
		//Update curent user's name and icon
		$("#chat-user-name").text(user.name);
		$("#chat-user-icon").attr("src","http://www.gravatar.com/avatar/"+user.avatar+"?s=25&d=identicon");
		
		//Populate existing users in the userlist tray
		for( var u in channel.users){
			if(user.pubid != u)
				addUser(channel.users[u], false);
		}
		
		//Remove propmt asking for username
		$("#chat-messages .ask").remove();
		
		//Show the logout button
		$("#chat-logout").show();
		
		//Welcomes user to the channel
		addBotMessage("Welcome <b>"+user.name+"</b> to APS Chatter");
	},
	
	/*
	 * A user has join the channel
	 */
	join: addUser,
	
	/*
	 * A user has left the channel
	 */
	left: removeUser,
	
	/*
	 * A message has been revieved in the channel
	 */
	message: function(message, from, channel){
		addMessage(message, from);
		
		$("#chat-userlist #u_"+from.name).removeClass("typing");
	},
	
	/*
	 * A user is typing
	 */
	typing: function(message, from, channel){
		$("#chat-userlist #u_"+from.name).addClass("typing");
	}
})

//============= Global Functions for document content manipulation ===============//

/*
 * Displays a form in the container asking for the user's name 
 */
function askForUsername(){
	var form = $("#chat-messages .ask");
	if(!form.length){
		$("<form>").addClass("ask")
			.append("<strong>Enter a username to join the chat </strong>")
			.append("<input type='text' name='name' value='User_"+randomString(5)+"'>")
			.append("<input type='submit' value='Join Chat'>")
			.on("submit", function(e){
				e.preventDefault();
				client.user.name = $(this).find("[name]").val();
				client.user.avatar = randomString(32).toLowerCase();
				client.sub(channelName);
			})
			.prependTo("#chat-messages");
	}else{
		form.find("> strong").text("Please enter a different name: ")
			.css({color: "red"});
	}
}

/*
 * Logs a message in the container and the user to the userlist
 */
function addUser(user, log){
	var icon = $("<img>").addClass("icon")
		.prop("src", "http://www.gravatar.com/avatar/"+user.avatar+"?s=25&d=identicon");
	var name = $("<span>").text(user.name);
	
	$("<div>").attr("id", "u_"+user.name)
		.append(icon, name)
		.hide()
		.appendTo("#chat-userlist")
		.slideDown();
	
	if(!!log)
		addBotMessage(">>> <b>"+user.name+"</b> has joined <<<");
}

/*
 * Logs a message in the container and removes the user from the userlist
 */
function removeUser(user){
	$("#chat-userlist #u_"+user.name).slideUp(function(){ $(this).remove()});
	
	addBotMessage(" <<< <b>"+user.name+"</b> has left >>> ");
}

/*
 * Adds a generic message to the container
 */
function addBotMessage(str){
	$("<div>").html(str).addClass("bot-message")
		.appendTo("#chat-messages")
	$("#chat-messages").trigger("newLine");
}

/*
 * Adds a message from a user to the conainer
 */
function addMessage(message, from){
	var icon = $("<img>").addClass("icon")
		.prop("src", "http://www.gravatar.com/avatar/"+from.avatar+"?s=40&d=identicon");
	var body = $("<p>").addClass("msg").html("<b>"+from.name+":</b> <br> "+message);
	
	$("<div>").append(icon, body)
		.appendTo("#chat-messages");
	
	$("#chat-messages").trigger("newLine");
}

//================ DOM events binding in the usual jQuery closure =============//

$(document).ready(function(){
	/*
	 * Add DOM event 'submit' to the form
	 */
	$("#chat-form").on("submit", function(e){
		e.preventDefault();
		
		var formInput = $("#chat-form [name='message']");
		var formData = $(this).serializeArray();
		var data = {};
		
		var chan = client.getChannel(channelName);
		
		formInput.one("keyup", function(e){
			if(e.keyCode != 13){
				chan.send("typing", "*");
			}else{
				$(this).one("keyup", function(e){
					chan.send("typing", "*");
				})
			}
		})
		
		for(var i in formData){
			var d = formData[i];
			data[d.name] = d.value;
		}
		
		//Send message
		chan.pub(data.message);
		
		//Clear message input and focus it
		formInput.val("").focus();
		
		//Manually add this message to the container
		addMessage(data.message, client.user);
		
		return false;
	})
	
	/*
	 * Add DOM event click for the logout button
	 */
	$("#chat-logout").on("click", function(e){
		e.preventDefault();
		$(this).hide();
		$("#chat-messages").empty();
		$("#chat-userlist").empty();
		askForUsername();
		client.unSub(channelName);
		client.quit();
	})
	
	/*
	 * Add DOM event to animate the messages feed on new row
	 */
	$("#chat-messages").on("newLine", function(){
		var $this = $(this);
		
		$this.animate({scrollTop: $this.prop("scrollHeight") - $this.height()},{
			queue: true
		});
	});
	
	/*
	 * The below function call will trigger the chain reaction 
	 * of events added to 'client' object in this whole script
	 */
	client.connect();
})