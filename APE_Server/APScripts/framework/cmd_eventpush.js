/*
 * Command to handle eventPush from APS
 */
Ape.registerCmd("eventpush", true, function(params, info) {
	if(params.to && params.data){
		
		var recipient = Ape.getChannelByPubid(params.pipe);
		var isChan = true
		
		//Try if the recipient is an user
		if(!recipient){
			recipient = Ape.getUserByPubid(params.pipe);
			isChan = false
		}
		
		if(recipient){
			//Send Data to the Reccipient
			recipient.sendEvent(params, {"from": info.user.pipe});
			
			if(params.sync){
				info.sendResponse("SYNC", {
					event: params.event,
					data: params.data,
					chanid: params.pipe
				});
			}
			
			return {"name":"PUSHED","data":{"value":"ok"}};
		}
		
		return ["425", "UNKNOWN_RECIPIENT"];
	}else{
		return 0;
	}
});