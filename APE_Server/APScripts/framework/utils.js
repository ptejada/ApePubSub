/**
 * Groups all server side classes and objects documentation and definitions
 * @module Server
 */
/**
 * Holds all the connected users by their name property
 * @type {{}}
 */
Ape.userlist = {};
/**
 * Holds the event for the channels
 *
 * @private
 * @type {{}}
 */
Ape.channelEvents = {};

/*
 * Enhance Ape.log function
 */
Apelog = Ape.log;
/**
 * Log any data to the console
 * @param {*} data - The data to log
 */
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

/**
 * Property Setter and Getter
 *
 * @example
 * To get a property: obj.prop( propName );
 * To set a property: obj.prop( propName, propValue);
 * To set multiple properties at once:
 *      obj.prop({
 *          propName1: propValue1,
 *          propName2: propValue2,
 *          ...
 *      });
 *
 * @instance
 * @method prop
 * @memberOf module:Server~Ape.user
 *
 * @param {int|string} index - The named key of the property
 * @param {*} value - The new value of the property
 * @return {*}
 */
Ape.user.prop = function(index, value){
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

/**
 * Property Setter and Getter
 *
 * @example
 * To get a property: obj.prop( propName );
 * To set a property: obj.prop( propName, propValue);
 * To set multiple properties at once:
 *      obj.prop({
 *          propName1: propValue1,
 *          propName2: propValue2,
 *          ...
 *      });
 *
 * @instance
 * @method prop
 * @memberOf module:Server~Ape.channel
 *
 * @param {int|string} index - The named key of the property
 * @param {*} value - The new value of the property
 * @return {*}
 */
Ape.channel.prop = Ape.user.prop;

/**
 * Property Setter which propagates property changes
 *
 * @example
 * To update a property: obj.update( propName, propValue);
 * To update multiple properties at once:
 *      obj.update({
 *          propName1: propValue1,
 *          propName2: propValue2,
 *          ...
 *      });
 *
 * @instance
 * @method update
 * @memberOf module:Server~Ape.user
 *
 * @param {int|string} index The named key of the property
 * @param {*} value The new value of the property
 * @return bool
 */
Ape.user.update = function(index, value){
	if(!!index){
		this.prop(index, value);
		var obj = this.pipe.toObject();
		for(var name in this.channels){
			var channel = this.channels[name];
			channel.pipe.sendRaw("UPDATE", {
				pipe: obj
			});
		}
		return true;
	}else{
		return false;
	}
}
/**
 * Property Setter which propagates property changes
 *
 * @example
 * To update a property: obj.update( propName, propValue);
 * To update multiple properties at once:
 *      obj.update({
 *          propName1: propValue1,
 *          propName2: propValue2,
 *          ...
 *      });
 *
 * @instance
 * @method update
 * @memberOf module:Server~Ape.channel
 *
 * @param {int|string} index The named key of the property
 * @param {*} value The new value of the property
 * @return bool
 */
Ape.channel.update = function(index, value){
	if(!!index){
		this.prop(index, value);
		var obj = this.pipe.toObject();
		this.pipe.sendRaw("UPDATE", {
			pipe: obj
		})
		return true;
	}else{
		return false;
	}
}

/**
 * Send an event to the user
 *
 * @param {string} $event - The name of the event to send
 * @param {*} $data - The data to send with the event
 * @param {object} [options] - The event options
 * @param {Ape.pipe} [options.from] - An user pipe or a custom pipe to be set as event sender
 * @param {Ape.subuser} [options.restrict] - A {@link Ape.subuser subuser} which will not receive the event
 *
 * @instance
 * @method sendEvent
 * @memberOf module:Server~Ape.user
 */
Ape.user.sendEvent = function($event, $data, options){
	var bodyParams = {};
	if(!!options && "from" in options){
		bodyParams = {
			event: $event,
			data: $data
		}
		this.pipe.sendRaw("EVENT", bodyParams, options);
	}else{
		bodyParams = {
			event: $event,
			data: $data,
			pipe: this.pipe.toObject()
		}		
		this.pipe.sendRaw("EVENT-X", bodyParams);
	}
}
/**
 * Send an event to the channel
 *
 * @param {string} $event - The name of the event to send
 * @param {*} $data - The data to send with the event
 * @param {object} [options] - The event options
 * @param {Ape.pipe} [options.from] - An user pipe or a custom pipe to be set as the event sender
 * @param {Ape.user} [options.restrict] - A {@link Ape.user user} which will not receive the event
 *
 * @instance
 * @method sendEvent
 * @memberOf module:Server~Ape.channel
 */
Ape.channel.sendEvent = Ape.user.sendEvent;

/**
 * Get user object by it name property
 *
 * @param name The name of the user
 * @returns {*|boolean}
 */
Ape.getUserByName = function(name){
	name = name.toLowerCase();
	return Ape.userlist[name] || false;
}

/**
 * Register channel event handler
 *
 * @example
 * To register one event handler:
 *      Ape.onChannel( channelName, eventName, eventHandler);
 *
 * To register multiple event handlers:
 *      Ape.onChannel( channelName, {
 *          eventName1: eventHandler1,
 *          eventName2: eventHandler2,
 *          ...
 *      });
 *
 * To register an event handler that will apply to all channels:
 *      Ape.onChannel( "*" , eventName, eventHandler );
 *
 * @param {string} chanName - Name of the channel to register the event handler to
 * @param {object|string} Events - The event name
 * @param {function} handler - The callback function to run everything the event occurs
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

/**
 * Trigger a channel event stack
 *
 * @param {string}channel The name of the channel
 * @param {string}ev The event stack name
 * @param {Array}args The arguments to pass to the event handlers
 * @returns {boolean}
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
/**
 * The main scope/namespace in the APE Server environment. It is initiated on the server startup.
 *
 * @namespace Ape
 * @memberOf module:Server~
 * @see {@link http://ape-project.org/static/jsdocs/server/symbols/Ape.html Ape}
 */
/**
 * The APE Server user object constructor prototype.
 *
 * @constructor user
 * @memberOf module:Server~Ape
 * @see {@link http://ape-project.org/static/jsdocs/server/symbols/Ape.user.html Ape.user}
 */
/**
 * The APE Server user object constructor prototype.
 *
 * @constructor subuser
 * @memberOf module:Server~Ape
 * @see {@link http://ape-project.org/static/jsdocs/server/symbols/Ape.subuser.html Ape.subuser}
 */
/**
 * The APE Server channel object constructor prototype.
 *
 * @constructor channel
 * @memberOf module:Server~Ape
 * @see {@link http://ape-project.org/static/jsdocs/server/symbols/Ape.channel.html Ape.channel}
 */
/**
 * The APE Server pipe object constructor prototype.
 *
 * @constructor pipe
 * @memberOf module:Server~Ape
 * @see {@link http://ape-project.org/static/jsdocs/server/symbols/Ape.pipe.html Ape.pipe}
 */
/**
 * The APE Server MySQL constructor.
 *
 * @constructor MySQL
 * @method MySQL
 * @memberOf module:Server~Ape
 * @see {@link http://ape-project.org/static/jsdocs/server/symbols/Ape.MySQL.html Ape.MySQL}
 */