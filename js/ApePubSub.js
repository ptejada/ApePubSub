/**
 * @author Pablo Tejada
 * Built on 2012-05-05 @ 06:33
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

function APE( server, events, options ){
	this.options = {
		'poll': 25000,
		debug: true
	}
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
		server = server || APE.server;
		if(this.state == 0)
			this.transport = new APE.transport(server, cb, options);
		this.send('CONNECT', args);
		return this;
	}
	
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
	if(this.state == 1 || cmd == 'CONNECT'){

		var tmp = {
			'cmd': cmd,
			'chl': this.chl
		}

		if(args) tmp.params = args;
		if(pipe) tmp.params.pipe = typeof pipe == 'string' ? pipe : pipe.pubid; 
		if(this.user.sessid) tmp.sessid = this.user.sessid;

		APE.log('<<<< ', cmd.toUpperCase() , " >>>> ", tmp);

		this.transport.send(JSON.stringify([tmp]));
		if(cmd != 'CONNECT'){
			clearTimeout(this.poller);
			this.poll();
		}
		this.chl++;
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


APE.prototype.onMessage = function(data){
	//var data = data;
	try { 
		data = JSON.parse(data)
	}catch(e){
		this.check();
	}
	
	var cmd, args, pipe;
	for(var i in data){
		cmd = data[i].raw;
		args = data[i].data;
		pipe = null;
		clearTimeout(this.poller);
		
		APE.log('>>>> ', cmd , " <<<< ", args);

		switch(cmd){
			case 'LOGIN':
				this.state = 1;
				this.user.sessid = args.sessid;
				this.session_id = args.sessid;
				this.trigger('ready');
				this.poll();
			break;
			case 'CHANNEL':
				pipe = new APE.channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				var user;
				
				//import users from channel to client
				for(var i = 0; i < u.length; i++){
					user = this.pipes[u[i].pubid]
					if(!user){
						user = new APE.user(u[i], this);
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
				
				pipe.trigger('joined',this.user, pipe);
				this.trigger('newChannel', pipe);
				
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
					user = new APE.user(args.user, this);
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
			case 'IDENT':
				this.user = new APE.user(args.user, this);
				this.user.sessid = this.session_id;
				this.pipes[this.user.pubid] = this.user;
				
				this.poll(); //This call is under observation
			break;
			case 'ERR' :
				if(this.transport.id == 0 && cmd == 'ERR' &&(args.code > 100 || args.code == "001")){
					this.check();
				}else if(cmd == 'ERR' && args.code < 100){
					clearTimeout(this.poller);
					this.trigger("dead", args)
				}
				this.trigger("error",args);
				this.trigger("error"+args.code,args);
			break;
			default:
				//trigger custom commands
				this.trigger(cmd, [args, raw])
		}

		if(this.transport.id == 0 && cmd != 'ERR' && this.transport.state == 1){
			this.check();
		}
	}
}


//var APETransport = function(server, callback, options){
APE.transport = function(server, callback, options){
	this.state = 0;//0 = Not initialized, 1 = Initialized and ready to exchange data, 2 = Request is running
	this.stack = [];
	this.callback = callback;

	if('WebSocket' in window && APE.wb == true){
		this.id = 6;
		var ws = new WebSocket('ws://' + server + '/6/');
		APE.transport.prototype.send = function(str){
			if(this.state > 0) ws.send(str);
			else this.stack.push(str);
		}.bind(this);

		ws.onopen = APE.transport.prototype.onLoad.bind(this);

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


		APE.transport.prototype.send = APE.transport.prototype.postMessage;
	}
}
APE.transport.prototype.postMessage = function(str){
	if(this.state > 0){
		this.frame.contentWindow.postMessage(str, '*');
		this.state = 2;
	} else this.stack.push(str);
}
APE.transport.prototype.frameMessage = function(ev){
	this.state = 1;
	this.callback.onmessage(ev.data);
}
APE.transport.prototype.onLoad = function(){
	if(this.id == 6) this.state = 2;
	else this.state = 1;

	for(var i = 0; i < this.stack.length; i++) this.send(this.stack[i]);
	this.stack = [];
}

//var APEUser = function(pipe, ape) {
APE.user = function(pipe, ape){
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	this.pubid = pipe.pubid;
	this.ape = ape;
	this.channels = {};
}

APE.user.prototype.send = function(cmd, args) {
	this.ape.send(cmd, args, this);
}


//var APEChannel = function(pipe, ape) {
APE.channel = function(pipe, ape) {
	this.events = {};
	this.properties = pipe.properties;
	this.name = pipe.properties.name;
	this.pubid = pipe.pubid;
	this.ape = ape;
	this.users = {};
	
	this.addUser = function(u){
		this.users[u.pubid] = u;
	}
	
	this.send = function(cmd, args){
		this.ape.send(cmd, args, this);
	}
	
	this.leave = function(){
		this.trigger("unsub", [this.ape.user, this]);
		
		this.ape.send('LEFT', {"channel": this.name});
		
		APE.debug("Unsubscribed from ("+this.name+")");
		
		delete this.ape.channels[this.name];
	}
	
	this.on = APE.prototype.on.bind(this);
	this.trigger = APE.prototype.trigger.bind(this);
}


APE.debug = true;

APE.client = new APE();

var Sub = function(channel, Events, callback){
	this.join(channel);
	
	//Handle the events
	if(typeof Events == "object"){
		if(typeof channel == "object"){
			for(var chan in channel){
				onChan(channel[chan], Events);
			}
		}else{
			onChan(channel, Events);
		}
	}
	
	//Handle callback
	if(typeof callback == "function"){
		if(typeof channel == "object"){
			for(var chan in channel){
				onChan(channel[chan], "joined", callback);
			}
		}else{
			onChan(channel, "joined", callback);
		}
	}
	
	if(this.state == 0) this.connect({user: this.user});
	
	return this;
}
Sub = Sub.bind(APE.client);

var Pub = function(channel, data){
	var pipe = getChan(channel);
	
	if(pipe){
		pipe.send("Pub", {data: data});
	}else{
		APE.log("NO Channel " + channel);
	}
};

var getChan = function(channel){
	if(channel in this.channels){
		return this.channels[channel];
	}
	
	return false;
}
getChan = getChan.bind(APE.client);


var onChan = function(channel, Events, fn){
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
			
			APE.log("Adding ["+channel+"] event '"+$event+"' to queue");
		}
	}else{
		var xnew = Object();
		xnew[Events] = fn;
		onChan(channel,xnew);
	}	
}
onChan = onChan.bind(APE.client);

var onClient = APE.client.on.bind(APE.client);

//Unsubscribe from a channel
var unSub = function(channel){
	if(channel == "") return;
	getChan(channel).leave();
}



