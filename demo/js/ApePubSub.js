/**
 * @author Pablo
 */

//-------ApePubSub Starts--------//
APE.PubSub = {
	user: {},
	opts: {},
	channels: {},
	client: {},
	reEvents: {},
	debug: true,
	session: false,
	isReady: false,
	hooks: {}
};

APE.PubSub.fn = {
	
	//Starts the ape
	APE_start: function(callback){
		var $this = this;
		//Exit and callback() if started
		if(this.isReady){
			callback();
			return false;
		};
		
		//Add Files to APE loader
		//Load Defaults scripts to ape
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
		
		if(this.session) debug("Using APE sessions");
		
		//Check the Callback function
		if(typeof callback != "function"){
			callback = function(){};
		}
		
		var client = new APE.Client();
				
		//Load All scripts
		client.load();
		
		//Bad Session
		client.onError("004", function(){
			debug("BAD SESSION");
			debug("Reconnecting to server");
			
			if(typeof this.reconnect == "undefined") $.reconnect = 0;
			
			$this.reconnect++;
			
			if($this.reconnect > 1){
				debug("Could not reconnect to APE server");
				return;
			}
			
			APE_start(callback);
		})
		
		//After all scripts are loaded
		client.addEvent('load',function(){
			debug("Starting APE core");
				
			if(client.core.options.restore){
				//Calling start(); without arguments will ask the APE Server for a user session
				client.core.start();
				
				client.addEvent("restoreEnd", function(par1, par2){
					debug("Is a Session Restoration");
					
					//The Callbackk function
					callback();
				});
			}else{
				//It's not a session restoration
				//Call the core start function to connect to APE Server
				client.core.start({user: $this.user, opts: $this.opts});
			}
		})		
		
		//When connected to server
		client.addEvent('ready',function(){
			$this.isReady = true;
			
			//Reset reconnection counter
			$this.reconnect = 0;
			
			debug('Your client is now connected');
			
			//When user joins a Channel
			client.addEvent("multiPipeCreate",function(pipe, options){
				
				debug("Importing user properties from server");
				for(var name in client.core.user.properties){
					$this.user[name] = client.core.user.properties[name];
				}
				$this.user.pubid = client.core.user.pubid;
				var chanName = pipe.properties.name;
				
				//Create Channel Pointer
				$this.channels[chanName] = pipe;
				
				//Check for pending events
				debug("Adding pending events to ["+chanName+"]")
				if($this.reEvents[chanName]){
					for(var $event in $this.reEvents[chanName]){
						for(var i in $this.reEvents[chanName][$event]){	
							addEventOn(chanName, $event, $this.reEvents[chanName][$event][i]);
						}
					}
				}
				
				debug("Joined channel" + "("+pipe.properties.name+")");				
			});
			
			//Handle errors
			client.onRaw("ERR", function(raw){
				debug("Error["+raw.data.code+"]: "+raw.data.value);
			});
			
			//call the Callback function if is not a session restore
			if(!client.core.options.restore) callback();
		})
		
		this.client = client;
		
		return true;
	},

	//Subscribe user to channel
	Sub: function(chanName, events){
		var $args = arguments;
		
		if(!this.isReady){
			APE_start(function(){
				Sub.apply(this, $args);
			})
			return;
		}
			
		if(typeof chanName != "object"){
			var channel = Array(chanName);
		}else{
			var channel = chanName.slice();
		};		
		this.client.core.join(channel);
		
		if(typeof events == "object"){
			for(var ev in events){
				this.addEventOn
			}
		}
		
		return this;
	},

	//Unsubscribe from a channel
	unSub: function(channel){
		debug(channel);
		if(channel == "") return;
		
		APE.PubSub.channel(channel).pipe.left();
		
		delete APE.PubSub.ch[channel];
		
		debug("Unsubscribed from ("+channel+")");
	},

	//Send Message throught channel
	Pub: function(channel, data){
		if(!channel){
			debug("NOT IN A CHANNEL",true);
			return;
		};
		debug("Sending \"" + data + "\" through [" +channel+ "]");
		if(typeof this.channels[channel] == "object"){
			this.channels[channel].send(data);		
		}else{
			debug("You are not a member of channel [" +channel+"]");
		}
		
		return this;
	},
	
	addEventOn: function(channel,eventName,func){
		if(typeof this.channels[channel] == 'object'){
			if(typeof eventName == "object"){
				//Multiple events
				for(var $event in eventName){
					addEventOn(channel, $event, eventName[$event]);
				}
				return;
			}else{
				//Single event
				this.channels[channel].onRaw(eventName,func);
				debug("Added '"+eventName+"' event to ["+channel+"]");				
			}
		}else{
			if(!this.reEvents[channel]){
				this.reEvents[channel] = {};
				this.reEvents[channel][eventName] = [];
			}else if(!this.reEvents[channel][eventName]){
				this.reEvents[channel][eventName] = [];
			}
			
			if(typeof eventName == "object"){
				//Multiple events
				for(var $event in eventName){
					addEventOn(channel, $event, eventName[$event]);
				}
			}else{
				//Single event				
				this.reEvents[channel][eventName].push(func);
				debug("No ["+channel+"] to add event '"+eventName+"' to");
			}
			
		}
	}
}
/*
 * Make functions globals and Bind PubSub
 */
for(func in APE.PubSub.fn){
	window[func] = APE.PubSub.fn[func];
	window[func] = window[func].bind(APE.PubSub);
}
delete func;

//Debug Function for Browsers console
function debug($obj){
	if(!APE.PubSub.debug) return;
	
    var pre = "[APE] ";
    if(typeof $obj == "string"){ 
        window.console.log(pre+$obj);
    }else{
    	window.console.log(pre+"[Object]");
    	window.console.log($obj);
    }
};

//Generate a random string
function randomString(l) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = l;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}
