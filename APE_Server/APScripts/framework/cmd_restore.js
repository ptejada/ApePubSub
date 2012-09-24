//Pub Command
Ape.registerCmd("RESTORE", true, function(params, info) {
	info.sendResponse("RESTORED", {data:1});
	return 1;
});

function restoreUser(user,sid){
	
	var res = [];
	
	res.push({
		name: "LOGIN",
		data: {
			sessid: sid
		}
	})
	
	res.push({
		name: "IDENT",
		data: {user: user.pipe.toObject()}
	});
	
	function buildUsers(users){
		var output = [];
		for( var id in users){
			var user = users[id];
			output.push(user.pipe.toObject());
		}
		
		return output;
	}
	
	var chans = user.channels;
	
	if(typeof chans == "object"){
		for(var name in chans){
			var chan = chans[name];
			if(chan){
				res.push({
					name: "CHANNEL",
					data: {
						pipe: chan.pipe.toObject(),
						users: buildUsers(chan.users)
					}
				})
			}
		}
	}
	
	res.push({
		name: "RESTORED",
		data: {done: 1}
	})
	
	
	for(var i in res){
		Ape.log(res[i].name, res[i].data);
		this.sendResponse(res[i].name, res[i].data);
	}
	
	return true;
}

Ape.registerCmd("saveSESSION", true, function(params, info) {
	var pubid = info.user.prop("pubid");
	
	sessions[pubid] = params;
	
	return 1;
});