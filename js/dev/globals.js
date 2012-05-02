var Sub = APS.sub.bind(APS);

var Pub = function(channel, data){
	var pipe = getChan(channel);
	
	if(pipe){
		pipe.send("Pub", {data: data});
	}else{
		APS.log("NO Channel " + channel);
	}
};

var getChan = function(channel){
	if(channel in APS.channels){
		return APS.channels[channel];
	}
	
	return false;
}

var onClient = APS.on.bind(APS);

var onChan = function(channel, Events, fn){	
	if(channel in this.channels){
		this.channels[channel].on(Events, fn);
		return true;
	}
	
	if(typeof Events == "object"){
		//add events to queue
		if(typeof this.events._queue[channel] != "object")
			this.events._queue[channel] = [];
		
		this.events._queue[channel].push(Events);
		for(var $event in Events){
			var fn = Events[$event];
			
			this.events._queue[channel].push([$event, fn]);
			
			APE.debug("Adding ["+channel+"] event '"+$event+"' to queue");
		}
	}else{
		var xnew = Object();
		xnew[Events] = fn;
		onChan(channel,xnew);
	}	
}
onChan = onChan.bind(APS);

var onClient = APS.on.bind(APS);

//Unsubscribe from a channel
var unSub = function(channel){
	if(channel == "") return;
	getChan(channel).leave();
}

