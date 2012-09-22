APS.prototype.session = {
	id: "",
	chl: {},
	_client: {},
	cookie: {},
	freq: {},
	data: {},
	
	save: function(){
		if(!this._client.option.session) return;
		
		var pubid = this._client.user.pubid;
		var client = this._client;
		
		var session = {
			channels: Object.keys(client.channels),
			id: this.id,
			pubid: pubid
		}
		
		this.cookie.change(this.id + ":" + pubid);
		this.saveChl();
		
		//client.sendCmd("saveSESSION", session);
	},
	 
	saveChl: function(){
		if(!this._client.option.session) return;

		this.chl.change(this._client.chl);
	},
	
	destroy: function(){
		console.log("DESTROY");
		if(!this._client.option.session) return;
		
		this.cookie.destroy();
		this.chl.destroy();
		this.freq.change(0);
		this._client.chl = 0;
		this.id = null;
		this.properties = {};
	},
	
	get: function(index){
		return this.data[index];
	},
	
	set: function(index, val){
		this.data[index] = val;
	},
	
	restore: function(){
		var client = this._client;
		
		//alert("restoring")
		this.chl = new APS.cookie(client.identifier + "_chl");
		this.cookie = new APS.cookie(client.identifier + "_session");
		this.freq = new APS.cookie(client.identifier + "_frequency");
		
		client.chl = this.chl.value || 0;
		
		if(!!!this.freq.value){
			console.log("changed FREQUENCY!");
			console.log(this.freq.value);
		}
		
		console.log(this.cookie.value);
		
		if(typeof this.cookie.value == "string"){
			var data = this.cookie.value.split(":");
			this.id = data[0];
		}else{
			this.destroy();
			console.log("no restore", this.freq.value );
			return false;
		}
		
		
		client.chl++;
		//Restoring session state == 2
		client.state = 2;
		return {sid: data[0], pubid: data[1]};
		//client.sendCmd('RESTORE', {sid: data[0], pubid: data[1]})
		
		return true;
	},
	
	connect: function(){
		var client = this._client;
		
		this.destroy();
		client.connect();
		//client.sendCmd('CONNECT', args);
	}
	
}

APS.cookie = function(name,value,days){
	this.change = function(value,days){
		var name = this.name;
		if(days){
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}else{
			var expires = "";
		}
		document.cookie = name+"="+value+expires+"; path="+this.path;
		this.value = value;
	}
	
	this.read = function(name){
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}
	
	this.destroy = function(){
		this.change("", -1);
	}
	
	this.path = "/";
	var exists = this.read(name);
	
	this.name = name;
	
	if(exists && typeof value == "undefined"){
		this.value = exists;
	}else{
		this.value = value;
		this.change(this.value, days);
	}
	return this;
}