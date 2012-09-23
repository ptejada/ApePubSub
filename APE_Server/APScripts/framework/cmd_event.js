//custom events commands
Ape.registerCmd("event", true, function(params, info) {
	
	var pipe = Ape.getPipe(params.pipe);
	
	Ape.log(params);
	
	if(pipe){
		var sync = params;
		sync.chanid = params.pipe;
		delete sync.pipe;
		
		if(!!params.sync) info.sendResponse("SYNC", sync);
		pipe.sendRaw("EVENT", params, {from: info.user.pipe});
	}
});