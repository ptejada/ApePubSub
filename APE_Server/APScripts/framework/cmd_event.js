/*
 * Command to handle APS events
 */
Ape.registerCmd("event", true, function(params, info) {
	
	var recipient = Ape.getChannelByPubid(params.pipe);
	
	//Try if the recipient is an user
	if(!recipient)
		recipient = Ape.getUserByPubid(params.pipe);
	
	if(recipient){
		
		if(!!params.sync){
			info.sendResponse("SYNC", {
				data: params.data,
				event: params.event,
				chanid: params.pipe
			});
		}
		
		delete params.sync;
		
		recipient.sendEvent(params, {from: info.user.pipe});
		
		return 1;
	}
	
	return ["425", "UNKNOWN_RECIPIENT"];
	
});