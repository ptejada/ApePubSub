/*
 * User object constructor
 */
APS.user = function(pipe, client){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.pubid = pipe.pubid;
	this.channels = {};
	
	this.pub = APS.prototype.pub.bind(client, this.pubid);
	this.send = APS.prototype.send.bind(client, this.pubid);
	
	this.update = function(o){
		if(o._rev > this._rev){
			for(var i in o){
				if(this[i] != o[i]){
					this[i] = o[i];
					client.trigger("property"+i+"Update", [o[i], this]);
					client.trigger("propertyUpdate",[i, o[i], this]);
				}
			}
		}
	}
}

/*
 * Current user object constructor
 */
APS.cUser = function(pipe, client){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.update = function(o){
		if(o._rev > this._rev){
			for(var i in o){
				if(this[i] != o[i]){
					this[i] = o[i];
					this.trigger("property"+i+"Update",[o[i], this]);
					this.trigger("propertyUpdate",[i, o[i], this]);
				}
			}
		}
	}
	
	this.change = function(name, value){
		if(typeof name == "object"){
			var data = name;
		}else{
			var data = {};
			data[name] = value;
		}
		
		this.update(data);
		this._client.sendCmd("propUpdate", data);
	}
	
	this._events = {};
	this._client = client;
	this.pubid = pipe.pubid;
	this.channels = {};
	
	this.on = client.on.bind(this);
	this.trigger = client.trigger.bind(this);
	this.log = client.log.bind(client, "[CurrentUser]");
}
