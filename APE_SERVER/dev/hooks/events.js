var userlist = {}

//Global server wide users list
Ape.addEvent('adduser', function(user) {
	var name = user.getProperty('name');
	if(!name){
		name = name.toLowerCase();
		userlist[name] = user;
	}
});

Ape.addEvent('deluser', function(user) {
	var name = user.getProperty('name');
	if(!name){
		name = name.toLowerCase();
		delete userlist[name];
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