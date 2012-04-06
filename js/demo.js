$(document).ready(function(){
	//Ape user properties
	$.Ape.user = {
		username: "User_"+randomString(5)
	}
	
	$.Ape.session = true;
	
	$.Ape.ready(function(){
		//NOTE that regardless of the event the third argument will always be the channel name
		//$.Ape.sub(["music","movies","dance"],{
		$.Ape.sub(["music","dance","movies"],{
			joined: function(b,c,chanName){
				$("#username").text($.Ape.user.username);
				$.Ape.client.core.getPipe($.Ape.user.pubid).onRaw("PM", function(raw){
					alert("NEW PM: "+raw.data.msg);
				});
				
				updateUsers(chanName);
			},
			onJoin: function(user,a,chanName){
				addMessage(chanName, "<hr>>> <b>"+user.username+"</b> has join...<hr>");
			},
			onLeft: function(user,a,chanName){
				addMessage(chanName, "<hr><< <b>"+user.username+"</b> has left...<hr>");
			},
			onMessage: function(msg,info,chanName){
				addMessage(chanName, "<div><b>"+info.from.username+":</b> "+msg+"</div>");				
			},
			onUserCount: function(count,a,chanName){				
				$("#feed-"+chanName+" .userCounter").text(count);		
				debug("COUNTING users..."+count);
				updateUsers(chanName);
			}
		});
		
		debug($.Ape.user);
	});//END OF Ape READY
	
	//PM messages
	$(".feed-users").delegate(".feed-user","click",function(e){
		e.preventDefault();
		
		var pubid = $(this).data("pubid");
		debug(pubid);	
		
		var to = $.Ape.client.core.users[this.title];
		debug(to);
		
		var sendData = {
			//Add current pubid data
			from: 		$.Ape.user.pubid,
			fromType: 	$.Ape.user.pipe.type,
			to:			to.pubid,
			toType:		to.casttype,
			data: {
				msg: "Hola amigo"
			}
		}
		
		$.post("PM.php", sendData, function(res){
			//Post My message on container
			//addMessage(data.channel, "<div><b>Me:</b> "+data.message+"</div>");
		},'json')
		
		return false;
	})
	
	$(".feed-send").bind("submit", function(e){
		e.preventDefault();
		
		var formInput = $(this).find("[name='message']");
		
		var formData = $(this).serializeArray();
		var data = {};
		
		for(var i in formData){
			var d = formData[i];
			data[d.name] = d.value;
		}
		
		data.from = $.Ape.user.pubid;
		data.fromType = $.Ape.user.pipe.type;
		
		//Add destination pubid data
		var to = $.Ape.channel(data.channel);
		debug(to);
		
		var sendData = {
			//Add current pubid data
			from: 		$.Ape.user.pubid,
			fromType: 	$.Ape.user.pipe.type,
			to:			to.pipe.pipe.pubid,
			toType:		to.pipe.type,
			data: {
				msg: data.message
			}
		}
		
		//Clear input and focus
		formInput.val("").focus();
		
		$.post("inline.php", sendData, function(res){
			//Post My message on container
			if(!res.sent) return;
			addMessage(data.channel, "<div><b>Me:</b> "+data.message+"</div>");			
		},'json')
		
		//$.Ape.channel(data.channel).pub(data.message);		
		
		return false;
	});
	
	//Function to simplify adding messages to container
	function addMessage(name,msg){
		$("#feed-"+name+" .feed-body").prepend(msg).prop("scrolltop",0);
	}
	
	function updateUsers(chanName){
		var users = $.Ape.channel(chanName).users();
		var entry = " | ";
		
		for(var i in users){
			var user = users[i];
			
			entry += "<a class='feed-user' href=# title="+user.pubid+">"+user.username+"</a> | ";
		}
		
		$("#feed-"+chanName+" .feed-users").html(entry);
	}
})
