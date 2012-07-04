var userlist = {};
var sessions = {};

/*
 * Enchance Ape.log function
 */
Apelog = Ape.log;

Ape.log = function(data){
	switch(typeof data){
		case "object":
		//case "array":
			Apelog(data.toSource());
			break;
		default:
			Apelog(data);
	}
}


/*
 * Global server wide users list handling
 */
Ape.addEvent('adduser', function(user) {
	//user.propCache = {};
	//user.channels = {};

	var name = user.prop('name');
	if(name){
		name = name.toLowerCase();
		userlist[name] = user;
	}
});

Ape.addEvent('deluser', function(user) {
	var name = user.prop('name');
	if(name){
		name = name.toLowerCase();
		delete userlist[name];
	}
});

/*
 * Global server wide channel's users counter
 */
Ape.addEvent("mkchan", function(channel) {
	//Create propCache property
	channel.propCache = {};
	
	channel.users = {};
	
	//cache the 'name' property
	channel.prop("name", channel.prop("name"));
	
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


/*
 * Built-in object modifications
 */
Ape.user.prop = Ape.channel.prop = function(index, value){
	//if(typeof this.cache == 'undefined') this.cache = {};
	if(typeof index == 'string' && typeof value != 'undefined'){
		//Ape.log(index +" ==> "+ value);
		this.setProperty(index, value);
		this.propCache[index] = value;
		return true;
	}
	
	if(typeof index == 'string' && typeof value == 'undefined'){
		return this.getProperty(index);
	}
	
	Ape.log(this);
	
	return this.propCache;
}

Ape.addEvent("beforeJoin", function(user, channel) {
	Ape.log("========= TEST ==========");
	Ape.log("========= User ==========");
	Ape.log(user.prop("name"));
	Ape.log(user.prop());
	Ape.log("======== Channel ========");
	Ape.log(channel.prop("name"));
	Ape.log(channel.prop());
	Ape.log("=======================");
});
