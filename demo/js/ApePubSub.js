/**
 * @author Pablo
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
	client: {},
	debug: true,
	session: false,
	isReady: false,
	reconnect: 0,
	hooks: {}
};

APE.PubSub.addEvent = function(chanName, Events, action){
	if(typeof Events == "object"){
		//add events to queue
		if(typeof this.eventQueue[chanName] != "object")
			this.eventQueue[chanName] = {};
		
		for(var $event in Events){
			var action = Events[$event];
			
			if(typeof this.eventQueue[chanName][$event] != "array")
				this.eventQueue[chanName][$event] = [];
			this.eventQueue[chanName][$event].push(action);
			
			debug("Adding ["+chanName+"] event '"+$event+"' to queue");
		}
	}else{
		var xnew = Object();
		xnew[Events] = action;
		this.addEvent(chanName,xnew);
	};
}

APE.PubSub.fn = {
//Starts the ape
	APE_start: function(callback){
		//define scope
		var $this =this;
		
		if(typeof callback != "function")
			callback = function(){};
		
		//Exit and callback() if started
		if(this.isReady){
			callback();
			return false;
		};
		
		//Add Files to APE loader
		//Load Defaults escripts to ape
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
		
		//Check the Callback function
		if(typeof callback != "function"){
			callback = function(){};
		}
		
		var client = new APE.Client();
		//Load All scripts
		//client.load();
		
		//Bad Session
		client.onError("004", function(){
			
			$this.isReady = false;
			//$this.client.core.stopPoller();
			
			debug("BAD SESSION");
			debug("Reconnecting to server");
			client.fireEvent("on_reconnect");
			
			$this.reconnect++;
			
			if($this.reconnect > 1){
				debug("Could not reconnect to APE server");
				return;
			}
			
			//Remove old frame
			var element = document.getElementById("ape_undefined");
			element.parentNode.removeChild(element);
			
			//Empty this stupid prototype property, huge headache
			APE.Client.prototype.eventProxy = [];
			
			APE_start(callback);
		})
		
		client.addEvent("apeDisconnect", function(){
			debug("Lost Connection to Server");
			client.fireEvent("error_004");
		});
		
		client.on("reconnect", function(){
			debug("========================");
		});
		
		client.addEvent("restoreStart", function(){
			debug("Restoring Session...");
		});
		
		client.addEvent("restoreEnd", function(){
			debug("Session Restored...");
			//client.fireEvent("ready");
		});
		
		//When user joins a Channel
		client.addEvent("multiPipeCreate",function(pipe, options){
			
			debug("Importing user properties from server");
			for(var name in $this.client.core.user.properties){
				$this.user[name] = $this.client.core.user.properties[name];
			}
			$this.user.pubid = $this.client.core.user.pubid;
			
			var chanName = pipe.name;
			
			pipe.on = function($event, action){
				this.addEvent("on_"+$event, action);
				debug("Adding event '"+$event+"' to ["+chanName+"]");
			}
			
			//Add events from queue
			if($this.eventQueue[chanName]){
				for(var $event in $this.eventQueue[chanName]){
					for(var i in $this.eventQueue[chanName][$event]){
						pipe.addEvent($event,$this.eventQueue[chanName][$event][i]);
						debug("Adding event '"+$event+"' to ["+chanName+"]");
					}
				}
			}
			//save channel
			$this.channels[chanName] = pipe;
			pipe.fireEvent("callback");
			debug("Joined channel" + "["+chanName+"]");
		});
		
		//After all scripts are loaded connect to remote server
		client.addEvent('load',function(){
			debug("Starting APE core");
			
			if($this.session && client.core.options.restore){
				//Calling start(); without arguments will ask the APE Server for a user session
				client.core.start();
			}else{
				//It's not a session restoration
				//Call the core start function to connect to APE Server
				client.core.start({user: $this.user, opts: $this.opts});
			}
		});
		
		//When connected to server
		client.addEvent('ready',function(){
			$this.isReady = true;
			
			//Reset the reconnect count
			$this.reconnect = 0;
			
			debug('Your client is now connected');
			
			//call the Callback function if is not a session restore
			callback();
		})
		
		/*
		 * Bind raw_left and raw_join to on_join and on_left respectively
		 */
		client.addEvent("onRaw", function(res, channel){
			debug(">>>>"+res.raw+"<<<<");
			switch(res.raw.toLowerCase()){
				case "join": case "left":
					var user = res.data.user.properties;
					user.pubid = res.data.user.pubid;
					
					channel.fireGlobalEvent("on_"+res.raw.toLowerCase(), [user, channel]);
					return this;
				break;
			}
		});
		
		client.addEvent("onCmd", function(cmd, data){
			debug("<<<<"+cmd+">>>>");
			debug(data);
		});
		
		client.onRaw("ERR", function(cmd, data){
			debug(arguments);
		});
		
		/*
		 * Handle the PUBDATA raw
		 */
		client.onRaw("PUBDATA", function(raw, pipe){
			var data = raw.data;
			
			if(data.type == "message")
				data.content = unescape(data.content);
			
			pipe.fireGlobalEvent("on_"+data.type, [data.content, data.from, pipe]);
			return this;
		});
		/*
		 * Handle Erros
		 */
		 
		
		/*
		 * Update Channel properties on LEFT and JOIN events
		 */
		client.onRaw("JOIN", function(res){
			var channel = res.data.pipe.properties;
			getChan(channel.name).properties = channel;
		});
		
		client.onRaw("LEFT", function(res){
			var channel = res.data.pipe.properties;
			getChan(channel.name).properties = channel;
		});
		
		//Start the APE client
		client.load();
		this.client = client;
		
		return true;
	},
	
	//Subscribe user to channel
	Sub: function(chanName, Events, callback){
		var $args = arguments;
		
		if(!this.isReady){
			var $this = this;
			APE_start(function(){
				Sub.apply($this, $args);
			})
			return;
		}
		
		//Handle the events
		if(typeof Events == "object"){
			for(var i in Events){
				if(i.indexOf("_") > -1) continue;
				
				Events["on_"+i] = Events[i];
				delete Events[i];
			}
			this.addEvent(chanName, Events);
		}
		
		//Handle callback
		if(typeof callback == "function"){
			this.addEvent(chanName,"callback", callback);
		}
		
		this.client.core.join(chanName);
		return this;
	},
	
	//Unsubscribe from a channel
	unSub: function(channel){
		debug(channel);
		if(channel == "") return;
		
		getChan(channel).left();
		
		delete APE.PubSub.channels[channel];
		
		debug("Unsubscribed from ("+channel+")");
	},
	
	//Send Message throught channel
	Pub: function(channel, data){
		
		if(!channel){
			debug("NOT IN A CHANNEL",true);
			return;
		};
		debug("Sending \"" + data + "\" through [" +channel+ "]");
		
		var cmd = {type: getChan(channel).type};
		
		cmd.data = data;
		
		getChan(channel).request.send("PUB", cmd);
	},
	
	//function to get the channel
	getChan:  function(channel){
		if(typeof this.channels[channel] == "object"){
			return this.channels[channel];
		}
		return false;
	},
	
	queueEvent: function(chanName, Events, action){
		//Handle the events
		if(typeof Events == "object"){
			//add events to queue
			this.eventQueue[chanName] = {};
			for(var $event in Events){
				var action = Events[$event];
				this.eventQueue[chanName]["raw_"+$event] = action;
				debug("Adding ["+chanName+"] raw event '"+$event+"' to queue");
			}
		}else{
			this.eventQueue
		};	
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
function debug($obj){
	if(!APE.PubSub.debug) return;
	
    var pre = "[APE] ";
    if(typeof $obj == "string"){ 
        window.console.log(pre+$obj);
    }else{
    	window.console.log(pre+"[Object]");
    	window.console.log($obj);
    }
};

//Generate a random string
function randomString(l) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = l;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}
