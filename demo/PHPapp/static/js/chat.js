/*
 * Initialize and configure the client object
 */
function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1);
		if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
	}
	return "";
}

var inst = getCookie("PHPSESSID").substring(11,15) + ".";

var client = new APS(inst + ServerDomain, false, {
	debug: EnableDebug,
	session: EnableSession,
	eventPush: "ps/push.php"
});

client.identifier = "pChat";

var channelName = "privateChat";

/*
 * Client Events
 */
client.on({
	connect: function(){
		if(!!this.user.name) return;
		$.getJSON("ps/connect.php", function(data){
			//client.session.id = data.sessid;
			client.session.save(data.sessid);
			client.user = data.user;
			client.sub(channelName);
		})
		
		//Pause connect to gather user information
		return false;
	},
	login: function(id){
		$.post("ps/update.php?noredirect=1", {ape_session: id});
	},
	dead: function(){
		//Refresh page
		setTimeout(client.reconnect.bind(client), 5000);
		addBotMessage("Connection is lost");
		addBotMessage("Attempting to re-connect...");
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
		$("#chat-form input").removeAttr("disabled");
		
		//Add DOM event to send the typing event to server
		formInput.one("keyup", function(e){
			chan.send("typing", "*");
		});
		
		//Update curent user's name and icon
		$("#chat-user-name").text(user.name);
		$("#chat-user-icon").attr("src","http://www.gravatar.com/avatar/"+user.avatar+"?s=25&d=monsterid");
		
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
 * Logs a message in the container and adds the user to the userlist
 */
function addUser(user, log){
	var icon = $("<img>").addClass("icon")
		.prop("src", "http://www.gravatar.com/avatar/"+user.avatar+"?s=25&d=monsterid");
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
		.prop("src", "http://www.gravatar.com/avatar/"+from.avatar+"?s=40&d=monsterid");
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
	$("#chat-form").off('submit').on("submit", function(e){
		e.stopImmediatePropagation();
		e.preventDefault();

		var formInput = $("#chat-form [name='message']");
		
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
		
		//Send message
		chan.pub(formInput.val(), true);
		
		//Clear message input and focus it
		formInput.val("").focus();
		
		return false;
	})
	
	/*
	 * Add DOM event click for the logout button
	 */
	$("#chat-logout").on("click", function(e){
		e.preventDefault();
		client.unSub(channelName);
		window.location.href = "?";
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