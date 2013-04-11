/*
 * Global server wide users list handling
 */
Ape.addEvent('adduser', function(user) {
	var name = user.prop('name');
	
	if(typeof name == "string"){
		name = name.toLowerCase();
		Ape.userlist[name] = user;
	}
});

Ape.addEvent('deluser', function(user) {
	var name = user.prop('name');
	
	if(typeof name == "string"){
		name = name.toLowerCase();
		delete Ape.userlist[name];
	}
});

/*
 * Global server wide channel's users counter
 */
Ape.addEvent("rmchan", function(channel) {	
	Ape.triggerChannelEvent(channel, "destroy", [channel]);
});
Ape.addEvent("mkchan", function(channel) {
	//Create users property	
	channel.users = {};
	//Initiate the revision number
	channel.setProperty("_rev", 1);
	//Trigger the channel create event
	Ape.triggerChannelEvent(channel, "create", [channel]);
});

Ape.addEvent("beforeJoin", function(user, channel) {
	channel.users[user.prop("pubid")] = user;
	
	user.channels[channel.prop("name")] = channel;
	
	Ape.triggerChannelEvent(channel, "join", [user, channel]);
});

Ape.addEvent("left", function(user, channel) {
	Ape.triggerChannelEvent(channel, "left", [user, channel]);
	
	delete channel.users[user.prop("pubid")];
	delete user.channels[channel.prop("name")];
});