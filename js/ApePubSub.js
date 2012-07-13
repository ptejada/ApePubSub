/**
 * @author Pablo Tejada
 * Built on 2012-07-10 @ 02:27
 */

//Generate a random string
function randomString(l){
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = l;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

// Official bind polyfill at developer.mozilla.org
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
	this.events = {_queue: {}};
	this.chl = 0;
	this.user = {};
	this.pipes = {};
	this.channels = {};

	var cb = {
		'onmessage': this.onMessage.bind(this),
		'onerror': function(err){
			console.log("ERROR >> ",err);
		}
	}

	this.connect = function(args){
		//if(this.state != 0) return this;
		
		var client = this;
		//Create Session object
		this.session = new APS.session(this);
		//Copy arguments
		this.options.connectionArgs = args || this.options.connectionArgs;
		
		server = server || APS.server;
		if(this.state == 0)
			this.transport = new APS.transport(server, cb, options, this);
		
		//alert("connnecting...")
		
		//Handle sessions
		if(this.options.session == true){
			if(this.session.restore() == true) return this;
		}
		
		this.send('CONNECT', args);
		
		return this;
	}

	this.trigger = function(ev, args){
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
					this.log("{{{ " + ev + " }}} on channel " + this.name, this);
				}
			}
		}
	}
	
	this.on = function(ev, fn){
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
	
	this.poll = function(){
		this.poller = setTimeout((function(){ this.check() }).bind(this), this.options.poll);
	}
	
	this.getPipe = function(user){
		if(typeof user == 'string'){
			return this.pipes[user];
		} else {
			return this.pipes[user.getPubid()];
		}
	}
	
	this.send = function(cmd, args, pipe, callback){
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
			//this.on('ready', this.send.bind(this, cmd, args));
		}
		
		return this;
	}
	
	this.check = function(){
		this.send('CHECK');
	}
	
	this.sub = function(channel, Events, callback){
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
			var client = this;
			this.on("ready", function(){
				if(typeof client.channels[channel] != "object"){
					this.send('JOIN', {'channels': channel});
				}
			});
			this.connect({user: this.user});
			
		}else if(typeof this.channels[channel] != "object"){
			this.send('JOIN', {'channels': channel});
		}
		
		return this;
	}
	
	this.pub = function(channel, data){
		var pipe = this.getChannel(channel);
		
		if(pipe){
			var args = {data: data};
			pipe.send("Pub", args);
			pipe.trigger("pub",args);
		}else{
			this.log("NO Channel " + channel);
		}
	};
	
	this.getChannel = function(channel){
		if(channel in this.channels){
			return this.channels[channel];
		}
		
		return false;
	}
	
	this.onChannel = function(channel, Events, fn){
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
	
	this.unSub = function(channel){
		if(channel == "") return;
		this.getChannel(channel).leave();
	}
	
	//Debug Function for Browsers console
	if(navigator.appName != "Microsoft Internet Explorer"){
		this.log = function($obj){
			if(!this.debug) return;
			
			var args =  Array.prototype.slice.call(arguments);
			args.unshift("["+this.identifier+"]");
			
			window.console.log.apply(console, args);
		};
		
	}else{
		this.log = function(){}
	}
	
	//Add Events
	this.on(events);
	
	return this;
}

APS.prototype.onMessage = function(data){
	//var data = data;
	try { 
		data = JSON.parse(data)
	}catch(e){
		this.trigger("dead", [e]);
		return clearTimeout(this.poller);
	}
	
	
	for(var i in data){
		var cmd = data[i].raw;
		var args = data[i].data;
		var pipe = null;
		clearTimeout(this.poller);
		
		this.log('>>>> ', cmd , " <<<< ", args);
		
		switch(cmd){
			case 'LOGIN':
				this.state = this.state == 0 ? 1 : this.state;
				this.session.id = args.sessid;
				this.poll();
				this.session.save();
			break;
			case 'IDENT':
				this.user = new APS.user(args.user, this);
				this.user.sessid = this.session.id;
				this.pipes[this.user.pubid] = this.user;
				
				//alert(this.state);
				if(this.state == 1)
					this.trigger('ready');
				
				//this.poll(); //This call is under observation
			break;
			case 'RESTORED':
				//Session restored completed
				this.state = 1;
				this.trigger('ready');
			break;
			case 'CHANNEL':
				//this.log(pipe, args);
				pipe = new APS.channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				var user;
				
				//import users from channel to client
				for(var i = 0; i < u.length; i++){
					user = this.pipes[u[i].pubid]
					if(!user){
						user = new APS.user(u[i], this);
						this.pipes[user.pubid] = user;
					}
					
					user.channels[pipe.name] = pipe;
					pipe.users[user.pubid] = user;
					
					//Add user's own pipe to channels list
					user.channels[user.pubid] = user;

					//No Need to trigger this event
					//this.trigger('join', [user, pipe]);
				}
				
				//Add events from queue
				if(pipe.name in this.events._queue){
					var queue = this.events._queue[pipe.name];
					var ev, fn;
					for(var i in queue){
						ev = queue[i][0];
						fn = queue[i][1];
						
						pipe.on(ev,fn);
					}
				}
				
				pipe.trigger('joined',[this.user, pipe]);
				this.trigger('newChannel', [pipe]);
				
			break;
			case "PUBDATA":
				var user = this.pipes[args.from.pubid];
				pipe = this.pipes[args.pipe.pubid];
				
				pipe.trigger(args.type, [args.content, user, pipe]);
			break;
			case 'JOIN':
				var user = this.pipes[args.user.pubid];
				pipe = this.pipes[args.pipe.pubid];

				if(!user){
					user = new APS.user(args.user, this);
					this.pipes[user.pubid] = user;
				}
				
				//Add user's own pipe to channels list
				user.channels[pipe.pubid] = user;
				
				//Add user to channel list
				pipe.addUser(user);
				
				pipe.trigger('join', [user, pipe]);
			break;
			case 'LEFT':
				pipe = this.pipes[args.pipe.pubid];
				var user = this.pipes[args.user.pubid];
				
				delete user.channels[pipe.pubid];
				
				for(var i in user.channels){
					if(user.channels.hasOwnProperty(i)) delete this.pipes[user.pubid];
					break;
				}
				
				pipe.trigger('left', [user, pipe]);
			break;
			case 'NOSESSION':
				this.session.connect();
				
			break;
			case 'ERR' :
				switch(args.code){
					case "001":
					case "002":
					case "003":
						clearTimeout(this.poller);
						this.trigger("dead", args);
						break;
					case "004":
					case "250":
						this.state = 0;
						this.session.connect();
						break;
					default:
						this.check();
				}
				this.trigger("error",args);
				this.trigger("error"+args.code,args);
			break;
			default:
				//trigger custom commands
				this.trigger(cmd, args)
				this.check();
		}
		if(this.transport.id == 0 && cmd != 'ERR' && cmd != "LOGIN" && cmd != "IDENT" && this.transport.state == 1){
			this.check();
		}
		
	}
}


//var APSTransport = function(server, callback, options){
APS.transport = function(server, callback, options, client){
	this.state = 0;//0 = Not initialized, 1 = Initialized and ready to exchange data, 2 = Request is running
	this.stack = [];
	this.callback = callback;
	
	//client.state = 3;
	
	this.postMessage = function(str, callback){
		if(this.state > 0){
			this.frame.contentWindow.postMessage(str, '*');
			this.state = 2;
		} else this.stack.push(str);
		
		this.callback.once = callback || function(){};
	}
	this.frameMessage = function(ev){
		this.state = 1;
		this.callback.onmessage(ev.data);
		this.callback.once(ev.data);
		this.callback.once = function(){};
	}
	this.onLoad = function(){
		if(this.id == 6) this.state = 2;
		else this.state = 1;
	
		for(var i = 0; i < this.stack.length; i++) this.send(this.stack[i]);
		this.stack = [];
	}
	
	if('WebSocket' in window && APS.wb == true){
		this.id = 6;
		var ws = new WebSocket('ws://' + server + '/6/');
		this.send = function(str){
			if(this.state > 0) ws.send(str);
			else this.stack.push(str);
		}.bind(this);

		ws.onopen = this.onLoad.bind(this);

		ws.onmessage = function(ev){
			callback.onmessage(ev.data);
		}
	}else{
		this.id = 0;
		var frame = document.createElement('iframe');
		this.frame = frame;

		with(frame.style){ 
			position = 'absolute';
			left = top = '-10px';
			width = height = '1px';
		}

		frame.setAttribute('src', 'http://' + server + '/?[{"cmd":"frame","params": {"origin":"'+window.location.protocol+'//'+window.location.host+'"}}]');
		
		document.body.appendChild(frame);

		if('addEventListener' in window){
			window.addEventListener('message', this.frameMessage.bind(this), 0);
			frame.addEventListener('load', this.onLoad.bind(this), 0); 
		} else {
			window.attachEvent('onmessage', this.frameMessage.bind(this));
		}


		this.send = this.postMessage;
	}
}

//var APSUser = function(pipe, client) {
APS.user = function(pipe, client){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.pubid = pipe.pubid;
	this.client = client;
	this.channels = {};
}

APS.user.prototype.send = function(cmd, args) {
	this.client.send(cmd, args, this);
}


//var APSChannel = function(pipe, client) {
APS.channel = function(pipe, client) {
	this.events = {};
	this.properties = pipe.properties;
	this.name = pipe.properties.name;
	this.pubid = pipe.pubid;
	this.client = client;
	this.users = {};
	
	this.addUser = function(u){
		this.users[u.pubid] = u;
	}
	
	this.send = function(cmd, args){
		this.client.send(cmd, args, this);
	}
	
	this.leave = function(){
		this.trigger("unsub", [this.client.user, this]);
		
		this.client.send('LEFT', {"channel": this.name});
		
		APS.debug("Unsubscribed from ("+this.name+")");
		
		delete this.client.channels[this.name];
	}
	
	this.on = client.on.bind(this);
	this.pup = client.pub.bind(client, this.name);
	this.trigger = client.trigger.bind(this);
	this.log = client.log.bind(this, "[CHANNEL]", "["+this.name+"]");
}


APS.session = function(client){
	this.id = "";
	this.chl = {};
	this.client = client;
	this.cookie = {};
	this.data = {};
	
	this.save = function(){
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
	}
	
	this.saveChl = function(){
		if(!this.client.options.session) return;

		this.chl.change(this.client.chl);
	}
	
	this.destroy = function(){
		this.cookie.destroy();
		this.chl.destroy();
		this.client.chl = 0;
		this.id = null;
		this.properties = {};
	}
	
	this.get = function(index){
		return this.data[index];
	}
	
	this.set = function(index, val){
		this.data[index] = val;
	}
	
	this.restore = function(){
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
	}
	
	this.connect = function(){
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

