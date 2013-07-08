$(document).ready(function(){
	var client = new APS("ape.ptejada.com:45138");
	
	//Makes the client object global for debugging
	window.client = client;
	
	client.option.debug = true;
	client.option.session = true;
	
	client.user = {
		name: "User_"+randomString(5)
	}
	
	var invalidProp = {
		name: null,
		_rev: null,
		pubid: null		
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
			$("#u-" + user.name).fadeOut("fast", function(){
				$(this).remove();
			})
		},
		userUpdate: function(prop, value, user){
			var box = $("#u-"+user.name);
			var ref = box.find(".prop-"+prop);
			
			if(ref.length > 0){
				ref.html(value);
			}else{
				var dl = box.find("dl");
				
				$("<dt>").html(prop).appendTo(dl);
				$("<dd>").addClass("prop-"+prop)
					.html(value).appendTo(dl);
				
				ref = box.find(".prop-"+prop);
			}
			
			ref.fadeOut("fast")
				.fadeIn("fast")
		}
	});
	
	var newUser = function(user, cont){
		var container = cont || $("#othersProps");
		var box = $("<div class='user'>");
		
		box.prop("id", "u-" + user.name)
		
		$("<h4>").html(user.name)
			.appendTo(box)
		
		var dl = $("<dl>");
		
		$("<dt>").html("revision #").appendTo(dl);
		$("<dd>").addClass("prop-_rev")
			.data("fixed", true)
			.html(user._rev).appendTo(dl);
		
		for(var i in user){
			
			$("<dt>").html(i).appendTo(dl);
			$("<dd>").addClass("prop-"+i)
				.html(user[i]).appendTo(dl);
		}
		
		dl.find(".prop-name")
			.data("fixed", true)
		
		dl.appendTo(box);
		
		container.append(box);
	}
	
	$("#newPropertyAdder").on("submit", function(e){
		e.preventDefault();
		var name = $(this).find("[name='name']");
		var value = $(this).find("[name='value']");
		
		if(name.val() in invalidProp){
			alert("The property [ " + name.val() + " ] already exists and can not be update!");
			return false;
		}
		
		if(name.val().match(/^[0-9a-zA-Z_-]+$/)){
			client.user.change(name.val(), value.val());
			/*
			 * Send any message to instantly
			 * propagate the property changes
			 */ 
			//client.pub("propShowcase", "*");
			
			name.val("");
			value.val("");
		}else{
			alert("Property name has invalid characters!");
		}
	})

	var myUser = $("#myUser");

	myUser.on("click", "dd", function(){
		var fixed = $(this).data("fixed");
		
		if(!fixed){
			var input = $("<input type='text'>")
				.data("prop", $(this).prev().html());
			
			var value = $(this).html();
			
			$(this).html(input)
				.addClass("updating")
				.data("fixed", true);
			
			$(this).find("input:first").focus()			
				.val(value);
			
		}
	})

	myUser.on("change", "input", function(){
		var value = $(this).val();
		var prop = $(this).data("prop");

		$(this).parent().data("fixed", false)
			.removeClass("updating")

		if(typeof prop != "undefined")
			client.user.change($(this).data("prop"), value);
	})

	myUser.on("blur", "input", function(){
		$(this).parent().data("fixed", false)
			.removeClass("updating")
		
		var value = $(this).val();
		
		$(this).parent().html(value);
	})
	
	client.sub("propShowcase", null, function(){
		$(".myName").html(client.user.name);
		for(var id in this.users){
			//skip current user
			if(client.user.pubid == id){
				newUser(client.user, $("#myUser"));		
			}else{
				newUser(this.users[id]);				
			}
		}
	})
})
