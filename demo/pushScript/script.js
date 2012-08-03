$(document).ready(function(){
	var client = new APS("ape.crusthq.com:45138");
	
	window.client = client;
	
	client.option.transport = "lp";
	
	client.option.debug = true;
	client.option.session = false;
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
			//(jQuery)Append a Message to DIV container
			$("#feed-music .feed-body")
				.append("<div><b>"+from.name+":</b> "+message+"</div>")
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
		
		var formData = $(this).serializeArray();
		var data = {};
		
		for(var i in formData){
			var d = formData[i];
			data[d.name] = d.value;
		}
		
		//Add current pubid data
		//data.pubid = APS.user.pubid;
		
		//Send message
		client.pub("music", data.message);
		
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
		var $this = $(this);
		
		$this.animate({scrollTop: $this.prop("scrollHeight") - $this.height()},{
			queue: true
		});
	});
})
