//-------ApePubSub Starts--------//
APE.server = "ape2.crusthq.com";
APE.debug = true;

APE.client = new APE(APE.server);

var Sub = function(channel, Events, callback){
	this.join(channel);
	
	//Handle the events
	if(typeof Events == "object"){
		onChan(channel, Events);
	}
	
	//Handle callback
	if(typeof callback == "function"){
		onChan(channel, "joined", callback);
	}
	
	if(this.state == 0) this.connect({user: this.user});
	
	return getChan(channel);
}
Sub = Sub.bind(APE.client);

var Pub = function(channel, data){
	var pipe = getChan(channel);
	
	if(pipe){
		pipe.send("Pub", {data: data});
	}else{
		APE.log("NO Channel " + channel);
	}
};

var getChan = function(channel){
	if(channel in this.channels){
		return this.channels[channel];
	}
	
	return false;
}
getChan = getChan.bind(APE.client);


var onChan = function(channel, Events, fn){
	if(channel in this.channels){
		this.channels[channel].on(Events, fn);
		return true;
	}
	
	if(typeof Events == "object"){
		//add events to queue
		if(typeof this.events._queue[channel] != "object")
			this.events._queue[channel] = [];
		
		//this.events._queue[channel].push(Events);
		for(var $event in Events){
			var fn = Events[$event];
			
			this.events._queue[channel].push([$event, fn]);
			
			APE.log("Adding ["+channel+"] event '"+$event+"' to queue");
		}
	}else{
		var xnew = Object();
		xnew[Events] = fn;
		onChan(channel,xnew);
	}	
}
onChan = onChan.bind(APE.client);

var onClient = APE.client.on.bind(APE.client);

//Unsubscribe from a channel
var unSub = function(channel){
	if(channel == "") return;
	getChan(channel).leave();
}

