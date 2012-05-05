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

	this.transport = new APE.transport(server, cb, options);
	
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

APE.prototype.connect = function(args){
	this.send('CONNECT', args);
	return this;
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
