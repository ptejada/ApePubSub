APS.prototype.session = {
	id: "",
	chl: {},
	client: {},
	cookie: {},
	data: {},
	
	save: function(){
		if(!this.client.options.session) return;
		
		var pubid = this.client.user.pubid;
		var client = this.client;
		
		var session = {
			channels: Object.keys(client.channels),
			id: this.id,
			pubid: pubid
		}
		
		this.cookie.change(this.id);
		this.saveChl()
		
		//client.send("saveSESSION", session);
	},
	
	saveChl: function(){
		if(!this.client.options.session) return;

		this.chl.change(this.client.chl);
	},
	
	destroy: function(){
		this.cookie.destroy();
		this.chl.destroy();
		this.client.chl = 0;
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
		var client = this.client;
		
		//alert("restoring")
		this.chl = new APS.cookie(client.identifier + "_chl");
		this.cookie = new APS.cookie(client.identifier + "_session");
		
		
		client.chl = this.chl.value || 0;
		
		if(typeof this.cookie.value == "string"){
			this.id = this.cookie.value;
		}else{
			this.destroy();
			//alert("no session")
			return false;
		}
		
		client.chl++;
		//Restoring session state == 2
		client.state = 2;
		client.send('RESTORE', {sid: this.id})
		return true;
	},
	
	connect: function(){
		var client = this.client;
		var args = client.options.connectionArgs
		
		this.destroy();
		client.send('CONNECT', args);
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