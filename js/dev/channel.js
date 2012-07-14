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
	
	/*
	this.send = function(Event, data){
		client.sendCmd("Event", {
			event: Event,
			data: data
		}, this.pubid);
	}
	*/
	
	this.leave = function(){
		this.trigger("unsub", [client.user, this]);
		
		client.sendCmd('LEFT', {"channel": this.name});
		
		this.log("Unsubscribed from ("+this.name+")");
		
		delete client.channels[this.name];
	}
	
	this.send = APS.prototype.send.bind(client, this.pubid);
	
	this.on = APS.prototype.on.bind(this);
	this.pub = APS.prototype.pub.bind(client, this.name);
	this.trigger = APS.prototype.trigger.bind(this);
	this.log = APS.prototype.log.bind(client, "[channel]", "["+this.name+"]");
	//this.log = APS.prototype.log.bind(client);
}
