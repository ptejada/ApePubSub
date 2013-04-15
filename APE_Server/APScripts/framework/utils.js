/*
 * Initialize Ape variables
 */
Ape.userlist = {};
Ape.channelEvents = {};

/*
 * Enchance Ape.log function
 */
Apelog = Ape.log;

Ape.log = function(data){
	switch(typeof data){
		case "object":
		//case "array":
			Apelog(data.toSource());
			break;
		default:
			Apelog(data);
	}
	//Apelog("\r");
}

/*
 * Globalize Some Ape methods
 */
var setTimeout = Ape.setTimeout;
var setInterval = Ape.setInterval;
var clearTimeout = Ape.clearTimeout;
var clearInterval = Ape.clearInterval;

/*
 * Built-in object modifications
 */
Ape.user.prop = Ape.channel.prop = function(index, value){
	if(typeof index != 'undefined'){
		if(typeof index == "object"){
			for(var i in index){
				this.setProperty(i, index[i]);
			}
		}else if(typeof value != 'undefined'){
			this.setProperty(index, value);
		}else{
			return this.getProperty(index) || false;
		}
		
		//Increment the revision number
		var rev = this.getProperty("_rev");
		rev = parseInt(rev) || 0;
		rev++;
		return this.setProperty("_rev", rev);
	}
	
	return this.pipe.toObject().properties;
}

Ape.user.sendEvent = Ape.channel.sendEvent = function($event, $data, options){
	if(!!options && "from" in options){
		var bodyParams = {
			event: $event,
			data: $data
		}
		this.pipe.sendRaw("EVENT", bodyParams, options);
	}else{
		var bodyParams = {
			event: $event,
			data: $data,
			pipe: this.pipe.toObject()
		}		
		this.pipe.sendRaw("EVENT-X", bodyParams);
	}
}

/*
 * New Ape method: get username by name
 * 
 */
Ape.getUserByName = function(name){
	name = name.toLowerCase();
	return Ape.userlist[name] || false;
}

/*
 * New Ape method: listen to events by channel
 */
Ape.onChannel = function(chanName, Events, handler){
	if(typeof Events == "object"){
		//add events to queue
		if(!(chanName in this.channelEvents))
			this.channelEvents[chanName] = {};
		
		for(var $event in Events){
			handler = Events[$event];
			$event = $event.toLowerCase();
			if(!($event in this.channelEvents[chanName]))
				this.channelEvents[chanName][$event] = [];
			
			this.channelEvents[chanName][$event].push(handler);
			Ape.log("	+ Adding [" +$event+ "] event handler to channel [" + chanName +"]");
		}
	}else{
		var xnew = {};
		xnew[Events] = handler;
		this.onChannel(chanName,xnew);
	}
}
/*
 * New Ape method: trigger channel event
 */
Ape.triggerChannelEvent = function(channel, ev, args){
	ev = ev.toLowerCase();
	var name = channel.prop("name");
	
	if(!(args instanceof Array)) args = [args];
	
	//Trigger global all channel events
	if("*" in this.channelEvents && ev in this.channelEvents["*"]){
		for(var i in this.channelEvents["*"][ev]){
			if(this.channelEvents["*"][ev][i].apply(channel, args) === false)
				return false;
		}
	}
	
	//Trigger channel specific events
	if(name in this.channelEvents && ev in this.channelEvents[name]){
		for(var i in this.channelEvents[name][ev]){
			if(this.channelEvents[name][ev][i].apply(channel, args) === false)
				return false;
		}
	}
	
	return true;
}
/*
 * Official bind polyfill at developer.mozilla.org
 */ 
if(!Function.prototype.bind){
	Function.prototype.bind = function(oThis){
	if(typeof this !== "function"){
		// closest thing possible to the ECMAScript 5 internal IsCallable function
		throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	}

	var aArgs = Array.prototype.slice.call(arguments, 1), 
		fToBind = this, 
		fNOP = function(){},
		fBound = function(){
			return fToBind.apply(this instanceof fNOP
								 ? this
								 : oThis || window,
								 aArgs.concat(Array.prototype.slice.call(arguments)));
		};

	fNOP.prototype = this.prototype;
	fBound.prototype = new fNOP();

	return fBound;
	};
}