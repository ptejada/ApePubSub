//A lot less comments
$(document).ready(function(){
	//Ape user properties
	$.Ape.user = {
		username: "User_"+randomString(5)
	}
	
	$.Ape.ready(function(){
		//NOTE that regardless of the event the third argument will always be the channel name
		$.Ape.sub(["music","movies","dance"],{
			joined: function(){			
				$("#username").text($.Ape.user.username);
			},
			onJoin: function(user,a,channel){
				addMessage(channel, "<hr>>> <b>"+user.username+"</b> has join...<hr>");
			},
			onLeft: function(user,a,channel){
				addMessage(channel, "<hr><< <b>"+user.username+"</b> has left...<hr>");
			},
			onMessage: function(msg,info,channel){
				addMessage(channel, "<div><b>"+info.from.username+":</b> "+msg+"</div>");				
			}
		});
		
		/*
		 * The sample code above could've also be done like
		 * $.Ape.sub("music",{...})
		 * $.Ape.sub("movies",{...}")
		 * $.Ape.sub("dance",{...}")
		 */
		
	});//END OF Ape READY
	
	
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
		addMessage(data.channel, "<div><b>Me:</b> "+data.message+"</div>");
		
		return false;
	})
	
	//Function to simplify adding messages to container
	function addMessage(name,msg){
		$("#feed-"+name+" .feed-body").prepend(msg).prop("scrolltop",0);
	}
})
