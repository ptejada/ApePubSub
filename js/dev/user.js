//var APSUser = function(pipe, client) {
APS.user = function(pipe, client){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.pubid = pipe.pubid;
	this.client = client;
	this.channels = {};
}

APS.user.prototype.send = function(cmd, args) {
	this.client.send(cmd, args, this);
}
