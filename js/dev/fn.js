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
