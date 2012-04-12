$(document).ready(function(){	
	
	//Options
	APE.PubSub.debug = true; //Log to browser's console AND uses decompressed APE files
	APE.PubSub.session = false; //Toggles the use of session for APE
	
	//Current user's properties
	APE.PubSub.user = {
		username: "User_"+randomString(5), //Generates a random username
		//id: 321,
		//What ever you want to store in the user
	}
	
	
	var Events = {
		/*
		 * Function triggered when current user has joined the channel
		 * 		+channel
		 * 			-name
		 * 			-pipe
		 * 			...other properties and methods
		 */		
		userJoin: function(channel){
			//(jQuery)Update username in the page
			debug(arguments)
			$("#username").text(APE.PubSub.user.username);
		},
		
		/*
		 * Function triggered when other users join the channel
		 * 		+user
		 * 			...user properties like username, id, etc...
		 * 			-pubid
		 * 		+pipe
		 */		
		onJoin: function(user, pipe){
			//Append a Message to DIV container
			$("#feed-music .feed-body").prepend("<hr>>> <b>"+user.username+"</b> has join...<hr>")
				//Scroll div to top
				.prop("scrollTop", 0);	
		},
		
		/*
		 * Function triggered when other users leave the channel
		 * 		+user
		 * 			...user properties like username, id, etc...
		 * 			-pubid
		 * 		+pipe
		 */		
		onLeft: function(user, pipe){
			//(jQuery)Append a Message to DIV container
			$("#feed-music .feed-body").prepend("<hr><< <b>"+user.username+"</b> has left...<hr>")
				//Scroll div to top
				.prop("scrollTop", 0);	
		},
		
		/*
		 * Function triggered when a text message is recieved on this channel
		 * 		+msg = (string) message
		 * 		+info
		 * 			-from
		 * 				...sender(user) properties like username, id, etc
		 * 				-pubid
		 * 			-channel
		 * 				-name
		 * 				-pipe
		 * 				...other properties and methods
		 */		
		data: function(info, pipe){
			debug(arguments);
			//(jQuery)Append a Message to DIV container
			var from = APE.PubSub.client.core.getPipe(info.data.from.pubid);
			debug(from);
			$("#feed-music .feed-body").prepend("<div><b>"+info.data.from.pubid+":</b> "+info.data.msg+"</div>")
				//Scroll div to top
				.prop("scrollTop", 0);	
		}
	};
	
	/*
	 * Subscribe to channel
	 */
	
	Sub("music");
	addEventOn("music", Events);
	
	//To publish to a channel is as simple as getting the channel and pub
	/*
	 * To publish to a channel is as simple as getting the channel and pub(
	 * channel.pub("Hello World")
	 * 
	 * All the code below is mostly gathering some generic info
	 * 
	 * If you are only using one channel you could use APE.PubSub.pub("Hello World") inestead
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
