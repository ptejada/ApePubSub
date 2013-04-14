$(document).ready(function(){
	var client = new APS("ape.crusthq.com:45138");
	
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
				ref.text(value);
			}else{
				var dl = box.find("dl");
				
				$("<dt>").text(prop).appendTo(dl);
				$("<dd>").addClass("prop-"+prop)
					.text(value).appendTo(dl);
				
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
		
		$("<h4>").text(user.name)
			.appendTo(box)
		
		var dl = $("<dl>");
		
		$("<dt>").text("revision #").appendTo(dl);
		$("<dd>").addClass("prop-_rev")
			.data("fixed", true)
			.text(user._rev).appendTo(dl);
		
		for(var i in user){
			
			$("<dt>").text(i).appendTo(dl);
			$("<dd>").addClass("prop-"+i)
				.text(user[i]).appendTo(dl);
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
			client.pub("propShowcase", "*");
			
			name.val("");
			value.val("");
		}else{
			alert("Property name has invalid characters!");
		}
	})
	
	$("#myUser").on("click", "dd", function(){
		var fixed = $(this).data("fixed");
		
		if(!fixed){
			var input = $("<input type='text'>")
				.data("prop", $(this).prev().text());
			
			var value = $(this).text();
			
			$(this).html(input)
				.addClass("updating")
				.data("fixed", true);
			
			$(this).find("input:first").focus()			
				.val(value);
			
		}
	})
	
	$("#myUser").on("change", "input", function(){	
		var value = $(this).val();
		$(this).parent().data("fixed", false)
			.removeClass("updating")
		
		client.user.change($(this).data("prop"), value);
		
		/*
		 * Send any message to instantly
		 * propagate the property changes
		 */ 
		client.pub("propShowcase", "*");
	})
	
	$("#myUser").on("blur", "input", function(){
		$(this).parent().data("fixed", false)
			.removeClass("updating")
		
		var value = $(this).val();
		
		$(this).parent().text(value);
	})
	
	client.sub("propShowcase", null, function(){
		$(".myName").text(client.user.name);
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
