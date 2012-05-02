Ape.registerHookCmd("connect", function(params, cmd){
	//Ape.log(cmd.toSource());

	if(!$defined(params)) return 1;
	
	if($defined(params.user)){
		
		if (params.user.name.length > 16 || params.user.name.test('[^_a-zA-Z0-9]', 'i')) return ["006", "BAD_NICK"];
		
		for(var index in params.user){
			cmd.user.setProperty(index, params.user[index]);
		}
	}
	
	//parse options
	if($defined(params.options)){
		
	}
	
	return 1;
});