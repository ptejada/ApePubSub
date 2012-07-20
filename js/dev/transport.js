//var APSTransport = function(server, callback, options){
APS.transport = function(server, callback, client){
	this.state = 0;//0 = Not initialized, 1 = Initialized and ready to exchange data, 2 = Request is running
	this.stack = [];
	this.callback = callback;
	
	//WS, SSE, long polling,
	/*
	this.postMessage = function(str, callback){
		if(this.state > 0){
			this.frame.contentWindow.postMessage(str, '*');
			this.state = 2;
		} else this.stack.push(str);
		
		if(typeof callback == "function") callback();
		//this.callback.once = callback || function(){};
	}
	this.frameMessage = function(ev){
		this.state = 1;
		this.callback.onmessage(ev.data);
		//this.callback.once(ev.data);
		//this.callback.once = function(){};
	}
	this.onLoad = function(){
		if(this.id == 6) this.state = 2;
		else this.state = 1;
	
		for(var i = 0; i < this.stack.length; i++) this.send(this.stack[i]);
		this.stack = [];
	}
	*/
	
	//Fire transport
	var trans = client.option.transport;
	var args = Array.prototype.slice.call(arguments);
	if(typeof trans == "object"){
		for(var t in trans){
			var ret = APS.transport[trans[t]].apply(this, args);
			if(ret != false) break;
		}
	}
	if(typeof trans == "string"){
		APS.transport[trans].apply(this, args);
	}
}

APS.transport.wb = function(server, callback, client){
	if('WebSocket' in window){
		this.id = 6;
		this.loop = setInterval(client.check.bind(client,true), 40000);
		
		var ws = new WebSocket('ws://' + server + '/6/');
		this.send = function(str){
			if(this.state > 0) ws.send(str);
			else this.stack.push(str);
		}.bind(this);
		
		ws.onerror = function(e){
			this.state = 0;
			clearInterval(this.loop);
			callback.onerror(e);
		}.bind(this)
		
		ws.onopen = function(){
			this.state = 2;
		
			for(var i = 0; i < this.stack.length; i++) this.send(this.stack[i]);
			this.stack = [];
		}.bind(this)
;

		ws.onmessage = function(ev){
			callback.onmessage(ev.data);
		}
	}else{
		return false;
	}
}

APS.transport.lp = function(server, callback, client){
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
	
	function postMessage(str, callback){
		if(this.state > 0){
			this.frame.contentWindow.postMessage(str, '*');
			this.state = 2;
		} else this.stack.push(str);
		
		if(typeof callback == "function") callback();
		//this.callback.once = callback || function(){};
	}
	function frameMessage(ev){
		this.state = 1;
		this.callback.onmessage(ev.data);
		//this.callback.once(ev.data);
		//this.callback.once = function(){};
	}
	function onLoad(){
		this.state = 1;
	
		for(var i = 0; i < this.stack.length; i++) this.send(this.stack[i]);
		this.stack = [];
	}
	
	if('addEventListener' in window){
		window.addEventListener('message', frameMessage.bind(this), 0);
		frame.addEventListener('load', onLoad.bind(this), 0);
	} else {
		window.attachEvent('onmessage', frameMessage.bind(this));
	}
	
	var t = this;
	this.send = function(str, callback){
		if(this.state > 0){
			this.frame.contentWindow.postMessage(str, '*');
			this.state = 2;
		} else this.stack.push(str);
		
		if(typeof callback == "function") callback();
		//this.callback.once = callback || function(){};
	}
}