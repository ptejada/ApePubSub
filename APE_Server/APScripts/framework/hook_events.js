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
});

Ape.addEvent("beforeJoin", function(user, channel) {
	channel.users[user.prop("pubid")] = user;
	
	user.channels[channel.prop("name")] = channel;
});

Ape.addEvent("left", function(user, channel) {
	delete channel.users[user.prop("pubid")];
	delete user.channels[channel.prop("name")];
});