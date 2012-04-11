$(document).ready(function(){	
	
	//Options
	$.Ape.debug = true; //Log to browser's console AND uses decompressed APE files
	$.Ape.session = false; //Toggles the use of session for APE
	
	//Current user's properties
	$.Ape.user = {
		username: "User_"+randomString(5), //Generates a random username
		//id: 321,
		//What ever you want to store in the user
	}
	
	//No need to wrap code on an Ape ready function if it is only for a single channel
	$.Ape.sub("music",{ //Subcribe the channel 'music'
		
		/*
		 * Function triggered when current user has joined the channel
		 * 		+channel
		 * 			-name
		 * 			-pipe
		 * 			...other properties and methods
		 */		
		joined: function(channel){
			//(jQuery)Update username in the page
			$("#username").text($.Ape.user.username);
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
		onMessage: function(msg,info){
			//(jQuery)Append a Message to DIV container
			$("#feed-music .feed-body").prepend("<div><b>"+info.from.username+":</b> "+msg+"</div>")
				//Scroll div to top
				.prop("scrollTop", 0);	
		}
	});
		
	//To publish to a channel is as simple as getting the channel and pub
	// channel
	/*
	 * To publish to a channel is as simple as getting the channel and pub(
	 * channel.pub("Hello World")
	 * 
	 * All the code below is mostly gathering some generic info
	 * 
	 * If you are only using one channel you could use $.Ape.pub("Hello World") inestead
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
		data.pubid = $.Ape.user.pubid;		
		
		//Get the channel by its name
		$.Ape.channel(data.channel)
			//Publish message to channel
			.pub(data.message);
		
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
