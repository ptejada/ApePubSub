function APS( server, events, options ){
	this.option = {
		'poll': 25000,
		debug: false,
		session: true,
		connectionArgs: {},
		server: server,
		transport: ["wb", "lp"],
		//transport: "lp",	//Should be the default transport option for APE Server v1.1.1
		secure: false,
		eventPush: false
	}
	this.identifier = "APS";
	this.version = '1.1b4';
	this.state = 0;
	this._events = {};
	this.chl = 0;
	this.user = {};
	this.pipes = {};
	this.channels = {};
	this.eQueue = {};
	
	//Add Events
	if(!!events)
		this.on(events);
	
	//Update options
	if(!!options){
		for(var opt in options){
			this.option[opt] = options[opt];
		}
	}
	
	//IE9 crap - log function fix
	if(navigator.appName == "Microsoft Internet Explorer"){
		if(typeof window.console == "undefined"){
			this.log = function(){};
		}else{
			this.log = function(){
				if(this.option.debug == false) return;
				
				var args =  Array.prototype.slice.call(arguments);
				args.unshift("["+this.identifier+"]");
		
				window.console.log(args.join().replace(",",""));
			}
			
		}
	}
	
	function TransportError(e){
		this.trigger("dead", [e]);
		this.transport.close();
	}
	
	var cb = {
		'onmessage': this.onMessage.bind(this),
		'onerror': TransportError.bind(this)
	}

	this.connect = function(args){
		if(this.state == 1) 
			return this.log("Already Connected!");
		
		var cmd = "CONNECT";
		args = this.option.connectionArgs = args || this.option.connectionArgs;
		
		//Handle sessions
		if(this.option.session == true){
			
			var restore = this.session.restore();
			if(typeof restore == "object"){
				args = restore;
				//Change initial command CONNECT by RESTORE
				cmd = "RESTORE";
			}else{
				//Fresh Connect
				if(this.trigger("connect") == false)
					return false;
			}
			
			//Apply frequency to the server
			server = this.session.freq.value + "." + server;
			
			//increase frequency
			this.session.freq.change(parseInt(this.session.freq.value) + 1);
			
		}else{
			//Fresh Connect
			if(this.trigger("connect") == false)
				return false;
		}
		
		
		//Handle transport
		if(!!this.transport){
			if(this.transport.state == 0){
				this.transport = new APS.transport(server, cb, this);
			}else{
				//Use current active transport
				
			}
		}else{
			this.transport = new APS.transport(server, cb, this);
		}
		
		//Send seleced command and arguments
		this.sendCmd(cmd, args);
		
		return this;
	}
	
	this.session._client = this;
	return this;
}

APS.prototype.reconnect = function(){
	if(this.state > 0) return this.log("Client already connected!");
	//Clear channels stack
	this.channels = {};
	this.connect();
}

APS.prototype.trigger = function(ev, args){
	ev = ev.toLowerCase();
	
	if(!(args instanceof Array)) args = [args];
	
	//GLobal
	if("_client" in this){
		for(var i in this._client._events[ev]){
			if(this._client._events[ev].hasOwnProperty(i)){ 
				this.log("{{{ " + ev + " }}} on client ", this._client);
				if(this._client._events[ev][i].apply(this, args) === false)
					return false;
			}
		}
	}
	
	//Local
	for(var i in this._events[ev]){
		if(this._events[ev].hasOwnProperty(i)){
			if(!this._client){
				this.log("{{{ " + ev + " }}} on client ", this);
			}else{
				this.log("{{{ " + ev + " }}} ", this);
			}
			if(this._events[ev][i].apply(this, args) === false)
				return false;
		}
	}
	
	return true;
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
		e = e.toLowerCase();
		if(!this._events[e])
			this._events[e] = [];
		this._events[e].push(fn);
	}
	
	return this;
}

APS.prototype.getPipe = function(user){
	if(typeof user == 'string'){
		return this.pipes[user];
	} else {
		return this.pipes[user.pubid];
	}
}

APS.prototype.send = function(pipe, $event, data, sync, callback){
	this.sendCmd("Event", {
		event: $event,
		data: data,
		sync: sync
	}, pipe, callback);
}

APS.prototype.sendCmd = function(cmd, args, pipe, callback){
	var specialCmd = {CONNECT: 0, RESTORE:0};
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
		
		var data = [];
		try { 
			data = JSON.stringify([tmp]);
		}catch(e){
			this.log(e);
			this.log(data);
		}
		
		//Send command
		if(this.transport.send(data, callback, tmp) != "pushed"){
			this.session.saveChl();
		}
		
	} else {
		this.on('ready', this.sendCmd.bind(this, cmd, args));
	}
	
	return this;
}

APS.prototype.poll = function(){
	if(this.transport.id == 0){
		clearTimeout(this.poller);
		this.poller = setTimeout(this.check.bind(this), this.option.poll);
	}
}

APS.prototype.check = function(force){
	if(this.transport.id == 0 || !!force){
		this.sendCmd('CHECK');
		this.poll();
	}
}

APS.prototype.quit = function(){
	this.sendCmd('QUIT');
	this.transport.close();
	this.trigger("dead");
	//Clear session on 'quit'
	this.session.destroy();
	this.state = 0;
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
		
	}else{
		//Logic to only send the JOIN request to only non-existing channels in the client object
		if(typeof channel == "string"){
			//Single Channel
			if(typeof this.channels[channel] != "object"){
				this.sendCmd('JOIN', {'channels': channel});
			}
		}else{
			//Multi Channel
			var toJoin = [];
			for(var x in channel){
				if(typeof this.channels[channel[x]] != "object")
					toJoin.push(channel[x]);
			}
			
			if(toJoin.length > 0)
				this.sendCmd('JOIN', {'channels': toJoin});
				
		}
	}
	
	return this;
}

APS.prototype.pub = function(channel, data, sync, callback){
	var pipe = this.getChannel(channel);
	if(!pipe && channel.length == 32) pipe = this.getPipe(channel);
	
	if(pipe){
		var $event = typeof data == "string" ? "message" : "data";
		pipe.send($event, data, sync, callback);
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
	APS.prototype.log = function(){
		if(!this.option.debug) return;
		
		var args =  Array.prototype.slice.call(arguments);
		args.unshift("["+this.identifier+"]");
		
		window.console.log.apply(console, args);
	};
	
}
