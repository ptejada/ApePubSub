/*
 * Command to handle APS events
 */
Ape.registerCmd("event", true, function(params, info) {
	
	if(params.multi){
		var recipient = Ape.getChannelByPubid(params.pipe);
	}else{
		var recipient = Ape.getUserByPubid(params.pipe);
	}
	
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
	}
	
	return 1;
});