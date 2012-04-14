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
	
	
	var Events = {
		/*
		 * Function triggered when other users join the channel
		 * 		+user
		 * 			...user properties like name, id, etc...
		 * 			-pubid
		 * 		+channel
		 */
		join: function(user, channel){
			//prepend a Message to DIV container
			$("#feed-music .feed-body").prepend("<hr>>> <b>"+user.name+"</b> has join...<hr>")
				//Scroll div to top
				.prop("scrollTop", 0);	
		},
		
		/*
		 * Function triggered when other users leave the channel
		 * 		+user
		 * 			...user properties like name, id, etc...
		 * 			-pubid
		 * 		+channel
		 */		
		left: function(user, channel){
			//(jQuery)prepend a Message to DIV container
			$("#feed-music .feed-body").prepend("<hr><< <b>"+user.name+"</b> has left...<hr>")
				//Scroll div to top
				.prop("scrollTop", 0);	
		},
		
		/*
		 * Function triggered when a text message is recieved on this channel
		 * 		+msg = (string) message
		 * 		+info
		 * 			-from
		 * 				...sender(user) properties like name, id, etc
		 * 				-pubid
		 * 			-channel
		 * 				-name
		 * 				-pipe
		 * 				...other properties and methods
		 */		
		message: function(message, from, channel){
			//(jQuery)Append a Message to DIV container
			var user = from.properties;
			$("#feed-music .feed-body").prepend("<div><b>"+user.name+":</b> "+message+"</div>")
				//Scroll div to top
				.prop("scrollTop", 0);
		}
	};
	
	/*
	 * Subscribe to channel
	 */
	
	Sub("music", Events, function(joinRes, channel){
		$("#username").text(APE.PubSub.user.name);
	});
	
	/*
	 * To publish to a channel use the Pub() function
	 * Pub(channel_name, message_or_object);
	 * 
	 * All the code below is mostly gathering the form data to publish
	 *  
	 */
	
	//(jQuery)Binds event to  the SEND button
	$(".feed-send").bind("submit", function(e){
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
		Pub("music", data.message);
		
		//Clear input and focus
		formInput.val("").focus();
		
		//Post My message on container
		//Append a Message to DIV container
		$("#feed-"+data.channel+" .feed-body").prepend("<div><b>Me:</b> "+data.message+"</div>")
			//Scroll div to top
			.prop("scrollTop", 0);	
		
		return false;
	})
})
