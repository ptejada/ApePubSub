Ape.registerHookCmd("connect", function(params, cmd){
	//Ape.log(cmd.toSource());

	if(!params) return 1;
	
	if(params.user){
		
		if (params.user.name.length > 16 || /[^_a-zA-Z0-9]/i.test(params.user.name)) return ["006", "BAD_NICK"];
		
		for(var index in params.user){
			cmd.user.setProperty(index, params.user[index]);
		}
	}
	
	//parse options
	if(params.options){
		
	}
	
	return 1;
});
