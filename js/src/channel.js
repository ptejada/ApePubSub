//var APSChannel = function(pipe, client) {
APS.channel = function(pipe, client) {
	
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this._events = {};
	this.pubid = pipe.pubid;
	this._client = client;
	
	
	this.update = function(o){
		for(var i in o){
			if(this[i] != o[i]) this[i] = o[i];
		}
	}
	
	this.leave = function(){
		this.trigger("unsub", [client.user, this]);
		
		client.sendCmd('LEFT', {"channel": this.name});
		
		this.log("Unsubscribed");
		
		delete client.channels[this.name];
	}
	
	if(this.name.indexOf("*") !== 0){
		//Methods and prop for interactive channels
		this.users = {};
		this.addUser = function(u){
			this.users[u.pubid] = u;
		}
		this.send = APS.prototype.send.bind(client, this.pubid);
		this.pub = client.pub.bind(client, this.name);
	}
	
	this.on = client.on.bind(this);
	this.trigger = client.trigger.bind(this);
	this.log = client.log.bind(client, "[channel]", "["+this.name+"]");
}
