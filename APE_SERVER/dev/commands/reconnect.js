//Pub Command
Ape.registerCmd("RECONNECT", true, function(params, info) {
		var user = info.user;
		
		if(user && user.pipe){
			Ape.log(Object.getOwnPropertyNames(user).sort());
					
			restoreUser.bind(info,user);
			return 1;
		}

	
	//info.sendResponse("RECONNECT", {value: "failed"});
	return {name: "NOSESSION", data: {value: "failed"}}

});

function restoreUser(user){
	var res = [];
	
	res.push({
		name: "LOGIN",
		data: {
			sessid: user.session.id
		}
	})
	
	res.push({
		name: "IDENT",
		data: {
			user: user.session.user
		}
	});
	
	var chans = user.session.channels;
	
	if(chans.length > 0){
		for(var chan in chans){
			chan = chans[chan];
			chan = Ape.getChannelByName(chan);
			if(chan){
				res.push({
					name: "CHANNEL",
					data: {
						pipe: chan.pipe,
						users: chan.users
					}
				})
			}
		}
	}
	
	for(var i in res){
		this.sendResponse(res[i].name, res[i].data);
	}
	
	return true;
}

Ape.registerCmd("saveSESSION", true, function(params, info) {
	info.user.session = params;
	
	return 1;
})