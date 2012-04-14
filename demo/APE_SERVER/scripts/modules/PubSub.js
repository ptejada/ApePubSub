var userlist = new $H;

Ape.registerHookCmd("connect", function(params, cmd){
	if($defined(params.user)){
		
		if (params.user.name.length > 16 || params.user.name.test('[^_a-zA-Z0-9]', 'i')) return ["006", "BAD_NICK"];
		
		for(var index in params.user){
			cmd.user.setProperty(index, params.user[index]);
		}
		//Ape.log(cmd.user.properties.toSource());
		
		return 1;
	}
});

//Ape.registerHookCmd("")

//Global server wide users list
Ape.addEvent('adduser', function(user) {
	if(typeof user.getProperty('name') != "undefined"){
		userlist.set(user.getProperty('name').toLowerCase(), true);
	}	
});

Ape.addEvent('deluser', function(user) {
	if(typeof user.getProperty('name') != "undefined"){
		userlist.erase(user.getProperty('name').toLowerCase());
	}
});

//Global server wide channel's users counter
Ape.addEvent("mkchan", function(channel) {
	channel.userCount = 0;
	channel.setProperty("userCount", channel.userCount);
});

Ape.addEvent("beforeJoin", function(user, channel) {
	channel.userCount++;
	channel.setProperty("userCount", channel.userCount);
	//Ape.log(channel.userCount +" users In channel "+ channel.getProperty("name"));
});

Ape.addEvent("left", function(user, channel) {
	channel.userCount--;
	channel.setProperty("userCount", channel.userCount);
	//Ape.log(channel.userCount +" users In channel "+ channel.getProperty("name"));
});


//Pushpub Command
Ape.registerCmd("pushpub", false, function(params, info) {
	//Global password
	if (params.password == password) {
		
		if ($defined(params.to) && $defined(params.raw) && $defined(params.data)){
			
			if(params.toType == "multi"){
				var to = Ape.getChannelByPubid(params.to);
			}else{
				var to = Ape.getUserByPubid(params.to);
				Ape.log("User to User");
			}
			
			if (!$defined(to.pipe)) return ["401", "UNKNOWN_CHANNEL"];
			
			//User Source From
			var user = Ape.getUserByPubid(params.from);
			if (!$defined(user.pipe) || !user.pipe) return ["401", "UNKNOWN_USER"];
			
			//Send Data to channel
			to.pipe.sendRaw(params.raw, params.data, {"from": user.pipe});	
			
			return {"name":"pushed","data":{"status":"ok"}}
		} else {
			return 0;
		}
	} else {
		return ["400", "BAD_PASSWORD"];
	}
});