/**
 * @author Pablo Tejada
 * Built on 2012-04-23 @ 03:21
 */
 
	APE.Client.prototype.on = function($event, func){
	this.addEvent("on_"+$event, func);
}
//-------ApePubSub Starts--------//

APE.PubSub = {
	user: {},
	opts: {},
	channels: {},
	eventQueue: {},
	globalEventQueue: [],
	client: {},
	debug: true,
	session: false,
	state: 0,
	reconnect: 0,
	restoring: false,
	startOpt: {}
};


APE.PubSub.load = function(callback){
	//define scope
	var $this = this;
	
	//Check callback
	if(typeof callback != "function")
		callback = function(){};
	
	//Exit and callback() if started
	if(this.isReady){
		callback();
		return false;
	}
	
	/*
	 * Add Script Files for APE.Config.scripts
	 */
	APE.Config.scripts = [];
	if(this.debug){
		//Load uncompress files
		(function(){
			for (var i = 0; i < arguments.length; i++)
				APE.Config.scripts.push(APE.Config.baseUrl + '/Source/' + arguments[i] + '.js');
		})('mootools-core', 'Core/APE', 'Core/Events', 'Core/Core', 'Pipe/Pipe', 'Pipe/PipeProxy', 'Pipe/PipeMulti', 'Pipe/PipeSingle', 'Request/Request','Request/Request.Stack', 'Request/Request.CycledStack', 'Transport/Transport.longPolling','Transport/Transport.SSE', 'Transport/Transport.XHRStreaming', 'Transport/Transport.JSONP', 'Core/Utility', 'Core/JSON');
		if(this.session) APE.Config.scripts.push(APE.Config.baseUrl + "/Source/Core/Session.js");
		
		//APE.Config.scripts.push(APE.Config.baseUrl + "/Plugins/Debug.js");
	
	}else{
		//Load Compressed files
		if(this.session){
			APE.Config.scripts.push(APE.Config.baseUrl + "/Build/yuiCompressor/apeCoreSession.js");
		}else{
			APE.Config.scripts.push(APE.Config.baseUrl + "/Build/yuiCompressor/apeCore.js");
		}
	}
	
	/*
	 * Instantiate APE Client
	 */
	var client = new APE.Client();
	
	/*
	 * Import client queue events
	 */
	for(var name in this.globalEventQueue){
		var stack = this.globalEventQueue[name];
		
		for(var i in stack){
			client.addEvent(name, stack[i]);
		}
	}
	
	/*
	 * Events to output debug data
	 */
	client.addEvent("onRaw", function(res, channel){
		APE.debug(">>>>"+res.raw+"<<<<");
	});
	
	client.addEvent("onCmd", function(cmd, data){
		APE.debug("<<<<"+cmd+">>>>");
	});
	
	client.onRaw("ERR", function(raw){
		APE.debug("Error: ["+raw.data.code+"] "+raw.data.value);
	});
	
	/*
	 * Events to handle Errors
	 */
	client.addEvent("apeReconnect", function(){
		APE.debug("><><><><>Reconecting<><><><><");
	});
	client.addEvent("apeDisconnect", function(){
		APE.debug("Lost Connection to Server");
	});
	
	client.on("reconnect", function(){
		APE.debug("|Reconnecting======("+$this.reconnect+")===========>");
	});	
	
	//Bad Session
	client.onError("004", function(){
		$this.isReady = false;
		
		$this.reconnect++;
		
		if($this.reconnect > 3){
			APE.debug("Could not reconnect to APE server");
			client.fireEvent("apeDisconnect");
			client.fireEvent("on_disconnec");
			client.core.clearSession();
			return;
		}
		
		APE.debug("BAD SESSION");
		APE.debug("Reconnecting to server");
		client.fireEvent("on_reconnect");
		
		/*
		 * Force to get a new session
		 */
		this.core.removeInstance(this.core.options.identifier);
		this.core.saveCookie();
		
		this.core.stopPoller();
		this.core.cancelRequest();
		
		//Reload the client
		client.load();
	});
	
	/*
	 * Events to Handle incoming RAW
	 */
	client.onRaw("CHANNEL",function(res, pipe){
	//When user joins joins a channel
		var chanName = pipe.name;
		
		APE.debug("Joined channel" + "["+chanName+"]");
		
		APE.debug("Updating user properties from channel");
		for(var name in $this.client.core.user.properties){
			$this.user[name] = $this.client.core.user.properties[name];
		}
		
		pipe.on = function($event, action){
			$event = "on_" + $event;
			
			this.addEvent($event, action);
			APE.debug("Adding event '"+$event+"' to ["+chanName+"]");
		}
		
		//Add events from queue
		if($this.eventQueue[chanName]){
			for(var $event in $this.eventQueue[chanName]){
				for(var i in $this.eventQueue[chanName][$event]){
					pipe.addEvent($event,$this.eventQueue[chanName][$event][i]);
					APE.debug("Adding event '"+$event+"' to ["+chanName+"]");
				}
			}
		}
		
		//save channel
		$this.channels[chanName] = pipe;
		pipe.fireEvent("on_callback");
	});
	
	client.onRaw("PUBDATA", function(raw, pipe){
	//Route incoming messages and data to proper events
		var data = raw.data;
		
		if(data.type == "message")
			data.content = unescape(data.content);
		
		pipe.fireGlobalEvent("on_"+data.type, [data.content, data.from, pipe]);
		return this;
	});
	
	client.onRaw("LEFT", function(res,pipe){
	//Update Channel properties on LEFT events
		pipe.properties = res.data.pipe.properties;
		
	//Trigger on_left event
		var user = res.data.user.properties || {};
		user.pubid = res.data.user.pubid;
		
		pipe.fireGlobalEvent("on_"+res.raw.toLowerCase(), [user, pipe]);
	});
	
	client.onRaw("JOIN", function(res, pipe){
	//Update Channel properties on JOIN events
		pipe.properties = res.data.pipe.properties;
		
	//Trigger on_left event
		var user = res.data.user.properties || {};
		user.pubid = res.data.user.pubid;
		
		pipe.fireGlobalEvent("on_"+res.raw.toLowerCase(), [user, pipe]);
	});
	
	/*
	 * Events for sessions
	 */
	client.addEvent("restoreStart", function(){
		APE.debug("Restoring Session...");
		this.restoring = true;
	});
	
	client.addEvent("restoreEnd", function(){
		APE.debug("Session Restored");
		this.restoring = false;
		client.fireEvent("ready");
	});

	/*
	 * After all scripts have loaded
	 * Start the client core to start a connection to the server
	 */
	client.addEvent('load',function(){
		APE.debug("Starting APE core");
		
		//Channels
		this.core.options.channel = $this.startOpt.channel || null;
		
		//Delete Buging default events
		client.core.$events["error_004"].splice(0,1);
		
		if($this.session && client.core.options.restore){
			//Calling start(); without arguments will ask the APE Server for a user session
			client.core.start(null, $this.starOpt);
		}else{
			//It's not a session restoration
			//Call the core start function to connect to APE Server
			client.core.start({user: $this.user, opts: $this.opts}, $this.starOpt);
		}
	});
	
	client.addEvent('ready',function(){
	//Your client is now connected
		if(this.restoring) return this
		
		$this.isReady = true;
		
		//Reset the reconnect count
		if($this.reconnect > 0 ){
			$this.reconnect = 0;
			client.fireEvent("on_reconnected");
		}else{
			client.fireEvent("on_connected");
		}
		
		APE.debug('Your client is now connected');
		
		//call the Callback function
		callback();
	})
	
	/*
	 * The trigger to start everything up
	 */
	client.load({
		identifier: "PubSub",
		domain: "auto"
	});
	this.client = client;
	
	return this;
}

APE.PubSub.fn = {

	//Subscribe user to channel
	Sub: function(chanName, Events, callback){
		//Handle multiple channels
		if(typeof chanName == "object" && !this.isReady){
			var $args = arguments;
			var $this = this;
			
			this.load(function(){
				Sub.apply($this, $args);
			})
			
			return this;
		}
		
		//Handle the events
		if(typeof Events == "object"){
			onChan(chanName, Events);
		}
		
		//Handle callback
		if(typeof callback == "function"){
			onChan(chanName,"callback", callback);
		}
		
		this.startOpt.channel = this.startOpt.channel || [];
		this.startOpt.channel.push(chanName);
		
		if(this.isReady){
			this.client.core.join(chanName);
			
		}else{
			this.load();
			
		}
		
		return this;
	},
	
	//Unsubscribe from a channel
	unSub: function(channel){
		APE.debug(channel);
		if(channel == "") return;
		
		getChan(channel).left();
		
		delete APE.PubSub.channels[channel];
		
		APE.debug("Unsubscribed from ("+channel+")");
	},
	
	//Send Message throught channel
	Pub: function(channel, data){
		
		if(!channel){
			APE.debug("NOT IN A CHANNEL",true);
			return;
		};
		APE.debug("Sending \"" + data + "\" through [" +channel+ "]");
		
		var cmd = {type: getChan(channel).type};
		
		cmd.data = data;
		
		getChan(channel).request.send("PUB", cmd);
	},
	
	//function to get a channel/pipe by name
	getChan:  function(channel){
		if(typeof this.channels[channel] == "object"){
			return this.channels[channel];
		}
		return false;
	},
	
	//To add event to channel
	onChan: function(chanName, Events, action){
		if(typeof Events == "object"){
			//add events to queue
			if(typeof this.eventQueue[chanName] != "object")
				this.eventQueue[chanName] = {};
			
			for(var $event in Events){
				var action = Events[$event];
				
				$event = "on_" + $event;
				
				if(typeof this.eventQueue[chanName][$event] != "array")
					this.eventQueue[chanName][$event] = [];
				
				this.eventQueue[chanName][$event].push(action);
				
				APE.debug("Adding ["+chanName+"] event '"+$event+"' to queue");
			}
		}else{
			var xnew = Object();
			xnew[Events] = action;
			onChan(chanName,xnew);
		};
	},
	
	onAllChan: function(Events, action){
		if(typeof Events == "object"){						
			for(var $event in Events){
				var action = Events[$event];
				
				$event = "on_" + $event;
				
				//add to client
				if(this.client instanceof APE.Client){
					APE.debug("Ape client is ready")
					this.client.addEvent($event, action)
					continue;
				}
				
				//add events to queue
				if(typeof this.globalEventQueue[$event] != "array")
					this.globalEventQueue[$event] = [];
				
				this.globalEventQueue[$event].push(action);
				
				APE.debug("Adding Global event '"+$event+"' to queue");
			}
		}else{
			var xnew = {};
			xnew[Events] = action;
			onAllChan(xnew);
		};
	},
	
	APE_ready: function(callback){
		this.load(callback)
	}
}; //End of APE.PubSub.fn


/*
 * Export and bind functions
 */
for(func in APE.PubSub.fn){
	window[func] = APE.PubSub.fn[func].bind(APE.PubSub);
}
delete func;

//Debug Function for Browsers console
APE.debug = function($obj){
	if(!this.PubSub.debug) return;
	
	var pre = "[APE] ";
	if(typeof $obj == "string"){
		window.console.log(pre+$obj);
	}else{
		window.console.log(pre+"[Object]");
		window.console.log($obj);
	}
};

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


