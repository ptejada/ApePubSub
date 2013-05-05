$(document).ready(function(){
	//Create a new APS client
	var client = new APS("ape.ptejada.com:45138");
	
	window.client = client;
	
	client.option.debug = true;
	
	/*
	 * Enables pushing events to a script which then should relay the message to the APE server
	 * This is great if you would like to parse the messages or store then in a database
	 */
	client.option.eventPush = "push.php";
	
	client.on("dead", function(){
		//alert("Make sure the client.option.eventPush option is pointing to the correct file. \n\nIts current value is " + client.option.eventPush +"\n\nYou may update this value in the script.js file around line 11.");
	});
	
	//Current user's properties	
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
		 * 			...dynamic user properties like name, id, etc...
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
		 * 		+msg = (string) message
		 * 		+from = sender(user) properties like name, id, pubid ... etc
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
	 * To publish to a channel use the Pub() function
	 * Pub(channel_name, message_or_object);
	 * 
	 * All the code below is mostly gathering the form data to publish
	 *  
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
