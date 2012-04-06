var userlist = new $H;

Ape.registerHookCmd("connect", function(params, cmd){
	if($defined(params.user)){
		
		if (params.user.username.length > 16 || params.user.username.test('[^_a-zA-Z0-9]', 'i')) return ["006", "BAD_NICK"];
		
		for(var name in params.user){
			cmd.user.setProperty(name, params.user[name]);
		}
		
		return 1;
	}
});

//Global server wide users list 
Ape.addEvent('adduser', function(user) {
	if(typeof user.getProperty('username') != "undefined"){
		userlist.set(user.getProperty('username').toLowerCase(), true);
	}	
});

Ape.addEvent('deluser', function(user) {
	if(typeof user.getProperty('username') != "undefined"){
		userlist.erase(user.getProperty('username').toLowerCase());
	}
});
