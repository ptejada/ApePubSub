$(document).ready(function(){
	var client = new APS("ape2.crusthq.com:53630");
	
	//Makes the client object global for debugging
	window.client = client;
	
	client.option.debug = true;
	client.option.session = false;
	
	client.user = {
		name: "User_"+randomString(5) //Generates a random name
		//id: 321,
		//What ever you want to store in the user
	}
	
	/*
	 * Add global events which will apply to all channels 
	 * including existing and future ones
	 */
	client.on({
		
		join: function(user, channel){
			newUser(user)
		},
		
		left: function(user, channel){
			$("#u-" + user.name).slideUp("fast", function(){
				$(this).remove();
				$("#c-"+user.name+" .feed-body").append("<h4>...user offline...</h4>");
				$("#c-"+user.name+" .feed-send input").prop("disabled", true);
			})
		},
		error007: function(){
			$("<div>").addClass("error")
				.html("The user name <b>" + this.user.name + "</b> is not available.")
				.appendTo("#userPicker .errorTray");
		},
		
		error006: function(){
			$("<div>").addClass("error")
				.html("The user name <b>" + this.user.name + "</b> is not a valid name. It must be alphanumeric.")
				.appendTo("#userPicker .errorTray");
		},
		
		ready: function(){
			$("#userPicker").html("You are: <b>" + this.user.name + "</b>   ");
			$("<img>")
				.addClass("user-avatar")
				.prop("src", "http://www.gravatar.com/avatar/" + this.user.avatar + "?d=identicon&s=20")
				.insertBefore($("#userPicker b"));
			
			this.user.on("message", function(message, from, channel){
				newLine(message, from, from);
			});
				
		}
		
	});
	
	client.onChannel("userLobby", "joined", function(){
		for(var id in this.users){
			//skip current user
			if(client.user.pubid == id) continue;
			newUser(this.users[id]);
		}
	})
	
	var newUser = function(user){
		var container = $("#userList");
		var row = $("<div>");
		
		row.prop("id", "u-" + user.name)
		row.addClass("user");
		
		$("<img>").addClass("user-avatar")
			.prop("src", "http://www.gravatar.com/avatar/" + user.avatar + "?d=identicon&s=20")
			.appendTo(row)
		
		$("<strong>").text(user.name)
			.addClass("user-name")
			.appendTo(row);
		
		$("<button>").text("chat")
			.addClass("chatWithUser")
			.data("pubid", user.pubid)
			.appendTo(row);
			
		container.append(row);		
	}
	
	/*
	 * Animate feed on new line message
	 */
	$("#chatList").on("newLine", ".feed-body", function(){
		$this = $(this);
		
		$this.animate({scrollTop: $this.prop("scrollHeight") - $this.height()},{
			queue: true	
		});
	});
	
})
