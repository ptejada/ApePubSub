function APS( server, events, options ){
	this.option = {
		'poll': 25000,
		debug: false,
		session: true,
		connectionArgs: {},
		server: server,
		transport: ["wb", "lp"],
		//transport: "lp",
		secure: false,
		eventPush: false
	}
	this.identifier = "APS";
	this.version = '1.0b3';
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
		
		var client = this;
		this.option.connectionArgs = args || this.option.connectionArgs;
		
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
		
		//Handle sessions
		if(this.option.session == true){
			if(this.session.restore() == true){
				return this;
			}
		}
		
		//Fresh Connect
		if(this.trigger("connect") == false)
			return false;
		
		this.sendCmd('CONNECT', this.option.connectionArgs);
		
		return this;
	}
	
	function getTransport() {
		if('XMLHttpRequest' in window) return XMLHttpRequest;
		if('ActiveXObject' in window) {
			var names = [
				"Msxml2.XMLHTTP.6.0",
				"Msxml2.XMLHTTP.3.0",
				"Msxml2.XMLHTTP",
				"Microsoft.XMLHTTP"
			];
			for(var i in names){
				try{ return ActiveXObject(names[i]); }
				catch(e){}
			}
		}
		return false;
	}
		
	var transport = getTransport();
		
	this.request = function(addr, data, callback){
		request = new transport();
		request.onreadystatechange = function(){
			if(this.readyState == 4) 
				callback(this.responseText);
		};
		request.open('POST', addr, true);
		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
		request.send(data);
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

APS.prototype.send = function(pipe, $event, data, callback){
	this.sendCmd("Event", {
		event: $event,
		data: data
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
			this.chl++;
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
		
	}else if(typeof this.channels[channel] != "object"){
		this.sendCmd('JOIN', {'channels': channel});
	}
	
	return this;
}

APS.prototype.pub = function(channel, data, callback){
	var pipe = this.getChannel(channel);
	if(!pipe && channel.length == 32) pipe = this.getPipe(channel);
	
	if(pipe){
		var $event = typeof data == "string" ? "message" : "data";
		var args = {data: data};
		pipe.send($event, data, callback);
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
