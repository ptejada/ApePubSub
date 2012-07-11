function APS( server, events, options ){
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
	this.events = {};
	this.chl = 0;
	this.user = {};
	this.pipes = {};
	this.channels = {};
	this.eQueue = {};
	
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
		
		server = server || APS.server;
		if(this.state == 0)
			this.transport = new APS.transport(server, cb, options);
		
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

APS.prototype.trigger = function(ev, args){
	ev = ev.toLowerCase();
	if(!(args instanceof Array)) args = [args];
	
	//GLobal
	if("client" in this){
		for(var i in this.client.events[ev]){
			if(this.client.events[ev].hasOwnProperty(i)){ 
				this.client.events[ev][i].apply(this, args);
				this.log("{{{ " + ev + " }}} on client ", this.client);
			}
		}
	}
	
	//Local
	for(var i in this.events[ev]){
		if(this.events[ev].hasOwnProperty(i)){
			this.events[ev][i].apply(this, args);
			if(!this.client){
				this.log("{{{ " + ev + " }}} on client ", this);
			}else{
				this.log("{{{ " + ev + " }}} ", this);
			}
		}
	}
}

APS.prototype.on = function(ev, fn){
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

APS.prototype.getPipe = function(user){
	if(typeof user == 'string'){
		return this.pipes[user];
	} else {
		return this.pipes[user.getPubid()];
	}
}

APS.prototype.send = function(cmd, args, pipe, callback){
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

APS.prototype.poll = function(){
	if(this.transport.id == 0)
		this.poller = setTimeout((function(){ this.check() }).bind(this), this.options.poll);
}

APS.prototype.check = function(){
	if(this.transport.id == 0)
		this.send('CHECK');
}

APS.prototype.sub = function(channel, Events, callback){
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

APS.prototype.pub = function(channel, data){
	var pipe = this.getChannel(channel);
	
	if(pipe){
		var args = {data: data};
		pipe.send("Pub", args);
		pipe.trigger("pub",args);
	}else{
		this.log("NO Channel " + channel);
	}
};

APS.prototype.getChannel = function(channel){
	channel = channel.toLowerCase();
	if(channel in this.channels){
		return this.channels[channel];
	}
	
	return false;
}

APS.prototype.onChannel = function(channel, Events, fn){
	channel = channel.toLowerCase();
	
	if(channel in this.channels){
		this.channels[channel].on(Events, fn);
		return true;
	}
	
	if(typeof Events == "object"){
		//add events to queue
		if(typeof this.eQueue[channel] != "object")
			this.eQueue[channel] = [];
		
		//this.eQueue[channel].push(Events);
		for(var $event in Events){
			var fn = Events[$event];
			
			this.eQueue[channel].push([$event, fn]);
			
			this.log("Adding ["+channel+"] event '"+$event+"' to queue");
		}
	}else{
		var xnew = Object();
		xnew[Events] = fn;
		this.onChannel(channel,xnew);
	}
}

APS.prototype.unSub = function(channel){
	if(channel == "") return;
	this.getChannel(channel).leave();
}

//Debug Function for Browsers console
if(navigator.appName != "Microsoft Internet Explorer"){
	APS.prototype.log = function($obj){
		if(!this.debug) return;
		
		var args =  Array.prototype.slice.call(arguments);
		args.unshift("[APS]");
		
		window.console.log.apply(console, args);
	};
	
}else{
	APS.prototype.log = function(){}	
}

