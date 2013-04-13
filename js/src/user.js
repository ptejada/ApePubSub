/*
 * User object constructor
 */
APS.user = function(pipe, client){
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	/*
	 * Add the more critical properties on which other
	 * methods depend and the framework itself depends on
	 */
	this.pubid = pipe.pubid;
	this.channels = {};
	
	/*
	 * Import event sending related function straight from the client
	 * object
	 */
	this.pub = APS.prototype.pub.bind(client, this.pubid);
	this.send = APS.prototype.send.bind(client, this.pubid);
	
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
		o._rev = parseInt(o._rev);
		if(o._rev > this._rev){
			for(var i in o){
				if(this[i] != o[i]){
					this[i] = o[i];
					client.trigger("user"+i+"Update", [o[i], this]);
					client.trigger("userUpdate",[i, o[i], this]);
				}
			}
		}
	}
}

/*
 * Current user object constructor
 */
APS.cUser = function(pipe, client){
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
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
		o._rev = parseInt(o._rev);
		if(o._rev > this._rev){
			for(var i in o){
				if(this[i] != o[i]){
					this[i] = o[i];
					this.trigger("user"+i+"Update",[o[i], this]);
					this.trigger("userUpdate",[i, o[i], this]);
				}
			}
		}
	}
	
	/*
	 * Change or upadte a property in the object and send it to the
	 * server for propagation. In order for this method to work 
	 * properly the option autoUpdate should enable
	 */
	this.change = function(name, value){
		if(typeof name == "object"){
			var data = name;
		}else{
			var data = {};
			data[name] = value;
		}
		//NOTE: data has no revision number thus update will fail
		//this.update(data);
		this._client.sendCmd("propUpdate", data);
	}
	
	/*
	 * Add the more critical properties on which other
	 * methods and the framework itself depend on
	 */
	this._events = {};
	this._client = client;
	this.pubid = pipe.pubid;
	this.channels = {};
	
	/*
	 * Bind event and logging related functions stragiht from the client,
	 * effectively saving a whole lot of code :)
	 */
	this.on = client.on.bind(this);
	this.trigger = client.trigger.bind(this);
	this.log = client.log.bind(client, "[CurrentUser]");
}
