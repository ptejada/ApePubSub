/**
 * @author Pablo
 */

//-------ApePubSub Starts--------//

APE.PubSub = {
	user: {},
	opts: {},
	channels: {},
	client: {},
	debug: true,
	session: false,
	isReady: false,
	hooks: {}
};
	
//Starts the ape
function APE_start(callback){
	//Exit and callback() if started
	if(this.isReady){
		callback();
		return false;
	};
	
	//Add Files to APE loader
	//Load Defaults escripts to ape
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
		
		if(typeof APE.PubSub.reconnect == "undefined") APE.PubSub.reconnect = 0;
		
		APE.PubSub.reconnect++
		
		if(APE.PubSub.reconnect > 1){
			debug("Could not reconnect to APE server");
			return;
		}
		
		APE.PubSub.start(callback)
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
			client.core.start({user: APE.PubSub.user, opts: APE.PubSub.opts});
		}
	})		
	
	//When connected to server
	client.addEvent('ready',function(){
		APE.PubSub.isReady = true;
		
		debug('Your client is now connected');
		
		//When user joins a Channel
		client.addEvent("multiPipeCreate",function(pipe, options){
			
			debug("Importing user properties from server");
			for(var name in APE.PubSub.client.core.user.properties){
				APE.PubSub.user[name] = APE.PubSub.client.core.user.properties[name];
			}
			APE.PubSub.user.pubid = APE.PubSub.client.core.user.pubid;
			
			var chanName = pipe.name;
			APE.PubSub.activeChannel = chanName;
			
			//Map event on pipe => onMessage
			pipe.onRaw("data", function(raw){
				var info = {};
				
				info.from = raw.data.from.properties;
				info.from.pubid = raw.data.from.pubid;
				
				info.channel = raw.data.pipe.properties;
				info.channel.pubid = raw.data.pipe.pubid;
				
				APE.PubSub.ch[chanName].call("onMessage",unescape(raw.data.msg),info);
			});
			
			//Avoids spam of onJoin events
			var delay = function(){
				pipe.addEvent("userJoin", function(user, pipe){
					var u = user.properties;
					u.pubid = user.pubid;
					
					APE.PubSub.ch[chanName].call("onJoin", u, pipe);
				});
			}
			
			//Avoids spam of onJoin events
			setTimeout(delay,500);
			
			pipe.addEvent("userLeft", function(user, pipe){
				var u = user.properties;
				u.pubid = user.pubid;
				
				APE.PubSub.ch[chanName].call("onLeft", u, pipe);
			});
			
			if(typeof APE.PubSub.ch[chanName] == "undefined"){
				APE.PubSub.ch[chanName] = new APE.PubSub.newCh(chanName,pipe);
				debug("["+chanName+"]>> CREATING newCh()");
			}else{
				
				APE.PubSub.ch[chanName].isReady = true;
				APE.PubSub.ch[chanName].pipe = pipe;
			}
			
			
			debug("Joined channel" + "("+chanName+")");
			
			//Call the joined event
			APE.PubSub.ch[chanName].call("joined", new APE.PubSub.channel(chanName));
			
			
		})
		
		//Handle errors
		client.onRaw("ERR", function(raw){
			debug("Error["+raw.data.code+"]: "+raw.data.value);
			//Custom error function
			APE.PubSub.call("onError",raw.data);
		});
		
		//call the Callback function if is not a session restore
		if(!client.core.options.restore) callback();
	})
	
	this.client = client;
	
	return true;
); APE_start(APE.PubSub);

//Subscribe user to channel
function Sub(chanName, callback){
		
	if(!this.isReady){
		this.start(function(){
			Sub(chanName, callback);
		})
		return;
	}
		
	if(typeof chanName != "object"){
		var channel = Array(chanName);
	}else{
		var channel = chanName.slice();
	}(APE.PubSub);
	
	this.client.core.join(channel);
	return this;
}; Sub(APE.PubSub);

//Unsubscribe from a channel
function unSub(channel){
	debug(channel);
	if(channel == "") return;
	
	APE.PubSub.channel(channel).pipe.left();
	
	delete APE.PubSub.ch[channel];
	
	debug("Unsubscribed from ("+channel+")");
}; unSub(APE.PubSub);

//Send Message throught channel
function Pub(channel, data){
	if(typeof channel == "undefined"){
		var channel = this.activeChannel || this.name;
	}
	
	if(!channel){
		debug("NOT IN A CHANNEL",true);
		return;
	};
	debug("Sending \"" + data + "\" through [" +channel+ "]");
	APE.PubSub.ch[channel].pipe.send(data);
}; Pub(APE.PubSub);


//Debug Function for Browsers console
function debug($obj){
	if(!APE.PubSub.debug) return;
	
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
