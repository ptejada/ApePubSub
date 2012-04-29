//var APEUser = function(pipe, ape) {
APE.user = function(pipe, ape) {
	this.properties = pipe.properties;
	this.pubid = pipe.pubid;
	this.ape = ape;
	this.channels = {};
}
APE.user.prototype.send = function(cmd, args) {
	this.ape.send(cmd, args, this);
}
