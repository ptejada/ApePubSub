APE.PubSub.addEvent2 = function(chanName, Events, action){
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
