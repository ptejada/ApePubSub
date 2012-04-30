//var APEChannel = function(pipe, ape) {
APE.channel = function(pipe, ape) {
	this.events = {};
	this.properties = pipe.properties;
	this.name = pipe.properties.name;
	this.pubid = pipe.pubid;
	this.ape = ape;
	this.users = {};
	
	this.addUser = function(u){
		this.users[u.properties.pubid] = u;
	}
	
	this.send = function(cmd, args){
		this.ape.send(cmd, args, this);
	}
	
	this.on = APE.prototype.on.bind(this);
	this.trigger = APE.prototype.trigger.bind(this);
}
