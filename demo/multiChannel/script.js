$(document).ready(function(){
	//Create a new APS client
	var client = new APS("2.ape.crusthq.com:45138");
	
	//Enable debug output to browser console
	client.option.debug =true;
	
	client.option.transport = 'lp'
	
	//Current user's properties
	client.user = {
		name: "User_"+randomString(5), //Generates a random name
		//id: 321,
		//What ever you want to store in the user
	}
	
	/*
	 * Add global events which will apply to all channels 
	 * including existing and future ones
	 */
	client.on({
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
			$("#feed-"+channel.name+" .feed-body")
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
			$("#feed-"+channel.name+" .feed-body")
				.append("<div class='bot'> <<< <b>"+user.name+"</b> has left >>> </div>")
				.trigger("newLine");
		},
		
		/*
		 * Function triggered when a text message is recieved on this channel
		 * 		+message = (string) message
		 * 		+from = sender(user) properties like name, pubid ... etc
		 * 		+channel = a channel object where the message came through
		 */
		message: function(message, from, channel){
			//(jQuery)Append a Message to DIV container
			$("#feed-"+channel.name+" .feed-body")
				.append("<div><b>"+from.name+":</b> "+message+"</div>")
				.trigger("newLine");
		},
		
		/*
		 * This event is exclusive to the client and is only triggered once when a connection to the
		 * server has been stablished or Restored from session
		 */
		
		ready: function(){
			$("#username").text(client.user.name);
		}
		
	});
	
	
	/*
	 * Since all channels will have the same events and have already been added then above using client.on()
	 * we can make the simple call below to subscribe to all our channels
	 */
	client.sub(["music","games","dance"]);
	
	/*
	 * There are many ways to achive the same results, subscribe to multiple channels.
	 * For example if you would rather have every channel with their own events you could 
	 * wrap all your sub() calls in a sub() callback
	
			client.sub("music", musicEvents, function(){
				Sub("games", gamesEvents, callback);
				Sub("dance", danceEvents, callback);
			});
	
	 * The reason we should call parallel client.sub() requests inside a callback is to avoid
	 * the framework from been reinitialzed on every sub() request.
	 */
	
	/*
	 * To publish to a channel use the pub() function
	 *		client.pub(channel_name, message_or_object);
	 * 
	 * You may also call the pub() function directly from channel object
	 * 		client.getChannel(channel_name).pub(message_or_object)
	 */
	
	/*
	 * All the code below is mostly gathering the form data to publish 
	 * and adding some basic effects to the chat box 
	 */
	$(".feed-send").on("submit", function(e){
		e.preventDefault();
		
		var formInput = $(this).find("[name='message']");
		
		var formData = $(this).serializeArray();
		var data = {};
		
		for(var i in formData){
			var d = formData[i];
			data[d.name] = d.value;
		}
		
		//Add current pubid data
		//data.pubid = APS.PubSub.user.pubid;
		
		//Send message
		client.pub(data.channel, data.message);
		
		//Clear input and focus
		formInput.val("").focus();
		
		//Post My message on container
		//Append a Message to DIV container
		$("#feed-"+data.channel+" .feed-body").append("<div><b>Me:</b> "+data.message+"</div>")
			.trigger("newLine");
		
		return false;
	})
	
	/*
	 * Animate feed on new line message
	 */
	$(".feed-body").on("newLine", function(){
		$this = $(this);
		
		$this.animate({scrollTop: $this.prop("scrollHeight") - $this.height()},{
			queue: true			
		});
	});
})
