APS.user = function(pipe, client){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.pubid = pipe.pubid;
	this.channels = {};
	
	this.pub = APS.prototype.pub.bind(client, this.pubid);
	this.send = APS.prototype.send.bind(client, this.pubid);
	
	this.update = function(o){
		for(var i in o){
			if(this[i] != o[i]) this[i] = o[i];
		}
	}
}

//Object for current user
APS.cUser = function(pipe, client){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.update = function(o){
		for(var i in o){
			if(this[i] != o[i]) this[i] = o[i];
		}
	}
	
	this._events = {};
	this._client = client;
	this.pubid = pipe.pubid;
	this.channels = {};
	
	this.on = client.on.bind(this);
	this.trigger = client.trigger.bind(this);
	this.log = client.log.bind(client, "[CurrentUser]");
}
