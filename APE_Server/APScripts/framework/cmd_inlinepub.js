//Pushpub Command
Ape.registerCmd("inlinepub", false, function(params, info) {
	//Global inlinePass
	if (params.password == inlinePass) {
		
		if(params.to && params.raw && params.data){
			
			var to = Ape.getPipe(params.to);
			
			if (!!to.pipe) return ["425", "UNKNOWN_RECIPIENT"];
			
			//User Source From
			var user = Ape.getPipe(params.from);
			if (!!user.pipe) return ["424", "UNKNOWN_SENDER"];
			
			//Send Data to the Reccipient
			to.pipe.sendRaw(params.raw, params.data, {"from": user.pipe});
			
			return {"name":"pushed","data":{"status":"ok"}};
		} else {
			return 0;
		}
	} else {
		return ["400", "BAD_PASSWORD"];
	}
});