function APE( server, events, options ){
	this.options = {
		'poll': 25000,
		debug: true,
		session: true,
		connectionArgs: {},
		server: server
	}
	this.identifier = "APS";
	this.version = 'draft-v2';
	this.state = 0;
	this.events = {_queue: {}};
	this.chl = 0;
	this.user = {};
	this.pipes = {};
	this.channels = {};
	
	//Add Events
	this.on(events);
	this.on("error004", function(){
		this.session.destroy();
		this.session.connect();
	})

	var cb = {
		'onmessage': this.onMessage.bind(this),
		'onerror': function(err){
			console.log("ERROR >> ",err);
		}
	}

	this.connect = function(args){
		var client = this;
		this.options.connectionArgs = args || this.options.connectionArgs;
		
		server = server || APE.server;
		if(this.state == 0)
			this.transport = new APE.transport(server, cb, options);
		
		//alert("connnecting...")
		
		//Handle sessions
		if(this.options.session == true){
			if(this.session.restore() == true) return this;
		}
		
		this.send('CONNECT', args);
		
		return this;
	}
	
	this.session.client = this;
	return this;
}

APE.prototype.trigger = function(ev, args){
	ev = ev.toLowerCase();
	if(!(args instanceof Array)) args = [args];
	
	//GLobal
	if("ape" in this){
		for(var i in this.ape.events[ev]){
			if(this.ape.events[ev].hasOwnProperty(i)){ 
				this.ape.events[ev][i].apply(this, args);
				APE.log("{{{ " + ev + " }}} on client ", this.ape);
			}
		}
	}
	
	//Local
	for(var i in this.events[ev]){
		if(this.events[ev].hasOwnProperty(i)){
			this.events[ev][i].apply(this, args);
			if(!this.ape){
				APE.log("{{{ " + ev + " }}} on client ", this);
			}else{
				APE.log("{{{ " + ev + " }}} on channel " + this.name, this);
			}
		}
	}
}

APE.prototype.on = function(ev, fn){
	var Events = [];
	
	if(typeof ev == 'string' && typeof fn == 'function'){
		Events[ev] = fn;
	}else if(typeof ev == "object"){
		Events = ev;
	}else{
		return this;
	}
	
	for(var e in Events){
		var fn = Events[e];
		if(!this.events[e])
			this.events[e] = [];
		this.events[e].push(fn);
	}
	
	return this;
}

APE.prototype.poll = function(){
	this.poller = setTimeout((function(){ this.check() }).bind(this), this.options.poll);
}

APE.prototype.getPipe = function(user){
	if(typeof user == 'string'){
		return this.pipes[user];
	} else {
		return this.pipes[user.getPubid()];
	}
}

APE.prototype.send = function(cmd, args, pipe, callback){
	var specialCmd = {CONNECT: 0, RESTORE:0, SESSION:0};
	if(this.state == 1 || cmd in specialCmd){

		var tmp = {
			'cmd': cmd,
			'chl': this.chl
		}

		if(args) tmp.params = args;
		if(pipe) tmp.params.pipe = typeof pipe == 'string' ? pipe : pipe.pubid; 
		if(this.session.id) tmp.sessid = this.session.id;

		APE.log('<<<< ', cmd.toUpperCase() , " >>>> ", tmp);
		
		if(typeof callback != "function")	callback = function(){};
		
		APE.log(tmp);
		var data = [];
		try { 
			data = JSON.stringify([tmp]);
		}catch(e){
			APE.log(e);
			APE.log(data);
		}
		
		//alert(data);
		
		this.transport.send(data);
		if(!(cmd in specialCmd)){
			clearTimeout(this.poller);
			this.poll();
		}
		this.chl++;
		this.session.saveChl();
	} else {
		this.on('ready', this.send.bind(this, cmd, args));
	}
	
	return this;
}

APE.prototype.check = function(){
	this.send('CHECK');
}

APE.prototype.join = function(channel){
	this.send('JOIN', {'channels': channel});
}

//Debug Function for Browsers console
APE.log = function($obj){
	if(!this.debug) return;
	
	var args =  Array.prototype.slice.call(arguments);
	args.unshift("[APE]");
	
	window.console.log.apply(console, args);
};
