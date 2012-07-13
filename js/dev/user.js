//var APSUser = function(pipe, client) {
APS.user = function(pipe, client){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.pubid = pipe.pubid;
	//this.client = client;
	this.channels = {};
	
	this.send = function(Event, data){
		client.sendCmd("Event", {
			event: Event,
			data: data
		}, this.pubid);
	}
}