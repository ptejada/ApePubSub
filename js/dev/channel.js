//var APSChannel = function(pipe, client) {
APS.channel = function(pipe, client) {
	this.events = {};
	this.properties = pipe.properties;
	this.name = pipe.properties.name;
	this.pubid = pipe.pubid;
	this.client = client;
	this.users = {};
	
	this.addUser = function(u){
		this.users[u.pubid] = u;
	}
	
	this.send = function(cmd, args){
		this.client.send(cmd, args, this);
	}
	
	this.sendEvent = function(Event, args){
		this.send("Event", {
			event: Event,
			data: args
		});
	}
	
	this.leave = function(){
		this.trigger("unsub", [this.client.user, this]);
		
		this.client.send('LEFT', {"channel": this.name});
		
		APS.debug("Unsubscribed from ("+this.name+")");
		
		delete this.client.channels[this.name];
	}
	
	this.on = APS.prototype.on.bind(this);
	this.pub = APS.prototype.pub.bind(client, this.name);
	this.trigger = APS.prototype.trigger.bind(this);
	this.log = APS.prototype.log.bind(client, "[channel]", "["+this.name+"]");
	//this.log = APS.prototype.log.bind(client);
}
