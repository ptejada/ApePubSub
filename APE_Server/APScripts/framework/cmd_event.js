//custom events commands
Ape.registerCmd("event", true, function(params, info) {
	
	var pipe = Ape.getPipe(params.pipe);
	
	if(pipe){
		var sync = params;
		sync.chanid = params.pipe;
		delete sync.pipe;
		
		info.user.pipe.sendRaw("SYNC", sync);
		pipe.sendRaw("EVENT", params, {from: info.user.pipe});
	}
});