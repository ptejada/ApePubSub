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
			onChan(chanName, Events);
		}
		
		//Handle callback
		if(typeof callback == "function"){
			onChan(chanName,"callback", callback);
		}
		
		if(!this.isReady){
			var $this = this;
			this.startOpt.channel = this.startOpt.channel || [];
			this.startOpt.channel.push(chanName);
			
			//APE.PubSub.load();
			this.load();
		}else{
			this.client.core.join(chanName);				
		}
		
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
	
	onChan: function(chanName, Events, action){
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
			onChan(chanName,xnew);
		};
	}
}; //End of APE.PubSub.fn
