/**
 * @author Pablo Tejada
 * @repo https://github.com/ptejada/ApePubSub
 * Built on 2013-04-27 @ 06:36
 */

/*
 * Generates a random string
 *  - First paramater(integer) determines the length
 *  - Second parameter(string) an optional string of alternative keys to use
 */
function randomString(l, keys){
	var chars = keys || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = l || 32;
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
 * The client constructor
 * 
 * @param (string) server The APE Server Url including port number
 * @param (object) events Event handlers to be added to the client   
 * @param (object) options Options to configure the client
 * 
 * @return An APS or client instance   
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
	this.version = '1.5.8';
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
 * @param (object) args Arguments to send with the initial connect request
 * 
 * @return The client reference or false if the connection request has been canceled
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
			this.transport = new APS.transport(fserver, cb, this);
		}else{
			//Use current active transport
			
		}
	}else{
		this.transport = new APS.transport(fserver, cb, this);
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
 * @param (string) ev Name of the event to trigger, not case sensitive
 * @param (array) args An array of arguments to passed to the event handler function
 * 
 * @return (bool) False if any of the event handlers explicitly returns false, otherwise true
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
 * @param (string) ev Name of the event handler to add, not case sensitive
 * @param (function) fn Function to handle the event
 * 
 * @return (bool|object) False if wrong parameters are passed, otherwise the client or parent object reference
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
 * Sends an event throught a pipe/user/channel
 * This function is not usefull in this context
 * Its real use is when bound to a user or channel
 * objects.
 * 
 * Although it could be usefull if a developer has
 * its own way of getting a user's or channels's pubid
 * who object does not resides in the local client
 * 
 * @param (object|string) pipe The pubid string or pipe object of user or channel
 * @param (string) $event The name of the event to send
 * @param (object|string|array) data The data to send with the event
 * @param (bool) sync Weather to sync event accoss the user's session or not
 * @param (function) callback Function to after the event has been sent 
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
 * @param (string) cmd Name of command in the server which will handle the request
 * @param (object|string|array) args The data to send with the command
 * @param (object|string) pipe The pubid string or pipe object of user or channel
 * @param (function) callback Function to after the event has been sent 
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
 * @param (string) channel Name of the channel to subscribe to
 * @param (object) Events List of events to add to the channel
 * @param (function) callback Function to be called when a user successfuly subscribes to the channel
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
 * @param (string) channel Name of the channel
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
 * @param (string) channel Name of the channel to unsubscribe
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

/*
 * The function parses all incoming information from the server.
 * Is the magical function, it takes the raw information 
 * and convert into usefull dynamic data and objects. It is
 * also resposible for triggering most of the events in the 
 * framework
 */
APS.prototype.onMessage = function(data){
	try { 
		data = JSON.parse(data)
	}catch(e){
		//Temporary FIX for malformed JSON with scaped single quotes 
		data = data.replace(/\\'/g, "'");
		try {
			data = JSON.parse(data);
		}catch(e){
			e.type = "close";
			this.trigger("dead", [e]);
			return this.transport.close();
		}
	}
	
	//Initiante variables to be used in the loop below
	var raw, args, pipe, isIdent = false, check = true;
	
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
				this.session.id = args.sessid;
				this.trigger("login", [args.sessid]);
				
			break;
			case 'IDENT':
				check = false;
				isIdent = true; //Flag to trigger the restored event
				
				/*
				 * Following the LOGIN raw this raw brings the user
				 * object and all its properties
				 * 
				 * Inittiate and store the current user object
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
				
				this.session.save();
				
			break;
			case 'CHANNEL':
				//The pipr is the channel object
				pipe = new APS.channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				
				/*
				 * Below, the user objects of the channels subscribers
				 * get intiated and stored in the channel object, as
				 * well as in the client general pipes array
				 */
				if(!!u){
					var user;
					//import users from channel to client if any
					for(var i = 0; i < u.length; i++){
						user = pipe.addUser(u[i]);
					}
				}
				
				//Add events to channel from queue
				var chanName = pipe.name.toLowerCase();
				if(typeof this.eQueue[chanName] == "object"){
					var queue = this.eQueue[chanName];
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
				 * Synchronizes events accross multiple client instances
				 */
				var user = this.user;
				
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
				
				//Update the pipe
				if(this.option.autoUpdate)
					pipe.update(args.pipe.properties);
				
			break;
			case "EVENT":
				/*
				 * Parses and triggers an incoming Event
				 */
				var user = this.pipes[args.from.pubid];
				
				if(typeof user == "undefined" && !!args.from){
					//Create user it doesn't exists
					client.pipe[args.from.pubid] = new APS.User(args.from, client);
					user = client.pipe[args.from.pubid];
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
				
				//Update the pipe and user objects
				if(this.option.autoUpdate){
					user.update(args.from.properties);
					if(pipe.pubid != user.pubid)
						pipe.update(args.pipe.properties);
				}
				
			break;
			case "NOJOIN":
				this.trigger("notjoined", [args])
			break;
			case 'JOIN':
				/*
				 * A new user has join a channel
				 * Parse the raw and trigger the correspoding
				 * events
				 */
				//pipe is the channel object
				pipe = this.pipes[args.pipe.pubid];
				//Add user to channel list
				var user = pipe.addUser(args.user);
				
				pipe.trigger('join', [user, pipe]);
				
				//Update pipe channel object
				if(this.option.autoUpdate)
					pipe.update(args.pipe.properties);
				
			break;
			case 'LEFT':
				/*
				 * A user as left a channel
				 * Parse event to trigger the corresponding events
				 * and delete the user refereces from channel but
				 * keep user object in the client in case is being 
				 * use by another channel
				 */
				pipe = this.pipes[args.pipe.pubid];
				var user = this.pipes[args.user.pubid];
				
				delete pipe.users[args.user.pubid];
				
				//Update pipe channel object
				if(this.option.autoUpdate)
					pipe.update(args.pipe.properties);
				
				pipe.trigger('left', [user, pipe]);
				
			break;
			case "SELFUPDATE":
				/*
				 * Update the current user object properties as 
				 * per its state in the server. Only will work
				 * if autoUpdate is enabled
				 */
				if(this.option.autoUpdate)
					this.user.update(args.user);
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
				 * frindly events
				 */
				check = false;
				var info = [args.code, args.value, args];
				
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
				var info = new Array();
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


APS.transport = function(server, callback, client){
	this.state = 0;//0 = Not initialized, 1 = Initialized and ready to exchange data, 2 = Request is running
	this.stack = [];
	this.callback = callback;
	
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
			var ret = APS.transport[trans[t]].apply(this, args);
			if(ret != false) break;
		}
	}else if(typeof trans == "string"){
		/*
		 * Use the specify transport explicitly
		 */
		APS.transport[trans].apply(this, args);
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
APS.transport.ws = APS.transport.wb = function(server, callback, client){
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
APS.transport.lp = function(server, callback, client){
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
		client.state = 0;
	}
}

/*
 * User object constructor
 */
APS.User = function(pipe, client){
	Object.defineProperties(this, {
	
		/*
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are differnt. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes 
		 */
		update: {
			value: function(o){
				if(!!!o) return false;
				o._rev = parseInt(o._rev);
				if(o._rev > this._rev){
					for(var i in o){
						if(this[i] != o[i]){
							this[i] = o[i];
							client.trigger("user"+i+"Update",[o[i], this]);
							client.trigger("userUpdate",[i, o[i], this]);
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
		pubid: {
			value: pipe.pubid
		},
		
		/*
		 * Bind event and logging related functions stragiht from the client,
		 * effectively saving a whole lot of code :)
		 */
		pub: {
			value: client.pub.bind(client, pipe.pubid)
		},
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

/*
 * Current user object constructor
 */
APS.CUser = function(pipe, client){
	Object.defineProperties(this, {
	
		/*
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are differnt. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes 
		 */
		update: {
			value: function(o){
				if(!!!o) return false;
				o._rev = parseInt(o._rev);
				if(o._rev > this._rev){
					for(var i in o){
						if(this[i] != o[i]){
							this[i] = o[i];
							this.trigger("user"+i+"Update",[o[i], this]);
							this.trigger("userUpdate",[i, o[i], this]);
						}
					}
				}
			}
		},
		
		/*
		 * Change or upadte a property in the object and send it to the
		 * server for propagation. In order for this method to work 
		 * properly the option autoUpdate should enable
		 */
		change: {
			value: function(name, value){
				if(typeof name == "object"){
					var data = name;
				}else{
					var data = {};
					data[name] = value;
				}
				//NOTE: data has no revision number thus update will fail
				//this.update(data);
				this._client.sendCmd("propUpdate", data);
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
		pubid: {
			value: pipe.pubid
		},
		channels: {
			value: {},
			writable: true
		},
		
		/*
		 * Bind event and logging related functions stragiht from the client,
		 * effectively saving a whole lot of code :)
		 */
		on: {
			value: client.on.bind(this)
		},
		trigger: {
			value: client.trigger.bind(this)
		},
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


/*
 * Channel object construtor
 */
APS.channel = function(pipe, client) {
	Object.defineProperties(this, {
	
		/*
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are differnt. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes 
		 */
		update: {
			value: function(o){
				if(!!!o) return false;
				o._rev = parseInt(o._rev);
				if(o._rev > this._rev){
					for(var i in o){
						if(this[i] != o[i]){
							this[i] = o[i];
							this.trigger("user"+i+"Update",[o[i], this]);
							this.trigger("userUpdate",[i, o[i], this]);
						}
					}
				}
			}
		},
		
		/*
		 * The function makes a user exit/unsubsribe from a channel
		 * no paramaters are required for this method
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
		pubid: {
			value: pipe.pubid
		},
		users: {
			value: {},
			writable: true
		},
		
		/*
		 * Bind event and logging related functions stragiht from the client,
		 * effectively saving a whole lot of code :)
		 */
		on: {
			value: client.on.bind(this)
		},
		trigger: {
			value: client.trigger.bind(this)
		},
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
	if(this.name.indexOf("*") !== 0){
		Object.defineProperties(this, {
		//Methods and prop for interactive channels
		users: {
			value: {},
			writable: true
		},
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
						user.update(u.properties);
				}
				
				//Add channel reference to the user
				user.channels[this.name] = this;
				
				this.users[u.pubid] = user;
				return user;
			}
		},
		send: {
			value: client.send.bind(client, this.pubid)
		},
		pub: {
			value: client.pub.bind(client, this.name)
		}
	})}
	
}


/*
 * Prototype in the session object
 * The object current multiple cookies
 * handlers to save session related data
 * as well as other persisten information
 * require by the framework.
 * 
 * The session object currently uses cookies
 * to store the requiered information but in
 * the future i would like to implment the 
 * SessionStorage API with a fallback to 
 * cookies.
 */
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
		
		this.cookie.change(this.id + ":" + pubid);
		this.saveChl();
	},
	 
	saveChl: function(){
		if(!this._client.option.session) return;
		
		this._client.chl++;
		this.chl.change(this._client.chl);
	},
	
	destroy: function(Keepfreq){
		if(!this._client.option.session) return;
		
		this.cookie.destroy();
		this.chl.destroy();
		if(!!!Keepfreq)
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
		
		//Load cookies
		this.chl = new APS.cookie(client.identifier + "_chl");
		this.cookie = new APS.cookie(client.identifier + "_session");
		this.freq = new APS.cookie(client.identifier + "_frequency");
		
		client.chl = this.chl.value || 0;
		
		//Initial frequency value
		if(!this.freq.value) this.freq.change("0");
		
		if(typeof this.cookie.value == "string" && this.cookie.value.length >= 32){
			var data = this.cookie.value.split(":");
			this.id = data[0];
		}else{
			return false;
		}
		
		//Restoring session state == 2
		client.state = 2;
		return {sid: data[0], pubid: data[1]};
	}
}

/*
 * the cookie object consructor
 */
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
		this.value = value || "";
		this.change(this.value, days);
	}
	return this;
}

