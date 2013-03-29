/*
 * Command to handle eventPush from APS
 */
Ape.registerCmd("eventpush", false, function(params, info) {
	if(params.to && params.data){
		
		if(params.multi){
			var recipient = Ape.getChannelByPubid(params.pipe);
		}else{
			var recipient = Ape.getUserByPubid(params.pipe);
		}
		
		if(!!!recipient) return ["425", "UNKNOWN_RECIPIENT"];
		
		//User Source From
		var user = Ape.getUserByPubid(params.from);
		if (typeof user.pipe == "undefined" && params.sessid != user.prop("sessid"))
			return ["424", "UNKNOWN_SENDER"];
		
		//Send Data to the Reccipient
		recipient.sendEvent(params.data, {"from": user.pipe});
		
		if(!!params.sync){
			var sync = params.data;
			sync.chanid = params.to;
			user.pipe.sendRaw("SYNC", sync);
		}
		
		return {"name":"PUSHED","data":{"value":"ok"}};
	}else{
		return 0;
	}
});