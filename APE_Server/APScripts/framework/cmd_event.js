/*
 * Command to handle APS events
 */
Ape.registerCmd("event", true, function(params, info) {
	
	var recipient = Ape.getChannelByPubid(params.pipe);
	var isChan = true;
	
	//Try if the recipient is an user
	if(!recipient){
		recipient = Ape.getUserByPubid(params.pipe);
		isChan = false
	}
	
	if(recipient){
		
		if(isChan){
			var result = Ape.triggerChannelEvent(recipient, params.event, [params, info.user, recipient]);
			if(result === false) return 1;
		}
		
		if(!!params.sync){
			info.sendResponse("SYNC", {
				data: params.data,
				event: params.event,
				chanid: params.pipe
			});
		}
		
		delete params.sync;
		
		recipient.sendEvent(params.event, params.data, {from: info.user.pipe});
		
		return 1;
	}
	
	return ["425", "UNKNOWN_RECIPIENT"];
	
});