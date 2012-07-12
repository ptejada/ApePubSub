//custom events commands
Ape.registerCmd("event", true, function(params, info) {
	Ape.log(params);
	
	var pipe = Ape.getPipe(params.pipe);
	
	if(pipe){
		pipe.sendRaw("EVENT", params, {from: info.user.pipe});
	}
});