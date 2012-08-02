/*
 * Global server wide users list handling
 */
Ape.addEvent('adduser', function(user) {
	var name = user.prop('name');
	
	if(typeof name == "string"){
		name = name.toLowerCase();
		userlist[name] = user;
	}
});

Ape.addEvent('deluser', function(user) {
	var name = user.prop('name');
	
	if(typeof name == "string"){
		name = name.toLowerCase();
		delete userlist[name];
	}
});

/*
 * Global server wide channel's users counter
 */
Ape.addEvent("mkchan", function(channel) {
	//Create users property	
	channel.users = {};
	
	channel.prop("userCount", 0);
});

Ape.addEvent("beforeJoin", function(user, channel) {
	channel.prop("userCount", parseInt(channel.prop("userCount")) + 1);
	
	channel.users[user.prop("pubid")] = user;
	
	user.channels[channel.prop("name")] = channel;
	//Ape.log(channel.userCount +" users In channel "+ channel.getProperty("name"));
});

Ape.addEvent("left", function(user, channel) {
	channel.prop("userCount", parseInt(channel.prop("userCount")) - 1);
	
	delete channel.users[user.prop("pubid")];
	delete user.channels[channel.prop("name")];
	//Ape.log(channel.userCount +" users In channel "+ channel.getProperty("name"));
});

Ape.addEvent("beforeJoin", function(user, channel) {
	/*
	Ape.log("========= TEST ==========");
	Ape.log("========= User ==========");
	Ape.log(user.prop("name"));
	Ape.log(user.prop());
	Ape.log("======== Channel ========");
	Ape.log(channel.prop("name"));
	Ape.log(channel.prop());
	Ape.log("=======================");
	*/
});
