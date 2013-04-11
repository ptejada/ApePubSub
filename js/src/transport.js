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
	
	with(frame.style){
		position = 'absolute';
		left = top = '-10px';
		width = height = '1px';
	}
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