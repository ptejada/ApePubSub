/*
 * Channel object construtor
 */
APS.channel = function(pipe, client) {
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	/*
	 * Add the more critical properties on which other
	 * methods and the framework itself depends on
	 */
	this._events = {};
	this.pubid = pipe.pubid;
	this._client = client;
	
	/*
	 * Update function to update properties object
	 * This function is used internally to update objects
	 * when the autoUpdate option is enabled. The function
	 * checks for a revision number in the object. Properties
	 * are only updated if they are differnt. This method triggers
	 * properties specific events which can be ise observe/watch
	 * property changes 
	 */
	this.update = function(o){
		if(o._rev > this._rev){
			for(var i in o){
				if(this[i] != o[i]){
					this[i] = o[i];
					this.trigger("channel"+i+"Update",[o[i], this]);
					this.trigger("channelUpdate",[i, o[i], this]);
				}
			}
		}
	}
	
	/*
	 * The function makes a user exit/unsubsribe from a channel
	 * no paramaters are required for this method
	 */
	this.leave = function(){
		this.trigger("unsub", [client.user, this]);
		
		client.sendCmd('LEFT', {"channel": this.name});
		
		this.log("Unsubscribed");
		
		delete client.channels[this.name];
	
		//Delete the Event Queue in case the channel is created again
		delete client.eQueue[this.name];
	}
	
	/*
	 * The following block filters some methods that only apply
	 * to interactive channels. All channels are consider interactive
	 * but the ones which name's starts with the asterisk(*) character
	 */
	if(this.name.indexOf("*") !== 0){
		//Methods and prop for interactive channels
		this.users = {};
		this.addUser = function(u){
			var user = client.getPipe[u.pubid];
			if(!user){
				/*
				 * User object does not exists in the client
				 * Initiate user object and store it
				 */
				client.pipes[u.pubid] = new APS.user(u, client);
				user = client.pipes[u.pubid];
				
				//Add user's own pipe to channels list
				user.channels[user.pubid] = user;
			}else{
				/*
				 * User object exists
				 * Update object if autoUpdate is enabled
				 */
				if(client.option.autoUpdate)
					user.update(u.properties);
			}
			
			//Add channel reference to the user
			user.channels[this.name] = this;
			
			this.users[u.pubid] = user;
			return user;
		}
		this.send = APS.prototype.send.bind(client, this.pubid);
		this.pub = client.pub.bind(client, this.name);
	}
	
	/*
	 * Bind event and logging related functions stragiht from the client,
	 * effectively saving a whole lot of code :)
	 */
	this.on = client.on.bind(this);
	this.trigger = client.trigger.bind(this);
	this.log = client.log.bind(client, "[channel]", "["+this.name+"]");
}
