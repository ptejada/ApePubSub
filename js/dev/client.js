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
				this.log("{{{ " + ev + " }}} on client ", this.ape);
			}
		}
	}
	
	//Local
	for(var i in this.events[ev]){
		if(this.events[ev].hasOwnProperty(i)){
			this.events[ev][i].apply(this, args);
			if(!this.ape){
				this.log("{{{ " + ev + " }}} on client ", this);
			}else{
				this.log("{{{ " + ev + " }}} on channel " + this.name, this);
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

		this.log('<<<< ', cmd.toUpperCase() , " >>>> ", tmp);
		
		if(typeof callback != "function")	callback = function(){};
		
		this.log(tmp);
		var data = [];
		try { 
			data = JSON.stringify([tmp]);
		}catch(e){
			this.log(e);
			this.log(data);
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

APE.prototype.sub = function(channel, Events, callback){
	//Handle the events
	if(typeof Events == "object"){
		if(typeof channel == "object"){
			for(var chan in channel){
				this.onChannel(channel[chan], Events);
			}
		}else{
			this.onChannel(channel, Events);
		}
	}
	
	//Handle callback
	if(typeof callback == "function"){
		if(typeof channel == "object"){
			for(var chan in channel){
				this.onChannel(channel[chan], "joined", callback);
			}
		}else{
			this.onChannel(channel, "joined", callback);
		}
	}
	
	//Join Channel
	if(this.state == 0){
		this.on("ready", this.sub.bind(this, channel));
		this.connect({user: this.user});
		
	}else if(typeof this.channels[channel] != "object"){
		this.send('JOIN', {'channels': channel});
	}
	
	return this;
}

APE.prototype.pub = function(channel, data){
	var pipe = this.getChannel(channel);
	
	if(pipe){
		var args = {data: data};
		pipe.send("Pub", args);
		pipe.trigger("pub",args);
	}else{
		this.log("NO Channel " + channel);
	}
};

APE.prototype.getChannel = function(channel){
	if(channel in this.channels){
		return this.channels[channel];
	}
	
	return false;
}

APE.prototype.onChannel = function(channel, Events, fn){
	if(channel in this.channels){
		this.channels[channel].on(Events, fn);
		return true;
	}
	
	if(typeof Events == "object"){
		//add events to queue
		if(typeof this.events._queue[channel] != "object")
			this.events._queue[channel] = [];
		
		//this.events._queue[channel].push(Events);
		for(var $event in Events){
			var fn = Events[$event];
			
			this.events._queue[channel].push([$event, fn]);
			
			this.log("Adding ["+channel+"] event '"+$event+"' to queue");
		}
	}else{
		var xnew = Object();
		xnew[Events] = fn;
		this.onChannel(channel,xnew);
	}
}

APE.prototype.unSub = function(channel){
	if(channel == "") return;
	this.getChannel(channel).leave();
}

//Debug Function for Browsers console
APE.prototype.log = function($obj){
	if(!this.debug) return;
	
	var args =  Array.prototype.slice.call(arguments);
	args.unshift("[APE]");
	
	window.console.log.apply(console, args);
};
