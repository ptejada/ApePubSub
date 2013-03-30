/*
 * Command to handle eventPush from APS
 */
Ape.registerCmd("eventpush", false, function(params, info) {
	if(params.to && params.data){
		
		var recipient = Ape.getChannelByPubid(params.to);
		
		//Try if the recipient is an user
		if(!recipient)
			recipient = Ape.getUserByPubid(params.to);
		
		if(recipient){
			//User Source From
			var user = Ape.getUserByPubid(params.from);
			if (typeof user.pipe == "undefined" && params.sessid != user.prop("sessid"))
				return ["424", "UNKNOWN_SENDER"];
			
			//Send Data to the Reccipient
			recipient.sendEvent(params.data, {"from": user.pipe});
			
			Ape.log("");	//IMPORTANT: if this line comented a segfault error crashes the server			
			if(params.sync){
				var sync = params.data;
				sync.chanid = params.to;
				user.pipe.sendRaw("SYNC", sync);
			}
			
			return {"name":"PUSHED","data":{"value":"ok"}};
		}
		
		return ["425", "UNKNOWN_RECIPIENT"];
	}else{
		return 0;
	}
});