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
	};
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
	 * Events to output debug data
	 */
	client.addEvent("onRaw", function(res, channel){
		debug(">>>>"+res.raw+"<<<<");
	});
	
	client.addEvent("onCmd", function(cmd, data){
		debug("<<<<"+cmd+">>>>");
	});
	
	client.onRaw("ERR", function(raw){
		debug("Error: ["+raw.data.code+"] "+raw.data.value);
	});
	
	/*
	 * Events to handle Errors
	 */	
	client.addEvent("apeReconnect", function(){
		debug("><><><><>Reconecting<><><><><");
	});
	client.addEvent("apeDisconnect", function(){
		debug("Lost Connection to Server");
	});
	
	client.on("reconnect", function(){
		debug("|Reconnecting======"+$this.reconnect+"===========>");
	});	
	
	//Bad Session
	client.onError("004", function(){			
		$this.isReady = false;
		
		$this.reconnect++;
		
		if($this.reconnect > 3){
			debug("Could not reconnect to APE server");
			client.fireEvent("apeDisconnect");
			client.fireEvent("on_disconnec");
			client.core.clearSession();
			return;
		}
		
		debug("BAD SESSION");
		debug("Reconnecting to server");
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
		
		debug("Joined channel" + "["+chanName+"]");
		
		debug("Updating user properties from channel");
		for(var name in $this.client.core.user.properties){
			$this.user[name] = $this.client.core.user.properties[name];
		}	
				
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
		debug("Restoring Session...");
		this.restoring = true;
	});
	
	client.addEvent("restoreEnd", function(){
		debug("Session Restored");
		this.restoring = false;
		client.fireEvent("ready");
	});

	/*
	 * After all scripts have loaded
	 * Start the client core to start a connection to the server
	 */
	client.addEvent('load',function(){
		debug("Starting APE core");
		
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
		$this.reconnect = 0;
		
		debug('Your client is now connected');
		
		//call the Callback function
		callback();
	})
	
	/*
	 * The trigger to start everything up
	 */
	client.load();
	this.client = client;
	
	return this;
}