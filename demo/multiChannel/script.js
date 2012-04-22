$(document).ready(function(){
	
	//Options
	APE.PubSub.debug = true; //Log to browser's console AND uses decompressed APE files
	APE.PubSub.session = false; //Toggles the use of session for APE
	
	//Current user's properties
	APE.PubSub.user = {
		name: "User_"+randomString(5), //Generates a random name
		//id: 321,
		//What ever you want to store in the user
	}
	
	/*
	 * Add global events which will apply to all channels 
	 * including existing and future ones
	 */
	onAllChan({
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
		 * 		+msg = (string) message
		 * 		+from = sender(user) properties like name, id, pubid ... etc
		 * 		+channel = multipipe object where the message came through
		 */
		message: function(message, from, channel){
			APE.debug(channel);
			//(jQuery)Append a Message to DIV container
			var user = from.properties;
			$("#feed-"+channel.name+" .feed-body")
				.append("<div><b>"+user.name+":</b> "+message+"</div>")
				.trigger("newLine");
		},
		
		/*
		 * This event is exclusive to onAllChan() and is only triggered once when a connection to the
		 * server has been stablished
		 */
		connected: function(){
			$("#username").text(APE.PubSub.user.name);
		}
	});
	
	
	/*
	 * Since all channels will have the same events and have already been added then above using onAllChan()
	 * we can make the simple call below to subscribe to all our channels
	 */
	Sub(["music","games","dance"]);
	
	/*
	 * There are many ways to achive the same results, subscribe to multiple channels.
	 * For example if you would rather have every channel with their own events you could 
	 * wrap all your Sub() calls in an APE_ready()
	
			APE_ready(function(){
				Sub("music", musicEvents, callback);
				Sub("games", gamesEvents, callback);
				Sub("dance", danceEvents, callback);
			});
	
	 * The reason we should call parallel Sub() requests inside an APE_ready() is to avoid
	 * the framework from been reinitialzed on every request. Is also save to Subsribe to a
	 * channel from any callback or event triggered after the server is connected, for example:
	
			Sub("music", musicEvents, function(){
				Sub("games", gamesEvents, callback);
				Sub("dance", danceEvents, callback);
			});
	
	 */
	
	/*
	 * To publish to a channel use the Pub() function
	 * Pub(channel_name, message_or_object);
	 * 
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
		data.pubid = APE.PubSub.user.pubid;
		
		//Send message
		Pub(data.channel, data.message);
		
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
