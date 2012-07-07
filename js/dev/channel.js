//var APSChannel = function(pipe, ape) {
APS.channel = function(pipe, ape) {
	this.events = {};
	this.properties = pipe.properties;
	this.name = pipe.properties.name;
	this.pubid = pipe.pubid;
	this.ape = ape;
	this.users = {};
	
	this.addUser = function(u){
		this.users[u.pubid] = u;
	}
	
	this.send = function(cmd, args){
		this.ape.send(cmd, args, this);
	}
	
	this.leave = function(){
		this.trigger("unsub", [this.ape.user, this]);
		
		this.ape.send('LEFT', {"channel": this.name});
		
		APS.debug("Unsubscribed from ("+this.name+")");
		
		delete this.ape.channels[this.name];
	}
	
	this.on = APS.prototype.on.bind(this);
	this.pup = APS.prototype.pub.bind(ape, this.name);
	this.trigger = APS.prototype.trigger.bind(this);
	this.log = APS.prototype.log.bind(this, "[CHANNEL]", "["+this.name+"]");
}
