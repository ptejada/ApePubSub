Ape.registerHookCmd("connect", function(params, cmd){
	//IMPORTANT! create channels property
	cmd.user.channels = {};
	
	if(!params) return 1;
	
	if(params.user){
		var user = params.user;
		if(typeof user.name == "string"){
			//Check for valid name
			if(user.name.length > 16 || /[^_a-zA-Z0-9]/i.test(user.name)) return ["006", "BAD_NAME"];
			//Check if name is unique
			if(typeof userlist[user.name.toLowerCase()] == "object") return ["007", "NAME_USED"];
		}
		
		for(var index in user){
			cmd.user.prop(index, user[index]);
		}
	}
	
	//parse options
	if(params.option){
		
	}
	
	return 1;
});
