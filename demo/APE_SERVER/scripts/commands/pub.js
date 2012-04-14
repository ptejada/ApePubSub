//Pub Command
Ape.registerCmd("PUB", false, function(params, info) {
	Ape.log(params.toSource());
	if($defined(params.pipe) && $defined(params.data)) {
	
		var chan = Ape.getChannelByPubid(params.pipe);
		Ape.log(chan.pipe.toSource());
		if (!$defined(chan.pipe)) return ["401", "UNKNOWN_CHANNEL"];
		
		var user = info.user;
		Ape.log(user.toSource());
		if (!$defined(user.pipe) || !user.pipe) return ["401", "UNKNOWN_USER"];
		
		var raw = {};
		raw.content = params.data;
		raw.type = typeof(params.data) == "string" ? "message" : "data";
		
		//Send Data to channel
		chan.pipe.sendRaw("PUBDATA", raw, {from: user.pipe});
		
		return 1;
	}else{
		return 0;
	};
});