/**
 * @author Pablo
 */

//-------ApePubSub Starts--------//
//Create $ if jQuery is not loaded
if(typeof $ == "undefined") var $ = {};
//Start Main Object $.Ape
$.Ape = {
	user: {},
	opts: {},
	ch: {},
	debug: true,
	session: false,
	activeChannel: "",
	isReady: false,
	fn: {},
	newCh: function(name,pipe) {
		this.name = name;
		this.isReady = typeof pipe == "object" ? true : false;
		this.pipe = pipe;
		this.pub = $.Ape.pub;
		this.unSub = $.Ape.unSub;
		this.when = $.Ape.when;
		this.call = $.Ape.call;
		this.fn = {};//new $.Ape.fnPack();
		this.users = function(){
			var ret = [];			
			for(var pubid in this.pipe.users){
				if(pubid.length == 32){
					ret.push(new $.Ape.newUsr(pubid));				
				}
			}
			
			return ret;
		}
	},
	newUsr: function(pubid){
		var pipe = $.Ape.client.core.getPipe(pubid);		
		
		for(var name in pipe.properties){
			this[name] = pipe.properties[name];
		}
		
		this.pubid = pubid;
		this.pipe = pipe;
		this.fn = {};
		this.when = $.Ape.when;
		this.call = $.Ape.call;
		
		this.pub = function(msg){
			this.pipe.send(msg);
		};
		
		return this;
	},
	//Starts the ape
	ready: function(callback){
		//Exit and callback() if started
		if(this.isReady){
			callback();
			return false;
		};		
		
		//Add Files to APE loader
		//Load Defaults escripts to ape
		if($.Ape.debug){
			//Load uncompress files
			(function(){
				for (var i = 0; i < arguments.length; i++)
					APE.Config.scripts.push(APE.Config.baseUrl + '/Source/' + arguments[i] + '.js');
			})('mootools-core', 'Core/APE', 'Core/Events', 'Core/Core', 'Pipe/Pipe', 'Pipe/PipeProxy', 'Pipe/PipeMulti', 'Pipe/PipeSingle', 'Request/Request','Request/Request.Stack', 'Request/Request.CycledStack', 'Transport/Transport.longPolling','Transport/Transport.SSE', 'Transport/Transport.XHRStreaming', 'Transport/Transport.JSONP', 'Core/Utility', 'Core/JSON');
			if($.Ape.session) APE.Config.scripts.push(APE.Config.baseUrl + "/Source/Core/Session.js");
			
			APE.Config.scripts.push(APE.Config.baseUrl + "/Plugins/Debug.js");

		}else{
			//Load Compressed files
			if($.Ape.session){
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
		
		//Load functions Pack
		//$.Ape.fn = new $.Ape.fnPack();
		
		//Bad Session
		client.onError("004", function(){
			debug("BAD SESSION");
			debug("Reconnecting to server");
			
			if(typeof $.Ape.reconnect == "undefined") $.Ape.reconnect = 0;
			
			$.Ape.reconnect++
			
			if($.Ape.reconnect > 3){
				debug("Could not reconnect to APE server");
				return;
			}
			
			$.Ape.ready(callback)
		});
		
		//Live RAW updater - sync
		client.addEvent("onRaw", function(info){
			//Sync channel properties
			if(typeof info.data.pipe != "undefined" && info.data.pipe.casttype == "multi"){
				var obj = info.data.pipe;
				var chanName = obj.properties.name;
				
				for(var name in obj.properties){
					$.Ape.channel(chanName)[name] = obj.properties[name];
				}
				
				//Trigger user count
				$.Ape.ch[chanName].call("onUserCount", parseInt($.Ape.channel(chanName).userCount));
			}			
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
				client.core.start({user: $.Ape.user, opts: $.Ape.opts});
			}
		})		
		
		//When connected to server
		client.addEvent('ready',function(){
			$.Ape.isReady = true;			
			
			debug('Your client is now connected');				
			
			//When user joins a Channel
			client.addEvent("multiPipeCreate",function(pipe, options){
				debug(options);
				debug("Importing user properties from server");				
				$.Ape.user = new $.Ape.newUsr($.Ape.client.core.user.pubid);
				
								
				var chanName = pipe.name;
				$.Ape.activeChannel = chanName;
				
				//Map event on pipe => onMessage
				pipe.onRaw("data", function(raw){
					var info = {};
					
					info.from = raw.data.from.properties;
					info.from.pubid = raw.data.from.pubid;
					
					info.channel = raw.data.pipe.properties;
					info.channel.pubid = raw.data.pipe.pubid;
					
					$.Ape.ch[chanName].call("onMessage",unescape(raw.data.msg),info);
				});
				
				//Avoids spam of onJoin events
				var delay = function(){			
					pipe.onRaw("join", function(raw){
						var user, pipe;
						user = raw.data.user;
						pipe = raw.data.pipe;
						
						var u = user.properties || {};
						u.pubid = user.pubid;
						
						$.Ape.ch[chanName].call("onJoin", u, pipe);
						//Trigger user count
						$.Ape.ch[chanName].call("onUserCount", parseInt(pipe.properties.userCount));
					});
				}
				
				//Avoids spam of onJoin events
				setTimeout(delay,500);
				
				//When a user leaves the channel
				pipe.onRaw("left", function(raw){
					var user, pipe;
					user = raw.data.user;
					pipe = raw.data.pipe;
					
					var u = user.properties || {};
					
					u.pubid = user.pubid;
					
					$.Ape.ch[chanName].call("onLeft", u, pipe);
					//Trigger user count
					$.Ape.ch[chanName].call("onUserCount", parseInt(pipe.properties.userCount));
				});
				
				if(typeof $.Ape.ch[chanName] == "undefined"){
					$.Ape.ch[chanName] = new $.Ape.newCh(chanName,pipe);
					debug("["+chanName+"]>> CREATING newCh()");
				}else{
					
					$.Ape.ch[chanName].isReady = true;
					$.Ape.ch[chanName].pipe = pipe;
				}
				
				debug("Importing the channel ("+chanName+") properties from server");
				for(var name in pipe.properties){
					$.Ape.ch[chanName][name] = pipe.properties[name];
				}
				
				debug("Joined channel" + "("+chanName+")");
				
				//Call the joined event
				$.Ape.ch[chanName].call("joined", $.Ape.channel(chanName));
				//Trigger user count
				$.Ape.ch[chanName].call("onUserCount", parseInt(pipe.properties.userCount));
				
			})//END of user join
			
			//Handle errors
			client.onRaw("ERR", function(raw){
				debug("Error["+raw.data.code+"]: "+raw.data.value);
				//Custom error function
				$.Ape.call("onError",raw.data);
			});
			
			//call the Callback function if is not a session restore
			if(!client.core.options.restore) callback();
		})
		
		this.client = client;
		
		return true;
	},
	
	//Subscribe user to channel	
	sub: function(chanName, callback){
		
		if(!this.isReady){
			this.ready(function(){
				$.Ape.sub(chanName, callback);
			})
			return;
		}
			
		if(typeof chanName != "object"){
			var channel = Array(chanName);
		}else{
			var channel = chanName.slice();
		}
		
		//Handles multiple Channels
		for(var ch in channel){
			var curChan = channel[ch];
			
			this.activeChannel = channel[ch];
			
			if(typeof this.ch[curChan] != "undefined" && this.ch[curChan].isReady){
				debug("Already on (" + curChan +")");
				
				if(typeof callback == "function"){
					//add joined callback function
					$.Ape.ch[curChan].when("joined",callback);				
				}else if(typeof callback == "object"){
					//add all events
					for(var i in callback){
						$.Ape.ch[curChan].when(i,callback[i]);
					}
				}
				
				//Call joined event
				$.Ape.ch[curChan].call("joined", new $.Ape.channel(curChan));
				//Trigger user count
				$.Ape.ch[curChan].call("onUserCount", parseInt($.Ape.channel(curChan).userCount));
				return this;
			}
			
			//create channel in $.Ape
			$.Ape.ch[curChan] = new $.Ape.newCh(curChan);
			
			if(typeof callback == "function"){
				$.Ape.ch[curChan].when("joined",callback);				
			}else if(typeof callback == "object"){
				for(var i in callback){
					$.Ape.ch[curChan].when(i,callback[i]);
				}
			}
		}
		
		//Set to First Channel
		this.activeChannel = channel[0];
							
		this.client.core.join(channel);
		return this;
	},
	
	//Unsubscribe from a channel
	unSub: function(){
		var channel = this.activeChannel || this.name;
		
		debug(channel);
		if(channel == "") return;
		
		this.activeChannel = "";
		
		$.Ape.channel(channel).pipe.left();
		
		delete $.Ape.ch[channel];
		
		debug("Unsubscribed from ("+channel+")");
	},
	
	//Send Message throught channel
	pub: function(msg,channel){
		if(typeof channel == "undefined"){
			var channel = this.activeChannel || this.name;
		}
		
		if(!channel){
			debug("NOT IN A CHANNEL",true);
			return;
		};		
		
		$.Ape.ch[channel].pipe.send(msg);
		
	},
	
	//Select and return a channel object
	channel: function(channel){
		//debug(typeof $.Ape.ch[channel]);
		if(typeof $.Ape.ch[channel] == "object" && $.Ape.ch[channel].isReady){
			$.Ape.activeChannel = channel;
			
			//Return the channel object
			return $.Ape.ch[channel];
		}
		return false
	},
	
	//Add an event to current object
	when: function(e,callback){
		var channel = this.activeChannel || this.name || this.username;
		var isApe = typeof this.client;		
		
		//debug(isApe);
		
		if(isApe == "object"){
			debug("Adding Event ["+e+"] to $.Ape");
			$.Ape.fn[e] = callback;
		}else{
			debug("Adding Event ["+e+"] to channel ("+channel+")");
			//$.Ape.ch[channel].fn[e] = callback;			
			this.fn[e] = callback;			
		}		
		
		return this;
	},
	
	//Trigger custom events on channels
	call: function(fnName, opt, extra){
		var channel = this.activeChannel || this.name;
		
		//Global Function
		//Check that Function exists
		if(typeof $.Ape.fn[fnName] == "function"){
			debug("Calling Global ["+fnName+"] in reference to channel ("+channel+")->["+fnName+"]");			
			$.Ape.fn[fnName](opt, extra, channel);
		}else{
			debug("No Global ["+fnName+"] on $.Ape");
		}
		
		//Channel specific function
		//Check that Function exists
		if(typeof $.Ape.ch[channel].fn[fnName] == "function"){
			debug("Calling ["+fnName+"] on channel ("+channel+")");
			$.Ape.ch[channel].fn[fnName](opt, extra, channel);
		}else{
			debug("No ["+fnName+"] on channel ("+channel+")");			
		}
		
		return this;
	}
}




//Work around to global event functions
//$.Ape.fn = new $.Ape.fnPack();
$.Ape.client = {};
///////////////////////

//Debug Function for Browsers console
function debug($obj){
	if(!$.Ape.debug) return;
	
    var pre = "-->>";
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
