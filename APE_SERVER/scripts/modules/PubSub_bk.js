var userlist = new $H;

Ape.registerHookCmd("connect", function(params, cmd){
	if($defined(params.user) && params.user.length){
		//if (userlist.has(params.user.username.toLowerCase())) return ["007", "NICK_USED"];
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

//Global server wide channel's users counter
Ape.addEvent("mkchan", function(channel) {
	channel.userCount = 0;
});

Ape.addEvent("afterJoin", function(user, channel) {
	channel.userCount++;
});

Ape.addEvent("left", function(user, channel) {
	channel.userCount--;
});

Ape.registerCmd("getTotalUsers", false, function(params, infos) {
	var chan = Ape.getChannelByName(params.channel);
	
	Ape.log(chan.userCount +" users In channel "+ params.channel);
});

//Ape.registerHookCmd

//Pushpub Command
Ape.registerCmd("pushpub", false, function(params, info) {
	if (params.password == Ape.config("inlinepush.conf", "password")) {
		
		if ($defined(params.channel) && $defined(params.raw) && $defined(params.data)) {
			var chan = Ape.getChannelByName(params.channel);
			if (!$defined(chan.pipe)) return ["401", "UNKNOWN_CHANNEL"];
			
			var user = Ape.getUserByPubid(params.pubid);			
			if (!$defined(user.pipe) || !user.pipe) return ["401", "UNKNOWN_USER"];	
			
			//Send Data to channel
			chan.pipe.sendRaw(params.raw, params.data, {"from": user.pipe});			
			
			return {"name":"pushed","data":{"value":"ok"}};
		} else {
			return 0;
		}
	} else {
		return ["400", "BAD_PASSWORD"];
	}

});