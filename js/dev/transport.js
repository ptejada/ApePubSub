//var APSTransport = function(server, callback, options){
APS.transport = function(server, callback, options){
	this.state = 0;//0 = Not initialized, 1 = Initialized and ready to exchange data, 2 = Request is running
	this.stack = [];
	this.callback = callback;
	
	//WS, SSE, long polling,
	
	if('WebSocket' in window && APS.wb == true){
		this.id = 6;
		var ws = new WebSocket('ws://' + server + '/6/');
		this.send = function(str){
			if(this.state > 0) ws.send(str);
			else this.stack.push(str);
		}.bind(this);

		ws.onopen = this.onLoad;

		ws.onmessage = function(ev){
			callback.onmessage(ev.data);
		}
		
		return;
	}
	
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

APS.transport.prototype.postMessage = function(str, callback){
	if(this.state > 0){
		this.frame.contentWindow.postMessage(str, '*');
		this.state = 2;
	} else this.stack.push(str);
	
	if(typeof callback == "function") callback();
	//this.callback.once = callback || function(){};
}
APS.transport.prototype.frameMessage = function(ev){
	this.state = 1;
	this.callback.onmessage(ev.data);
	//this.callback.once(ev.data);
	//this.callback.once = function(){};
}
APS.transport.prototype.onLoad = function(){
	if(this.id == 6) this.state = 2;
	else this.state = 1;

	for(var i = 0; i < this.stack.length; i++) this.send(this.stack[i]);
	this.stack = [];
}