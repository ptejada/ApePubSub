/**
 * Groups all client side classes documentation and definition
 * @module Client
 */
/**
 * The client constructor
 *
 * @version {{VERSION}}
 *
 * @param {string} server - The APE Server domain name including port number if other than 80
 * @param {object} [events] - Event handlers to be added to the client
 * @param {object} [options] - Options to configure the client {@link APS#option}
 *
 * @returns {APS} An APS client instance
 * @constructor
 * @memberOf module:Client~
 */
function APS( server, events, options ){
	/**
	 * The client options
	 *
	 * @type {{poll: number, debug: boolean, session: boolean, connectionArgs: {}, server: string, transport: Array, transport: string, secure: boolean, eventPush: boolean, addFrequency: boolean, autoUpdate: boolean}}
	 *
	 * @property {bool} [debug=false] - Enable and disable debugging features
	 *                                 such as the log() function output
	 * @property {bool} [session=true] - Enable and disable user sessions
	 * @property {string} [transport] - Explicitly use a transport. ws = WebSocket, lp = LongPolling
	 * @property {Array} [transport=['ws','lp']] - Which transport to try
	 *                                               and on what order
	 * @property {bool} [secure=false] - Whether the connection to the server should secure
	 * @property {string} [eventPush] - Path to a script to re-route all events to.
	 */
	this.option = {
		poll: 25000,
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
	/**
	 * The client identifier
	 * @type {string}
	 */
	this.identifier = "APS";
	/**
	 * The client version
	 * @type {string}
	 */
	this.version = '{{VERSION}}';
	/**
	 * The state of the client: 0=disconnected, 1=connected, 2=connecting
	 * @type {number}
	 */
	this.state = 0;
	/**
	 * The client events stack
	 * @type {Object}
	 * @private
	 */
	this._events = {};
	/**
	 * The current user object
	 * @type {APS.CUser}
	 */
	this.user = {};
	/**
	 * The collection of all objects on the client as pipes, both channels and users
	 * @type {Object}
	 * @private
	 */
	this.pipes = {};
	/**
	 * The collection of all channel object on the client
	 * @type {Object}
	 */
	this.channels = {};
	/**
	 * A second event stack to hold/cache the event of channels
	 * Use when reconnecting to the server and for channels that have been
	 * subscribe to yet
	 * @type {Object}
	 * @private
	 */
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

	/**
	 * The current user session object
	 * @type {APS.Session}
	 */
	this.session = new APS.Session(this);
	return this;
}

/**
 * Handles the initial connection to the server
 * 
 * @param args Arguments to send with the initial connect request
 * @private
 *
 * @return bool The client reference or false if the connection request has been canceled
 */
APS.prototype.connect = function(args){
	var fserver = this.option.server;
	
	function TransportError(e){
		this.trigger("dead", [e]);
		this.transport.close();
        /*
         * Destroys the session
         */
        this.session.destroy();
        this.state = 0;
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
	this.session.saveFreq();
	
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
			
	}else{
		//Fresh Connect
		this.state = 0;
		//this.session.id = "";
		if(this.trigger("connect") == false)
			return false;
	}

	//Apply frequency to the server
	if(this.option.addFrequency)
		fserver = this.session.getFreq() + "." + fserver;
	
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

/**
 * Restore the connection to the server
 * @returns {*}
 */
APS.prototype.reconnect = function(){
	if(this.state > 0 && this.transport.state > 0)
		return this.log("Client already connected!");
	//Clear channels stack
	this.channels = {};
	this.connect();
}

/**
 * Triggers events
 * 
 * @param {string} ev - Name of the event to trigger, not case sensitive
 * @param {Object} args - An array of arguments to passed to the event handler function
 * 
 * @return {bool} False if any of the event handlers explicitly returns false, otherwise true
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
 * Add event handler(s) to the client
 *
 * Events added to the client are considered to be global event. For example
 * if adding the **message** event handler on the client it will be triggered
 * every time a channel receives a message event
 * 
 * @param {string} ev Name of the event handler to add, not case sensitive
 * @param {function} fn Function to handle the event
 * 
 * @return {bool|APS} False if wrong parameters are passed, otherwise the client or parent object reference
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
 * Get any object by its unique publisher id, user or channel
 *
 * @param {string} pubid A string hash
 * @return {bool|APS.User|APS.Channel}
 */
APS.prototype.getPipe = function( pubid ){
	if(pubid in this.pipes){
		return this.pipes[pubid];
	}
	return false;
}

/**
 * Sends an event through a pipe/user/channel
 * This function is not useful in this context
 * Its real use is when bound to a user or channel
 * objects. Consider using {@link APS.User#send user.send()} and
 * {@link APS.Channel#send channel.send()} instead
 * 
 * Although it could be useful if a developer has
 * its own way of getting a user's or channels's pubid
 * who object does not resides in the local client
 * 
 * @param {string|object} pipe The pubid string or pipe object of user or channel
 * @param {string} $event The name of the event to send
 * @param {*} data The data to send with the event
 * @param {bool} sync Weather to sync event across the user's session or not
 * @param {function} callback Function to call after the event has been sent
 * 
 * @return {APS} client or parent object reference
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
 * @param {string} cmd Name of command in the server which will handle the request
 * @param {*} args The data to send with the command
 * @param {string|object} pipe The pubid string or pipe object of user or channel
 * @param {function} callback Function to after the event has been sent
 * @private
 *
 * @return (object) client reference
 */
APS.prototype.sendCmd = function(cmd, args, pipe, callback){
	var specialCmd = {CONNECT: 0, RESTORE:0};
	if(this.state == 1 || cmd in specialCmd){
		
		var tmp = {
			'cmd': cmd,
			'chl': this.transport.chl,
			'freq': this.session.getFreq()
		}
		
		if(args) tmp.params = args;
		if(pipe) {
			tmp.params.pipe = typeof pipe == 'string' ? pipe : pipe.pubid;
		}
		if(this.session.getID()) tmp.sessid = this.session.getID();
		
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
			this.transport.chl++;
		}
		
	} else {
		this.on('ready', this.sendCmd.bind(this, cmd, args));
	}
	
	return this;
}

/**
 * Polls the server for information when using the Long Polling transport
 * @private
 */
APS.prototype.poll = function(){
	if(this.transport.id == 0){
		clearTimeout(this.poller);
		this.poller = setTimeout(this.check.bind(this), this.option.poll);
	}
}

/**
 * Sends a check command to the server
 * @private
 */
APS.prototype.check = function(force){
	if(this.transport.id == 0 || !!force){
		this.sendCmd('CHECK');
		this.poll();
	}
}

/**
 * Log the user out and kill the client
 *
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
 * @param {string} channel -  Name of the channel to subscribe to
 * @param {object} Events - List of event handlers to add to the channel
 * @param {function} callback - Function to be called when a user successfully subscribes to the channel
 * 
 * @return {APS} client reference
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
/**
 * Alias for {@link APS#sub}
 * @see APS#sub
 * @methodOf APS
 * @function
 */
APS.prototype.subscribe = APS.prototype.sub;


/**
 * Publishes anything in a channel, a string, object, array or integer
 *
 * @param {string} channel The name of the channel
 * @param {*} data Data to send to the channel
 * @param {bool} sync Whether to to synchronize the event across the uer session
 * @param {function} callback Function called after the event is sent
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
 * Alias for {@link APS#pub}
 * @see APS#pub
 * @methodOf APS
 * @function
 */
APS.prototype.publish = APS.prototype.pub;

/**
 * Get a channel object by its name
 * 
 * @param channel Name of the channel
 * @return {bool|APS.Channel} Returns the channel object if it exists or false otherwise
 */
APS.prototype.getChannel = function(channel){
	channel = channel.toLowerCase();
	if(channel in this.channels){
		return this.channels[channel];
	}
	
	return false;
}

/**
 * Add event handler(s) to a channel
 *
 * With this method event handler(s) can be added to a channel event if the user is not subscribe to it yet.
 * @param {string} channel The channel name
 * @param {string|object} Events Either an event name or key pair of multiple events
 * @param {function} [fn] The callback function if Events is a string
 * @returns {bool|APS.Channel}
 */
APS.prototype.onChannel = function(channel, Events, fn){
	channel = channel.toLowerCase();
	
	if(channel in this.channels)
	{
		this.channels[channel].on(Events, fn);
	}
	else
	{
		if(typeof Events == "object"){
			//add events to queue
			if(typeof this.eQueue[channel] != "object")
				this.eQueue[channel] = [];

			//this.eQueue[channel].push(Events);
			for(var $event in Events){
				fn = Events[$event];

				this.eQueue[channel].push([$event, fn]);

				this.log("Adding ["+channel+"] event '"+$event+"' to queue");
			}
		}else{
			var xnew = Object();
			xnew[Events] = fn;
			this.onChannel(channel,xnew);
		}
	}
		

}

/**
 * Unsubscribe from a channel
 * 
 * @param {string} channel - Name of the channel to unsubscribe
 */
APS.prototype.unSub = function(channel){
	if(channel == "") return;
	this.getChannel(channel).leave();
}
/**
 * Alias of {@link APS#unSub}
 * @see APS#unSub
 * @methodOf APS
 * @function
 */
APS.prototype.unSubscribe = APS.prototype.unSub;

/*
 * Debug Function for Browsers console
 */
if(navigator.appName != "Microsoft Internet Explorer"){
	/**
	 * Logs data to the browser console if debugging is enable
	 * @type {Function}
	 */
	APS.prototype.log = function(){
		if(this.option.debug)
		{
			var args =  Array.prototype.slice.call(arguments);
			args.unshift("["+this.identifier+"]");

			window.console.log.apply(console, args);
		}
	};
}