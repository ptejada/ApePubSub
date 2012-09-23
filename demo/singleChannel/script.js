$(document).ready(function(){
	var client = new APS("ape.crusthq.com:45138");
	
	//Makes the client object global for debugging
	window.client = client;
	
	client.option.debug = true;
	
	client.user = {
		name: "User_"+randomString(5) //Generates a random name
		//id: 321,
		//What ever you want to store in the user
	}
	
	var Events = {
		/*
		 * Function triggered when other users join the channel
		 * 		+user
		 * 			-pubid
		 * 			...dynamic user properties like name, etc...
		 * 		+channel
		 * 			-name
		 * 			-pipe
		 * 			...more
		 */
		join: function(user, channel){
			$("#feed-music .feed-body")
				.append("<div class='bot'> >>> <b>"+user.name+"</b> has joined <<< </div>")
				.trigger("newLine");
		},
		
		/*
		 * Function triggered when other users leave the channel
		 * 		+user
		 * 			-pubid
		 * 			...dynamic user properties like name, id, etc...
		 * 		+channel
		 * 			-name
		 * 			-pipe
		 * 			...more
		 */		
		left: function(user, channel){
			$("#feed-music .feed-body")
				.append("<div class='bot'> <<< <b>"+user.name+"</b> has left >>> </div>")
				.trigger("newLine");
		},
			
		/*
		 * Function triggered when a text message is recieved on this channel
		 * 		+message = (string) message
		 * 		+from = sender(user) properties like name, pubid ... etc
		 * 		+channel = multipipe object where the message came through
		 */
		message: function(message, from, channel){
			//Use "Me" as the name if the message is from the current user
			var name = this._client.user.pubid == from.pubid ? "Me" : from.name
			
			//(jQuery)Append a Message to DIV container
			$("#feed-music .feed-body")
				.append("<div><b>"+name+":</b> "+message+"</div>")
				.trigger("newLine");
		}
	};
	
	/*
	 * Subscribe to channel
	 */
	client.sub("music", Events, function(user, channel){
		$("#username").text(user.name);
	});
	
	/*
	 * To publish to a channel use the pub() method
	 * client.pub(channel_name, message_or_object);
	 */
	$(".feed-send").on("submit", function(e){
		e.preventDefault();
		
		var formInput = $(this).find("[name='message']");
		
		//Send message
		client.pub("music", formInput.val(), true);
		
		//Clear input and focus
		formInput.val("").focus();
		return false;
	})
	
	/*
	 * Animate feed on new line message
	 */
	$(".feed-body").on("newLine", function(){
		var $this = $(this);
		
		$this.animate({scrollTop: $this.prop("scrollHeight") - $this.height()},{
			queue: true
		});
	});
})
