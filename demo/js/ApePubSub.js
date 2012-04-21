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
	startOpt: {},
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
			
			APE.debug("Adding ["+chanName+"] event '"+$event+"' to queue");
		}
	}else{
		var xnew = Object();
		xnew[Events] = action;
		this.addEvent(chanName,xnew);
	};
}

APE.PubSub.load = function(callback){
	//define scope
	var $this = this;
	
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
	client.addEvent("apeReconnect", function(){
		APE.debug("><><><><>Reconecting<><><><><");
	});
	client.addEvent("apeDisconnect", function(){
		APE.debug("Lost Connection to Server");
		//client.fireEvent("error_004");
	});
	
	client.on("reconnect", function(){
		APE.debug("|Reconnecting======"+$this.reconnect+"===========>");
		//client.core.status = 1;
	});
	
	client.addEvent("restoreStart", function(){
		APE.debug("Restoring Session...");
		this.restoring = true;
	});
	
	client.addEvent("restoreEnd", function(){
		APE.debug("Session Restored");
		this.restoring = false;
		client.fireEvent("ready");
	});
	
	
	//Bad Session
	client.onError("004", function(){			
		$this.isReady = false;
		//$this.client.core.stopPoller();			
		
		$this.reconnect++;
		
		if($this.reconnect > 3){
			APE.debug("Could not reconnect to APE server");
			client.fireEvent("apeDisconnect");
			//client.core.clearSession();
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
	})
	
	//When user joins a Channel
	client.onRaw("CHANNEL",function(res, pipe){
		
		APE.debug("Importing user properties from server");
		for(var name in $this.client.core.user.properties){
			$this.user[name] = $this.client.core.user.properties[name];
		}
		
		$this.user.pubid = $this.client.core.user.pubid;
		
		var chanName = pipe.name;
		
		pipe.on = function($event, action){
			this.addEvent("on_"+$event, action);
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
		pipe.fireEvent("callback");
		APE.debug("Joined channel" + "["+chanName+"]");
	});
	
	//After all scripts are loaded connect to remote server
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
	
	//Connected to server
	client.addEvent('ready',function(){
		//if(this.restoring) return this
		
		$this.isReady = true;
		
		//Reset the reconnect count
		$this.reconnect = 0;
		
		APE.debug('Your client is now connected');
		
		//call the Callback function
		callback();
	})
	
	/*
	 * Bind raw_left and raw_join to on_join and on_left respectively
	 */
	client.addEvent("onRaw", function(res, channel){
		APE.debug(">>>>"+res.raw+"<<<<");
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
		APE.debug("<<<<"+cmd+">>>>");
		switch(cmd){
			case "": 
				APE.debug(data);
		}
	});
	
	client.onRaw("ERR", function(cmd, data){
		APE.debug(arguments);
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
		APE.debug(res.time);
	});
	
	client.onRaw("LEFT", function(res){
		var channel = res.data.pipe.properties;
		getChan(channel.name).properties = channel;
	});
	
	
	/*
	 * Help trigger apeDisconnect
	 */
	/*
	client.onCmd("connect", function(){
		//client.core.status = -1;
	});
	client.onCmd("session", function(){
		//client.core.status = 0;
	});
	*/
	
	//Start the APE client
	client.load();
	this.client = client;
	
	return true;
}
APE.PubSub.fn = {
	
	//Subscribe user to channel
	Sub: function(chanName, Events, callback){
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
		
		if(!this.isReady){
			var $this = this;
			this.startOpt.channel = this.startOpt.channel || [];
			this.startOpt.channel.push(chanName);
			
			APE_load();
		}else{
			this.client.core.join(chanName);				
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
				APE.debug("Adding ["+chanName+"] raw event '"+$event+"' to queue");
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
