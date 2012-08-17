//Pushpub Command
Ape.registerCmd("inlinepush", false, function(params, info) {
	//Global inlinePass
	Ape.log(params.passkey + " == " + passkey);
	Ape.log(params);
	if (params.passkey == passkey) {
		
		if(params.to && params.raw && params.data){
			
			var to = Ape.getPipe(params.to);
			
			if (!!to.pipe) return ["425", "UNKNOWN_RECIPIENT"];
			
			//User Source From
			var user = Ape.getPipe(params.from);
			if (!!user.pipe) return ["424", "UNKNOWN_SENDER"];
			
			//Send Data to the Reccipient
			to.sendRaw(params.raw, params.data, {"from": user});
			
			return {"name":"PUSHED","data":{"value":"ok"}};
		} else {
			return 0;
		}
	} else {
		return ["400", "BAD_PASSKEY"];
	}
});