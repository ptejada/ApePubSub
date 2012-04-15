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
		debug("><><><><>Reconecting<><><><><");
	});
	client.addEvent("apeDisconnect", function(){
		debug("Lost Connection to Server");
		//client.fireEvent("error_004");
	});
	
	client.on("reconnect", function(){
		debug("|Reconnecting======"+$this.reconnect+"===========>");
		//client.core.status = 1;
	});
	
	client.addEvent("restoreStart", function(){
		debug("Restoring Session...");
		this.restoring = true;
	});
	
	client.addEvent("restoreEnd", function(){
		debug("Session Restored");
		this.restoring = false;
		client.fireEvent("ready");
	});
	
	
	//Bad Session
	client.onError("004", function(){			
		$this.isReady = false;
		//$this.client.core.stopPoller();			
		
		$this.reconnect++;
		
		if($this.reconnect > 3){
			debug("Could not reconnect to APE server");
			client.fireEvent("apeDisconnect");
			//client.core.clearSession();
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
	})
	
	//When user joins a Channel
	client.onRaw("CHANNEL",function(res, pipe){
		
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
		
		debug('Your client is now connected');
		
		//call the Callback function
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
		switch(cmd){
			case "": 
				debug(data);
		}
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
		debug(res.time);
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