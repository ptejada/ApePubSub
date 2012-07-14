//var APSUser = function(pipe, client) {
APS.user = function(pipe, client){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.pubid = pipe.pubid;
	//this.client = client;
	this.channels = {};
	
	this.pub = APS.prototype.pub.bind(client, this.pubid);
	this.send = APS.prototype.send.bind(client, this.pubid);
	
	/*
	this.send = function(Event, data){
		client.sendCmd("Event", {
			event: Event,
			data: data
		}, this.pubid);
	}
	*/
}