//var APSUser = function(pipe, ape) {
APS.user = function(pipe, ape){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.pubid = pipe.pubid;
	this.ape = ape;
	this.channels = {};
}

APS.user.prototype.send = function(cmd, args) {
	this.ape.send(cmd, args, this);
}
