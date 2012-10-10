//custom events commands
Ape.registerCmd("event", true, function(params, info) {
	
	var pipe = Ape.getPipe(params.pipe);
	
	if(pipe){
		
		if(!!params.sync){
			info.sendResponse("SYNC", {
				data: params.data,
				event: params.event,
				chanid: params.pipe
			});
		}
		
		delete params.sync;
		
		pipe.sendRaw("EVENT", params, {from: info.user.pipe});
	}
});