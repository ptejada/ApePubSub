//var APSTransport = function(server, callback, options){
APS.transport = function(server, callback, client){
	this.state = 0;//0 = Not initialized, 1 = Initialized and ready to exchange data, 2 = Request is running
	this.stack = [];
	this.callback = callback;
	
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
	
	if(!!client.option.eventPush){
		var realSend = this.send.bind(this);
		
		var requestCallback = function(res){
			callback.onmessage(res);
			client.check();
		}
		this.send = function(str, cb, data){
			if(data.cmd == "Event"){
				client.request(client.option.eventPush, "cmd="+str+"&from="+client.user.pubid, requestCallback);
				return "pushed";
			}else{
				realSend.apply(this, [str, cb]);
			}
		}
	}
	
}

APS.transport.wb = function(server, callback, client){
	if('WebSocket' in window){
		this.id = 6;
		this.loop = setInterval(client.check.bind(client,true), 40000);
		
		var protocol = !!client.option.secure ? "wss" : "ws";
		
		try{
			var ws = new WebSocket(protocol + '://' + server + '/6/');
		}catch(e){
			callback.onerror(e);
			return false
		}
		
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
		
		ws.onclose = function(){
			clearInterval(this.loop);
			this.state = client.state = 0;
		}
		
		this.close = function(){
			ws.close();
			this.state = client.state = 0;
		} 
		
	}else{
		client.log("No Websocket support");
		return false;
	}
}

APS.transport.lp = function(server, callback, client){
	this.id = 0;
	var frame = document.createElement('iframe');
	var protocol = !!client.option.secure ? "https" : "http";
	var origin = window.location.protocol+'//'+window.location.host;
	//Fixes cranky IE9
	server = server.toLowerCase();
	
	with(frame.style){ 
		position = 'absolute';
		left = top = '-10px';
		width = height = '1px';
	}

	frame.setAttribute('src', protocol + "://" + server + '/?[{"cmd":"frame","params": {"origin":"'+origin+'"}}]');
	
	document.body.appendChild(frame);
	
	function recieveMessage(ev){
		if(ev.origin != protocol + "://" + server) return;
		if(ev.source !== frame.contentWindow) return;
		
		this.state = 1;
		this.callback.onmessage(ev.data);
		//this.callback.once(ev.data);
		//this.callback.once = function(){};
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
		frame.parentElement.removeChild(frame);
		this.state = client.state = 0;
	}
}