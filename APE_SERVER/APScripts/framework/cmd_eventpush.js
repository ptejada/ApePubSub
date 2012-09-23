//eventpush Command
Ape.registerCmd("eventpush", false, function(params, info) {
	if(params.to && params.data){
		
		var to = Ape.getPipe(params.to);
		
		if (!!to.pipe) return ["425", "UNKNOWN_RECIPIENT"];
		
		//User Source From
		var user = Ape.getUserByPubid(params.from);
		if (typeof user.pipe == "undefined" && params.sessid != user.prop("sessid"))
			return ["424", "UNKNOWN_SENDER"];
		
		//Send Data to the Reccipient
		to.sendRaw(params.raw, params.data, {"from": user.pipe});
		
		if(!!params.sync){
			var sync = params.data;
			sync.chanid = params.to;
			user.pipe.sendRaw("SYNC", sync);
			//return {"name": "SYNC", "data": sync};
		}
		
		return {"name":"PUSHED","data":{"value":"ok"}};
	}else{
		return 0;
	}
});