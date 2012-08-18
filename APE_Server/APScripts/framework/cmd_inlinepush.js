//Pushpub Command
Ape.registerCmd("inlinepush", false, function(params, info) {
	if(params.to && params.raw && params.data){
		
		var to = Ape.getPipe(params.to);
		
		if (!!to.pipe) return ["425", "UNKNOWN_RECIPIENT"];
		
		//User Source From
		var user = Ape.getUserByPubid(params.from);
		if (typeof user.pipe == "undefined" && params.sessid != user.prop("sessid"))
			return ["424", "UNKNOWN_SENDER"];
		
		//Send Data to the Reccipient
		to.sendRaw(params.raw, params.data, {"from": user.pipe});
		
		return {"name":"PUSHED","data":{"value":"ok"}};
	} else {
		return 0;
	}
});