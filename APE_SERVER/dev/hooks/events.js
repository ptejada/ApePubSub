var userlist = new $H;

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