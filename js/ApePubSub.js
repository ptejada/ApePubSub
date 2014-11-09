/**
 * @author Pablo Tejada
 * @repo https://github.com/ptejada/ApePubSub
 * @version 1.6.6
 * Built on 2014-11-09 @ 10:16
 */

/**
 * Client function to generates a random string
 *
 * @param {number} length - determines the length
 * @param {string} [keys] - an optional string of alternative characters to use
 * @returns {string}
 * @memberOf module:Client~
 */
function randomString(length, keys){
	var chars = keys || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = length || 32;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

/*
 * Official bind polyfill at developer.mozilla.org
 */
if(!Function.prototype.bind){
	Function.prototype.bind = function(oThis){
	if(typeof this !== "function"){
		// closest thing possible to the ECMAScript 5 internal IsCallable function
		throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	}

	var aArgs = Array.prototype.slice.call(arguments, 1), 
		fToBind = this, 
		fNOP = function(){},
		fBound = function(){
			return fToBind.apply(this instanceof fNOP
								 ? this
								 : oThis || window,
								 aArgs.concat(Array.prototype.slice.call(arguments)));
		};

	fNOP.prototype = this.prototype;
	fBound.prototype = new fNOP();

	return fBound;
	};
}

/**
 * Groups all client side classes documentation and definition
 * @module Client
 */
/**
 * The client constructor
 *
 * @version 1.6.6
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
	this.version = '1.6.6';
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

/*
 * The function parses all incoming information from the server.
 * Is the magical function, it takes the raw information 
 * and convert into useful dynamic data and objects. It is
 * also responsible for triggering most of the events in the
 * framework
 */
APS.prototype.onMessage = function(data){
	try {
		data = JSON.parse(data)
	}catch(e){
		//Temporary FIX for malformed JSON with escape single quotes
		data = data.replace(/\\'/g, "'");
		try {
			data = JSON.parse(data);
		}catch(e){
			e.type = "close";
			this.trigger("dead", [e]);
			return this.transport.close();
		}
	}
	
	//Initiate variables to be used in the loop below
	var raw, args, pipe, info, isIdent = false, check = true;
	
	for(var i in data){
		if(!data.hasOwnProperty(i)) continue;
		
		//Assign RAW paramenters to the variable for easy access
		raw = data[i].raw;
		args = data[i].data;
		pipe = null;
		
		//Log the name of the incoming RAW
		this.log('>>>> ', raw , " <<<< ", args);
		
		/*
		 * Filter the actions to be taking according to the 
		 * type of RAW recived
		 */
		switch(raw){
			case 'LOGIN':
				check = false;
				
				/*
				 * User has logged in the server
				 * Store its session ID
				 */
				this.state = this.state == 0 ? 1 : this.state;
				this.session.save(args.sessid);
				this.trigger("login", [args.sessid]);
				
			break;
			case 'IDENT':
				check = false;
				isIdent = true; //Flag to trigger the restored event
				
				/*
				 * Following the LOGIN raw this raw brings the user
				 * object and all its properties
				 * 
				 * Initiate and store the current user object
				 */
				var user = new APS.CUser(args.user, this);
				this.pipes[user.pubid] = user;
				
				this.user = user;
				
				/*
				 * Trigger the ready event only if the state of the
				 * client is 1 -> connected
				 */
				if(this.state == 1)
					this.trigger('ready');

			break;
			case 'CHANNEL':
				//The pipe is the channel object
				pipe = new APS.Channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				
				/*
				 * Below, the user objects of the channels subscribers
				 * get initiated and stored in the channel object, as
				 * well as in the client general pipes array
				 */
				if(!!u){
					//import users from channel to client if any
					for(var i = 0; i < u.length; i++){
						user = pipe.addUser(u[i]);
					}
				}
				
				//Add events to channel from queue
				var name = pipe.name.toLowerCase();
				if(typeof this.eQueue[name] == "object"){
					var queue = this.eQueue[name];
					var ev, fn;
					for(var i in queue){
						if(!queue.hasOwnProperty(i)) continue;
						ev = queue[i][0];
						fn = queue[i][1];
						
						pipe.on(ev,fn);
					}
				}
				
				pipe.trigger('joined',[this.user, pipe]);
				this.trigger('newChannel', [pipe]);
				
			break;
			case "SYNC":
				/*
				 * Synchronizes events across multiple client instances
				 */
				user = this.user;
				
				pipe = this.pipes[args.chanid];
				
				//Decode the message data string
				if(args.event == "message")
					args.data = decodeURIComponent(args.data);
				
				if(pipe instanceof APS.User){
					user.trigger(args.event, [args.data, user, pipe]);
				}else{
					pipe.trigger(args.event, [args.data, user, pipe]);
				}
				
			break;
			case "EVENT-X":
				/*
				 * Handle events without a sender, recipient and sender
				 * will be same in this case of events
				 */
				pipe = this.pipes[args.pipe.pubid];
				
				//Trigger event on target
				pipe.trigger(args.event, [args.data, pipe, pipe]);
				
			break;
			case "EVENT":
				/*
				 * Parses and triggers an incoming Event
				 */
				user = this.pipes[args.from.pubid];

				if(typeof user == "undefined" && !!args.from){
					//Create user it doesn't exists
					this.pipes[args.from.pubid] = new APS.User(args.from, this);
					user = this.pipes[args.from.pubid];
				}
				
				pipe = this.pipes[args.pipe.pubid];
				
				if(pipe.pubid == user.pubid){
					pipe = this.user;
				}
				
				//Decode the message data string
				if(args.event == "message")
					args.data = decodeURIComponent(args.data);
				
				//Trigger event on target
				pipe.trigger(args.event, [args.data, user, pipe]);
				
			break;
			case "NOJOIN":
				this.trigger("notjoined", [args])
			break;
			case 'JOIN':
				/*
				 * A new user has join a channel
				 * Parse the raw and trigger the corresponding
				 * events
				 */
				//pipe is the channel object
				pipe = this.pipes[args.pipe.pubid];
				//Add user to channel list
				user = pipe.addUser(args.user);
				
				pipe.trigger('join', [user, pipe]);
				
			break;
			case 'LEFT':
				/*
				 * A user as left a channel
				 * Parse event to trigger the corresponding events
				 * and delete the user references from channel but
				 * keep user object in the client in case is being 
				 * use by another channel
				 */
				pipe = this.pipes[args.pipe.pubid];
				user = this.pipes[args.user.pubid];
				
				delete pipe.users[args.user.pubid];
				
				pipe.trigger('left', [user, pipe]);
				
			break;
			case "UPDATE":

				if(this.option.autoUpdate){
					pipe = this.pipes[args.pipe.pubid];
					pipe._update(args.pipe.properties);
				}

			break;
			case "SESSION_UPDATE":

				this.session._update(args);

			break;
			case 'CLOSE':
				/*
				 * Required by the longPolling protocol to avoid
				 * a racing effect with AJax requests
				 */
				check = false
			break;
			case 'ERR' :
				/*
				 * Parses default server errors,
				 * Handle them and trigger the API
				 * friendly events
				 */
				check = false;
				info = [args.code, args.value, args];
				
				switch(args.code){
					case "001":
					case "002":
					case "003":
						clearTimeout(this.poller);
						this.trigger("dead", info);
						break;
					case "004":
					case "250":
						this.state = 0;
						this.session.destroy(true);
						
						if(this.option.session){
							this.reconnect();
						}
						break;
					default:
						this.check();
				}
				this.trigger("error", info);
				this.trigger("error"+args.code, info);
				
			break;
			default:
				//trigger custom raws
				info = [];
				for(var i in args){
					if(!args.hasOwnProperty(i)) continue;
					info.push(args[i]);
				}
				this.trigger("raw"+raw, info);
		}
	}
	
	/*
	 * Handle The Session restored
	 * callback event triggers
	 */
	if(isIdent && this.state != 1){
		check = true;
		
		//Session restored completed
		this.state = 1;
		if(this.trigger('restored') !== false)
			this.trigger('ready');
	}
	
	/*
	 * Conditionally called the check() method for the long polling method
	 */
	if(this.transport.id == 0 && check && this.transport.state == 1){
		this.check();
	}
}


APS.Transport = function(server, callback, client){
	this.state = 0;//0 = Not initialized, 1 = Initialized and ready to exchange data, 2 = Request is running
	this.stack = [];
	this.callback = callback;
	this.chl = 0;
	
	var trans = client.option.transport;
	var args = Array.prototype.slice.call(arguments);
	
	/*
	 * Choosing the right transport according to the option
	 */
	if(typeof trans == "object"){
		/*
		 * Loop through the array of given objects 
		 * and use the first compatible one
		 * if a transport is not compatible it should return false
		 */
		for(var t in trans){
			var ret = APS.Transport[trans[t]].apply(this, args);
			if(ret != false) break;
		}
	}else if(typeof trans == "string"){
		/*
		 * Use the specify transport explicitly
		 */
		APS.Transport[trans].apply(this, args);
	}
	
	/*
	 * Ajax request function for the eventPush feature
	 */
	function getRequest() {
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
	
	var ajaxObject = new getRequest();
	
	/*
	 * Request object to make a simple ajax request
	 * Used internally for eventPush HTTP requests
	 */
	this.request = function(addr, data, callback){
		var request = new ajaxObject();
		
		request.addEventListener("load", function(){
			callback(this.responseText);
		}, false);
		
		request.open('POST', addr, true);
		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
		request.send(data);
	}
	
	/*
	 * If eventPush is enabled replace the transport send() method
	 * The new send method will send all Event commands to the specified
	 * URL and others request/commands to the original transport send() method
	 */
	if(!!client.option.eventPush){
		var realSend = this.send.bind(this);
		
		var requestCallback = function(res){
			callback.onmessage(res);
		}
		this.send = function(str, cb, data){
			if(data.cmd == "Event"){
				this.request(client.option.eventPush, "cmd="+str, requestCallback);
				return "pushed";
			}else{
				realSend.apply(this, [str, cb]);
			}
		}
	}
}

/*
 * Websocket Transport
 */
APS.Transport.ws = APS.Transport.wb = function(server, callback, client){
	if('WebSocket' in window){
		this.id = 6;
		this.loop = setInterval(client.check.bind(client,true), 30000);
		
		var protocol = !!client.option.secure ? "wss" : "ws";
		
		try{
			var ws = new WebSocket(protocol + '://' + server + '/6/');
		}catch(e){
			callback.onerror(e);
			return false
		}
		
		/*
		 * Handle some browser which have the WebSocket constructor 
		 * defined but has to actual WebSocket support
		 */
		if(ws.url === undefined) return false;
		
		this.send = function(str, cb){
			if(this.state > 0) ws.send(str);
			else this.stack.push(str);
			
			if(typeof cb == "function") cb();
		}.bind(this);
		
		ws.onerror = function(e){
			this.state = 0;
			clearInterval(this.loop);
			callback.onerror(e);
		}.bind(this)
		
		ws.onopen = function(){
			this.state = 2;
			
			for(var i = 0; i < this.stack.length; i++) this.send(this.stack[i], null, JSON.parse(this.stack[i])[0]);
			this.stack = [];
			
		}.bind(this);
		
		ws.onmessage = function(ev){
			callback.onmessage(ev.data);
		}
		
		ws.onclose = function(e){
			clearInterval(this.loop);
			this.state = client.state = 0;
			callback.onerror(e);
		}.bind(this)
		
		this.close = function(){
			ws.close();
			this.state = client.state = 0;
		}
	
	}else{
		client.log("No Websocket support");
		return false;
	}
}

/*
 * Long Polling Transport
 */
APS.Transport.lp = function(server, callback, client){
	this.id = 0;
	var frame = document.createElement('iframe');
	var protocol = !!client.option.secure ? "https" : "http";
	var origin = window.location.protocol+'//'+window.location.host;
	//Fixes cranky IE9
	server = server.toLowerCase();
	
	frame.style.display = "none";
	
	document.body.appendChild(frame);
	
	frame.setAttribute('src', protocol + "://" + server + '/?[{"cmd":"frame","params": {"origin":"'+origin+'"}}]');
	
	
	function recieveMessage(ev){
		if(ev.origin != protocol + "://" + server) return;
		if(ev.source !== frame.contentWindow) return;

		this.state = 1;
		this.callback.onmessage(ev.data);
	}
	function onLoad(){
		this.state = 1;
		
		for(var i = 0; i < this.stack.length; i++) this.send(this.stack[i], null, JSON.parse(this.stack[i])[0]);
		this.stack = [];
	}
		
	if('addEventListener' in window){
		window.addEventListener('message', recieveMessage.bind(this), 0);
		frame.addEventListener('load', onLoad.bind(this), 0);
	} else {
		window.attachEvent('onmessage', recieveMessage.bind(this));
	}
	
	this.send = function(str, cb){
		if(this.state > 0){
			frame.contentWindow.postMessage(str, protocol + "://" + server);
			this.state = 2;
		} else this.stack.push(str);
		
		if(typeof cb == "function") cb();
	}
	
	this.close = function(){
		clearTimeout(client.poller);
		/*
		 * The line below is suppose to delete the iframe use by the transport if it the trasnport
		 * is closed. In the client.connect() method is configured so the initial frame can be
		 * reused in case of reconnect
		 */
		//frame.parentElement.removeChild(frame);
		this.state = client.state = 0;
	}
}

/**
 * The user object constructor
 * @param {object} pipe - The pip object as sent by the server
 * @param {APS} client - Instance of the client for internal reference
 * @constructor
 * @memberOf module:Client~
 */
APS.User = function(pipe, client){
	Object.defineProperties(this, {
	
		/**
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are different. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes 
		 *
		 * @memberOf module:Client~APS.User#
		 * @method _update
		 * @private
		 *
		 * @param {object} updates - Value key paired of values to update the object
		 */
		_update: {
			value: function(updates){
				if( !! updates)
				{
					updates._rev = parseInt(updates._rev);
					if(updates._rev > this._rev){
						for(var i in updates){
							if(this[i] != updates[i]){
								this[i] = updates[i];
								client.trigger("user"+i+"Update",[updates[i], this]);
								client.trigger("userUpdate",[i, updates[i], this]);
							}
						}
					}
				}
			}
		},
		
		/*
		 * Add the more critical properties which other
		 * methods and the framework itself depend on
		 */
		_rev: {
			value: null,
			configurable: true,
			writable: true
		},
		channels: {
			value: {},
			writable: true
		},
		/**
		 * The user publisher id
		 * Note this property is not enumerable.
		 *
		 * @memberOf module:Client~APS.User#
		 * @property pubid
		 */
		pubid: {
			value: pipe.pubid
		},
		
		/*
		 * Bind event and logging related functions straight from the client,
		 * effectively saving a whole lot of code :)
		 */
		/**
		 * Publishes/sends anything to the user, a string, object, array or integer
		 *
		 * @param {*} data - Data to send to the channel
		 * @param {bool} sync - Whether to to synchronize the event across the user session
		 * @param {function} callback - Function called after the event is sent
		 *
		 * @memberOf module:Client~APS.User#
		 * @method pub
		 */
		pub: {
			value: client.pub.bind(client, pipe.pubid)
		},
		/**
		 * Alias for {@link APS.User#pub}
		 *
		 * @memberOf module:Client~APS.User#
		 * @method publish
		 * @see APS.User#pub
		 */
		publish: {
			value: client.pub.bind(client, pipe.pubid)
		},
		/**
		 * Sends a custom event to the user
		 *
		 * @memberOf module:Client~APS.User#
		 * @method send
		 *
		 * @param {string} $event -  The name of the event to send
		 * @param {*} data - The data to send with the event
		 * @param {bool} sync - Weather to sync event across the user's session or not
		 * @param {function} callback - Function to call after the event has been sent
		 *
		 * @return {APS} client or parent object reference
		 */
		send: {
			value: client.send.bind(client, pipe.pubid)
		}
	});
	
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
}

/**
 * The special current user object constructor
 * @param {object} pipe - The pip object as sent by the server
 * @param {APS} client - Instance of the client for internal reference
 * @constructor
 * @memberOf module:Client~
 */
APS.CUser = function(pipe, client){
	Object.defineProperties(this, {

		/**
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are different. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @method _update
		 * @private
		 *
		 * @param {object} updates - Value key paired of values to update the object
		 */
		_update: {
			value: function(updates, force){
				if( !! updates)
				{
					if ( !force )
						updates._rev = parseInt(updates._rev);

					if(updates._rev > this._rev || !!force){
						for(var i in updates){
							if(this[i] != updates[i]){
								this[i] = updates[i];
								this.trigger("user"+i+"Update",[updates[i], this]);
								this.trigger("userUpdate",[i, updates[i], this]);
							}
						}
					}
				}
			}
		},

		/**
		 * Change or update a property in the object and send it to the
		 * server for propagation. In order for this method to work
		 * properly the option {@link APS.option.autoUpdate} should be enabled
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @method update
		 *
		 * @param {string} name -  The name of the property to update
		 * @param {*} value - The data to set the property to
		 */
		update: {
			value: function(name, value){
				if(typeof name == "object"){
					var data = name;
				}else{
					var data = {};
					data[name] = value;
				}

				this._update(data,true);
				this._client.sendCmd("userPropUpdate", data);
			}
		},
	
	
		/*
		 * Add the more critical properties which other
		 * methods and the framework itself depend on
		 */
		_rev: {
			value: null,
			configurable: true,
			writable: true
		},
		_events: {
			value: {},
			writable: true
		},
		_client: {
			value: client
		},
		/**
		 * The user publisher id.
		 * Note this property is not enumerable.
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @property pubid
		 */
		pubid: {
			value: pipe.pubid
		},
		/**
		 * The channels the user is a member of, every item
		 * is an instance of {@link APS.Channel}.
		 * Note this property is not enumerable.
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @property channels
		 */
		channels: {
			value: {},
			writable: true
		},
		
		/*
		 * Bind event and logging related functions straight from the client,
		 * effectively saving a whole lot of code :)
		 */
		/**
		 * Add event handler(s) to the channel
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @method on
		 *
		 * @param {string} ev - Name of the event handler to add, not case sensitive
		 * @param {function} fn - Function to handle the event
		 *
		 * @return {bool|APS.CUser} False if wrong parameters are passed, otherwise the channel object
		 */
		on: {
			value: client.on.bind(this)
		},
		/**
		 * Trigger event handlers on the user
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @method trigger
		 * @see APS#trigger
		 */
		trigger: {
			value: client.trigger.bind(this)
		},
		/**
		 * Logs data to the console
		 * It is specified in the out from the call originated from the current user object
		 * @memberOf module:Client~APS.CUser#
		 * @method log
		 * @see APS#log
		 */
		log: {
			value: client.log.bind(client, "[CurrentUser]")
		}
	});
	
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
}


/**
 * Channel object
 *
 * Creates a channel object, the constructor is meant to be used internally only
 *
 * @param {object} pipe The server pipe object
 * @param {APS} client The client instance for internal reference
 * @constructor
 * @memberOf module:Client~
 */
APS.Channel = function(pipe, client) {
	Object.defineProperties(this, {
		/**
		 * Internal channel updater method
		 *
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are different. This method triggers
		 * properties specific events which can be observe/watch
		 * property changes
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method _update
		 * @private
		 *
		 * @param {object} updates Value key paired of values to update the object
		 */
		_update: {
			value: function(updates){
				if ( !! updates )
				{
					updates._rev = parseInt(updates._rev);
					if(updates._rev > this._rev){
						for(var i in updates){
							if(this[i] != updates[i]){
								this[i] = updates[i];
								this.trigger("channel"+i+"Update",[updates[i], this]);
								this.trigger("channelUpdate",[i, updates[i], this]);
							}
						}
					}
				}
			}
		},
		/**
		 * Makes the current user leave the channel
		 *
		 * The function makes a user exit/unsubsribe from a channel
		 * no parameters are required for this method
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method leave
		 */
		leave: {
			value: function(){
				this.trigger("unsub", [client.user, this]);
				
				client.sendCmd('LEFT', {"channel": pipe.properties.name});
				
				this.log("Unsubscribed");
				
				delete client.channels[this.name];
			
				//Delete the Event Queue in case the channel is created again
				delete client.eQueue[this.name];
			}
		},
		
		/*
		 * Add the more critical properties which other
		 * methods and the framework itself depend on
		 */
		/**
		 * Holds the channel object revision number
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property _rev
		 * @type {number}
		 * @private
		 * @ignore
		 */
		_rev: {
			value: null,
			configurable: true,
			writable: true
		},
		/**
		 * Stack of all the channel events
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property _events
		 * @private
		 * @ignore
		 */
		_events: {
			value: {},
			writable: true
		},
		/**
		 * Stack of all the channel events
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property _events
		 * @type {APS}
		 * @private
		 * @ignore
		 */
		_client: {
			value: client
		},
		/**
		 * The unique channel publisher id hash
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property pubid
		 * @type {string}
		 * @private
		 */
		pubid: {
			value: pipe.pubid
		},

		/**
		 * Add event handler(s) to the channel
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method on
		 *
		 * @param {string} ev Name of the event handler to add, not case sensitive
		 * @param {function} fn Function to handle the event
		 *
		 * @return {bool|APS.Channel} False if wrong parameters are passed, otherwise the channel object
		 */
		on: {
			value: client.on.bind(this)
		},
		/**
		 * Trigger event handlers on the channel
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method trigger
		 * @see APS#trigger
		 */
		trigger: {
			value: client.trigger.bind(this)
		},
		/**
		 * Logs data to the console
		 * It is specified in the out from which channel the call originated from
		 * @memberOf module:Client~APS.Channel#
		 * @method log
		 * @see APS#log
		 */
		log: {
			value: client.log.bind(client, "[channel]", "["+pipe.properties.name+"]")
		}
	});
	
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	/*
	 * The following block filters some methods that only apply
	 * to interactive channels. All channels are consider interactive
	 * but the ones which name's starts with the asterisk(*) character
	 */
	if( this.name.indexOf("*") !== 0 )
	{
		Object.defineProperties(this, {
		//Methods and prop for interactive channels
		/**
		 * The collection of all users that are in the channel
		 *
		 * Every item in the collection is an instance of {@link APS.User}
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property users
		 * @type {object}
		 */
		users: {
			value: {},
			writable: true
		},
		/**
		 * Adds a use the channel {@link APS.Channel#users} stack
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method addUser
		 * @private
		 */
		addUser: {
			value: function(u){
				var user = client.getPipe(u.pubid);
				if(!user){
					/*
					 * User object does not exists in the client
					 * Initiate user object and store it
					 */
					client.pipes[u.pubid] = new APS.User(u, client);
					user = client.pipes[u.pubid];
					
					//Add user's own pipe to channels list
					user.channels[user.pubid] = user;
				}else{
					/*
					 * User object exists
					 * Update object if autoUpdate is enabled
					 */
					if(client.option.autoUpdate)
						user._update(u.properties);
				}
				
				//Add channel reference to the user
				user.channels[this.name] = this;
				
				this.users[u.pubid] = user;
				return user;
			}
		},
		/**
		 * Sends an event with data to the channel
		 *
		 * @param {string} $event The name of the event to send
		 * @param {*} data The data to send with the event
		 * @param {bool} [sync=false] Weather to sync event across the user's session or not
		 * @param {function} [callback] Function to call after the event has been sent
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method send
		 *
		 * @return {APS.Channel}
		 */
		send: {
			value: client.send.bind(client, this.pubid)
		},
		/**
		 * Sends data to the channel
		 *
		 * The method determines which event to send to the channel,
		 * if the **data** is a string on integer a _message_ will be sent
		 * but if is an array of object than a _data_ event will be sent
		 *
		 * @param {*} data The data to send with the event
		 * @param {bool} [sync=false] Weather to sync event across the user's session or not
		 * @param {function} [callback] Function to call after the event has been sent
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method pub
		 *
		 * @return {APS.Channel}
		 */
		pub: {
			value: client.pub.bind(client, this.name)
		},
		/**
		 * Alias for {@link APS.Channel#pub}
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method publish
		 *
		 * @see APS.Channel#pub
		 */
		publish: {
		    value: client.pub.bind(client, this.name)
		}
		})
	}
	
}


/**
 * The session object constructor
 *
 * @param {APS} client
 * @constructor
 * @memberOf module:Client~
 */
APS.Session = function(client){
	this._client = client;
	this._data = {};
	this.store = {};

	/**
	 * Gets the current session ID
	 * @returns {bool|string}
	 */
	this.getID = function(){
		if ( this._client.option.session )
		{
			return this.store.get('sid');
		}
		else
		{
			return this._id;
		}
	}
	/**
	 * Get the current frequency number
	 * @returns {*}
	 */
	this.getFreq = function(){
		return this.store.get('freq');
	}
	/**
	 * Get the current challenge number
	 * @returns {*}
	 */
	this.getChl = function(){
		return this.store.get('chl');
	}

	/**
	 * Saves all the values required for persistent session
	 * @private
	 */
	this.save = function(id){
		if ( this._client.option.session )
		{
			this.store.set('sid', id);
		}
		else
		{
			this._id = id;
		}
	}

	/**
	 * Increments the frequency number by one and saves it
	 * @private
	 */
	this.saveFreq = function(){

		var current = parseInt(this.store.get('freq') || 0);
		this.store.set('freq',++current);
	}

	/**
	 * Destroys the session and all its data
	 * @param {bool} KeepFreq - Flag whether to keep the frequency
	 * @private
	 */
	this.destroy = function(KeepFreq){

		this.store.remove('sid');
		this.store.remove('chl');

		if(!KeepFreq)
			this.store.set('freq',0);

		this._data = {};
	}

	/**
	 * Get a value from the session
	 * @param {string} key - The key of the value to get
	 * @returns {*}
	 */
	this.get = function(key){
		return this._data[key];
	}

	/**
	 * Assign value to a session key
	 * @param {string} key - The value key, identifier
	 * @param {*} val - The value to store in session
	 */
	this.set = function(key, val){
		var obj = {};
		if ( typeof key == 'object' )
		{
			obj = key;
		}
		else
		{
			obj[key] = val;
		}
		this._client.sendCmd('SESSION_SET', obj);

		this._update(obj);
	}

	/**
	 * Used to updates the internal session storage cache _data
	 * @param updates
	 * @private
	 */
	this._update = function(updates){
		for ( var key in updates)
		{
			this._data[key] = updates[key];
		}
	}

	/**
	 * Restores all the the necessary values from the store to restore a session
	 * @private
	 * @returns {*}
	 */
	this.restore = function(){
		var client = this._client;

		// Initialize the store object
		this.store = new APS.Store(client.identifier + '_');
		
		//Initial frequency value
		if( ! this.store.get('freq') ) this.store.set('freq','0');

		var sid = this.store.get('sid');
		
		if(typeof sid != "string" || sid.length !== 32){
			return false;
		}
		
		//Restoring session state == 2
		client.state = 2;

		// return data
		return {sid: sid};
	}
}

/**
 * A persistent storage object
 * @param _prefix the store identifier
 * @constructor
 * @private
 * @memberOf module:Client~
 */
APS.Store = function(_prefix){
	if (typeof _prefix == 'undefined' )
	{
		_prefix = '';
	}

	if ( 'Storage' in window )
	{
		// Use the HTML5 storage

		/**
		 * Get a value from the store
		 * @param key The value key
		 * @returns {*}
		 */
		this.get = function(key){
			key = _prefix + key;
			return localStorage.getItem(key);
		}

		/**
		 * Set value to a store key
		 * @param key The value key
		 * @param value The key value
		 */
		this.set = function(key, value){
			key = _prefix + key;
			localStorage.setItem(key, value);
		}

		/**
		 * Removes a key and its value from the store
		 * @param key
		 */
		this.remove = function(key){
			key = _prefix + key;
			localStorage.removeItem(key);
		}
	}
	else
	{
		// Use cookies as a storage

		this.get = function(key){
			key = _prefix + key;
			var nameEQ = key + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		}
		this.set = function(key, value){
			key = _prefix + key;

			document.cookie = key+"="+value+"; path=/";

		}
		this.remove = function(key){
			key = _prefix + key;

			var date = new Date();
			date.setTime(date.getTime()-1);
			var expires = "; expires="+date.toGMTString();

			document.cookie = key+"= "+expires+"; path=/";
		}
	}
}

