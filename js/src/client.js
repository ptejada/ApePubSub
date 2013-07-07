/**
 * The client constructor
 * 
 * @param server The APE Server Url including port number
 * @param events Event handlers to be added to the client
 * @param options Options to configure the client
 *
 * @returns {*} An APS client instance
 * @constructor
 */
function APS( server, events, options ){
	this.option = {
		'poll': 25000,
		debug: false,
		session: true,
		connectionArgs: {},
		server: server,
		transport: ["ws", "lp"],
		//transport: "lp",	//Should be the default transport option for APE Server v1.1.1
		secure: false,
		eventPush: false,
		addFrequency: true,
		autoUpdate: true
	}
	this.identifier = "APS";
	this.version = '1.5.9';
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
	
	this.session._client = this;
	return this;
}

/**
 * Handles the initial connection to the server
 * 
 * @param args Arguments to send with the initial connect request
 * 
 * @return bool The client reference or false if the connection request has been canceled
 */
APS.prototype.connect = function(args){
	var fserver = this.option.server;
	
	function TransportError(e){
		this.trigger("dead", [e]);
		this.transport.close();
	}
	
	var cb = {
		'onmessage': this.onMessage.bind(this),
		'onerror': TransportError.bind(this)
	}
	
	if(this.state == 1)
		return this.log("Already Connected!");
		
	var cmd = "CONNECT";
	args = this.option.connectionArgs = args || this.option.connectionArgs;
	
	var restore = this.session.restore();
	//increase frequency
	this.session.freq.change(parseInt(this.session.freq.value) + 1);
	
	//Handle sessions
	if(this.option.session == true){
		
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
		if(this.option.addFrequency)
			fserver = this.session.freq.value + "." + fserver;
			
	}else{
		//Fresh Connect
		this.state = 0;
		//this.session.id = "";
		if(this.trigger("connect") == false)
			return false;
	}
	
	
	//Handle transport
	if(!!this.transport){
		if(this.transport.state == 0){
			this.transport = new APS.Transport(fserver, cb, this);
		}else{
			//Use current active transport
			
		}
	}else{
		this.transport = new APS.Transport(fserver, cb, this);
	}
	
	//Attach version of client framework
	args.version = this.version;
	
	//Send seleced command and arguments
	this.sendCmd(cmd, args);
	
	return this;
}
	
/*
 * Attempts to reconnect to the server
 */
APS.prototype.reconnect = function(){
	if(this.state > 0 && this.transport.state > 0)
		return this.log("Client already connected!");
	//Clear channels stack
	this.channels = {};
	this.connect();
}

/**
 * Fires events on object's _events stack
 * 
 * @param ev Name of the event to trigger, not case sensitive
 * @param args An array of arguments to passed to the event handler function
 * 
 * @return bool False if any of the event handlers explicitly returns false, otherwise true
 */
APS.prototype.trigger = function(ev, args){
	ev = ev.toLowerCase();
	
	if(!(args instanceof Array)) args = [args];
	
	//GLobal
	if("_client" in this){
		for(var i in this._client._events[ev]){
			if(this._client._events[ev].hasOwnProperty(i)){
				this.log("{{{ " + ev + " }}}["+i+"] on client ", this._client);
				if(this._client._events[ev][i].apply(this, args) === false)
					return false;
			}
		}
	}

	//Local
	for(var i in this._events[ev]){
		if(this._events[ev].hasOwnProperty(i)){
			if(!this._client){
				this.log("{{{ " + ev + " }}}["+i+"] on client ", this);
			}else{
				this.log("{{{ " + ev + " }}}["+i+"] ", this);
			}
			if(this._events[ev][i].apply(this, args) === false)
				return false;
		}
	}

	return true;
}

/**
 * Use to handles events on all object
 * 
 * @param ev Name of the event handler to add, not case sensitive
 * @param fn Function to handle the event
 * 
 * @return bool|object False if wrong parameters are passed, otherwise the client or parent object reference
 */
APS.prototype.on = function(ev, fn){
	var Events = [];

	if(typeof ev == 'string' && typeof fn == 'function'){
		Events[ev] = fn;
	}else if(typeof ev == "object"){
		Events = ev;
	}else{
		this.log("Wrong parameters passed to on() method");
		return false;
	}
	
	for(var e in Events){
		if(!Events.hasOwnProperty(e)) continue;
		var fn = Events[e];
		e = e.toLowerCase();
		if(!this._events[e])
			this._events[e] = [];
		this._events[e].push(fn);
	}
	
	return this;
}

/**
 * Get any object by its unique pubid, user or channel
 */
APS.prototype.getPipe = function(user){
	if(typeof user == 'string'){
		return this.pipes[user];
	} else {
		return this.pipes[user.pubid];
	}
}

/**
 * Sends an event through a pipe/user/channel
 * This function is not useful in this context
 * Its real use is when bound to a user or channel
 * objects.
 * 
 * Although it could be useful if a developer has
 * its own way of getting a user's or channels's pubid
 * who object does not resides in the local client
 * 
 * @param pipe The pubid string or pipe object of user or channel
 * @param $event The name of the event to send
 * @param data The data to send with the event
 * @param sync Weather to sync event across the user's session or not
 * @param callback Function to after the event has been sent
 * 
 * @return (object) client or parent object reference
 */
APS.prototype.send = function(pipe, $event, data, sync, callback){
	this.sendCmd("Event", {
		event: $event,
		data: data,
		sync: sync
	}, pipe, callback);
	
	return this;
}

/**
 * Internal method to wrap events and send them as commands to the server
 * 
 * @param cmd Name of command in the server which will handle the request
 * @param args The data to send with the command
 * @param pipe The pubid string or pipe object of user or channel
 * @param callback Function to after the event has been sent
 * 
 * @return (object) client reference
 */
APS.prototype.sendCmd = function(cmd, args, pipe, callback){
	var specialCmd = {CONNECT: 0, RESTORE:0};
	if(this.state == 1 || cmd in specialCmd){
		
		var tmp = {
			'cmd': cmd,
			'chl': this.chl,
			'freq': this.session.freq.value
		}
		
		if(args) tmp.params = args;
		if(pipe) {
			tmp.params.pipe = typeof pipe == 'string' ? pipe : pipe.pubid;
		}
		if(this.session.id) tmp.sessid = this.session.id;
		
		this.log('<<<< ', cmd.toUpperCase() , " >>>> ", tmp);
		
		if(typeof callback != "function")	callback = function(){};
		
		var data = [];
		try {
			data = JSON.stringify([tmp]);
		}catch(e){
			this.log(e);
			this.log("Data Could not be strigify:", data);
			this.quit();
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

/**
 * Polls the server for information when using the Long Polling transport
 */
APS.prototype.poll = function(){
	if(this.transport.id == 0){
		clearTimeout(this.poller);
		this.poller = setTimeout(this.check.bind(this), this.option.poll);
	}
}

/**
 * Sends a check command to the server
 */
APS.prototype.check = function(force){
	if(this.transport.id == 0 || !!force){
		this.sendCmd('CHECK');
		this.poll();
	}
}

/**
 * Sends the QUIT command to the server and completely destroys the client instance
 * and session
 */
APS.prototype.quit = function(){
	this.sendCmd('QUIT');
	this.transport.close();
	this.trigger("dead");
	//Clear session on 'quit'
	this.session.destroy();
	this.state = 0;
}

/**
 * Subscribe to a channel
 * 
 * @param channel Name of the channel to subscribe to
 * @param Events List of events to add to the channel
 * @param callback Function to be called when a user successfuly subscribes to the channel
 * 
 * @return (object) client reference
 */
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
			channel = channel.toLowerCase();
			if(typeof this.channels[channel] != "object"){
				this.sendCmd('JOIN', {'channels': [channel]});
			}else{
				this.log("User already subscribed to [" + channel + "]");
			}
		}else{
			//Multi Channel
			var toJoin = [];
			for(var x in channel){
				if(typeof this.channels[channel[x].toLowerCase()] != "object")
					toJoin.push(channel[x]);
			}
			
			if(toJoin.length > 0)
				this.sendCmd('JOIN', {'channels': toJoin});
				
		}
	}

	return this;
}

/*
 * Publish data/message in a channel or to a user
 */
APS.prototype.pub = function(channel, data, sync, callback){
	var pipe = this.getChannel(channel);
	if(!pipe && channel.length == 32) pipe = this.getPipe(channel);
	
	if(pipe){
		var $event = typeof data == "string" ? "message" : "data";
		if($event == "message") data = encodeURIComponent(data);
		pipe.send($event, data, sync, callback);
	}else{
		this.log("NO Channel " + channel);
	}
};

/**
 * Get a channel object by its name
 * 
 * @param channel Name of the channel
 */
APS.prototype.getChannel = function(channel){
	channel = channel.toLowerCase();
	if(channel in this.channels){
		return this.channels[channel];
	}
	
	return false;
}

/*
 * Add events to a channel, even if the user has not subscribed to it yet
 */
APS.prototype.onChannel = function(channel, Events, fn){
	channel = channel.toLowerCase();
	
	if(channel in this.channels){
		return this.channels[channel].on(Events, fn);
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

/**
 * Unsubscribe from a channel
 * 
 * @param channel Name of the channel to unsubscribe
 */
APS.prototype.unSub = function(channel){
	if(channel == "") return;
	this.getChannel(channel).leave();
}

/*
 * Debug Function for Browsers console
 */
if(navigator.appName != "Microsoft Internet Explorer"){
	APS.prototype.log = function(){
		if(!this.option.debug) return;
		
		var args =  Array.prototype.slice.call(arguments);
		args.unshift("["+this.identifier+"]");
		
		window.console.log.apply(console, args);
	};

}