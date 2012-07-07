//Pub Command
Ape.registerCmd("PUB", true, function(params, info) {
	if(params.pipe && params.data){
	
		var chan = Ape.getChannelByPubid(params.pipe);
		//Ape.log(chan.pipe.toSource());
		if(!chan.pipe) return ["401", "UNKNOWN_CHANNEL"];
		
		var user = info.user;
		//Ape.log(user.toSource());
		if(!user.pipe) return ["401", "UNKNOWN_USER"];
		
		var raw = {};
		raw.content = params.data;
		raw.type = typeof params.data == "string" ? "message" : "data";
		
		//Send Data to channel
		chan.pipe.sendRaw("PUBDATA", raw, {from: user.pipe});
		
		return 1;
	}else{
		return 0;
	};
});