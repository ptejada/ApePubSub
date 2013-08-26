/*
 * Initialize Ape variables
 */
Ape.userlist = {};
Ape.channelEvents = {};

/*
 * Enhance Ape.log function
 */
Apelog = Ape.log;
Ape.log = function(data){
	switch(typeof data){
		case "object":
			var result = "----" + data + "----\n";
			var level = 0;
			data = data.toSource();

			for(var i= 0; data.length > i; i++){
				var letter = data[i];
				var next = data[i+1];
				var previous = data[i-1];

				var tab = false;

				if(letter != " "){
					result += letter;

					switch(letter){
						case "{":
							if(next != "}"){
								result += "\n";
								level++;
								tab = true;
							}
							break;
						case "}":
							if(previous != "{" && next != "," && next != ")"){
								result += "\n";
								level--;
								tab = true;
							}else if(next == "}"){
								result += "\n";
								level--;
								tab = true;
							}
							break;
						case "[":
							if(next != "]"){
								result += "\n";
								level++;
								tab = true;
							}
							break;
						case "]":
							if(previous != "[" && next != ","){
								result += "\n";
								level--;
								tab = true;
							}else if(next == "]"){
								result += "\n";
								level--;
								tab = true;
							}
							break;

						case ",":
							if(next != "{"){
								result += "\n";
								tab = true;
							}
							break
						case ":":
							result += " ";
							break;

						default:
							if(next == "}" || next == "]"){
								result += "\n";
								level--;
								tab = true;
							}

					}
					if(tab)
						for(var l=0; level > l; l++)
							result += "  ";
				}
			}
			Apelog(result);
			break;
		default:
			Apelog(data);
	}
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

Ape.user.change = Ape.channel.change = function(index, value){
	if(!!index && !!value){
		this.prop(index, value);
		var obj = this.pipe.toObject();
		if(obj.casttype == "uni"){
			for(var name in this.channels){
				var channel = this.channels[name];
				channel.pipe.sendRaw("UPDATE", {
					pipe: obj
				});
			}
		}else{
			this.pipe.sendRaw("UPDATE", {
				pipe: obj
			})
		}
	}else{
		return false;
	}
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
		//Normalize
		chanName = chanName.toLowerCase();

		//add events to queue
		if(!(chanName in Ape.channelEvents))
			this.channelEvents[chanName] = {};

		for(var $event in Events){
			handler = Events[$event];
			$event = $event.toLowerCase();
			if(!($event in Ape.channelEvents[chanName]))
				Ape.channelEvents[chanName][$event] = [];
			
			Ape.channelEvents[chanName][$event].push(handler);
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
	//Normalize
	ev = ev.toLowerCase();
	var name = channel.prop("name").toLowerCase();
	
	if(!(args instanceof Array)) args = [args];
	
	//Trigger global all channel events
	if("*" in Ape.channelEvents && ev in Ape.channelEvents["*"]){
		for(var i in Ape.channelEvents["*"][ev]){
			if(Ape.channelEvents["*"][ev][i].apply(channel, args) === false)
				return false;
		}
	}
	
	//Trigger channel specific events
	if(name in Ape.channelEvents && ev in Ape.channelEvents[name]){
		for(var i in Ape.channelEvents[name][ev]){
			if(Ape.channelEvents[name][ev][i].apply(channel, args) === false)
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