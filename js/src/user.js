/*
 * User object constructor
 */
APS.User = function(pipe, client){
	Object.defineProperties(this, {
	
		/*
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are different. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes 
		 */
		_update: {
			value: function(o, force){
				if(!!!o) return false;

				if(!!!force)
					o._rev = parseInt(o._rev);

				if(o._rev > this._rev || !!force){
					for(var i in o){
						if(this[i] != o[i]){
							this[i] = o[i];
							client.trigger("user"+i+"Update",[o[i], this]);
							client.trigger("userUpdate",[i, o[i], this]);
						}
					}
				}
			}
		},
		
		/*
		 * Add the more critical properties which other
		 * methods and the framework itself depend on
		 */
		_rev: {
			value: null,
			configurable: true,
			writable: true
		},
		channels: {
			value: {},
			writable: true
		},
		pubid: {
			value: pipe.pubid
		},
		
		/*
		 * Bind event and logging related functions straight from the client,
		 * effectively saving a whole lot of code :)
		 */
		pub: {
			value: client.pub.bind(client, pipe.pubid)
		},
		publish: {
			value: client.pub.bind(client, pipe.pubid)
		},
		send: {
			value: client.send.bind(client, pipe.pubid)
		}
	});
	
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
}

/*
 * Current user object constructor
 */
APS.CUser = function(pipe, client){
	Object.defineProperties(this, {
	
		/*
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are different. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes 
		 */
		_update: {
			value: function(o, force){
				if(!!!o) return false;

				if(!!!force)
					o._rev = parseInt(o._rev);

				if(o._rev > this._rev || !!force){
					for(var i in o){
						if(this[i] != o[i]){
							this[i] = o[i];
							this.trigger("user"+i+"Update",[o[i], this]);
							this.trigger("userUpdate",[i, o[i], this]);
						}
					}
				}
			}
		},
		
		/*
		 * Change or update a property in the object and send it to the
		 * server for propagation. In order for this method to work 
		 * properly the option autoUpdate should enable
		 */
		update: {
			value: function(name, value){
				if(typeof name == "object"){
					var data = name;
				}else{
					var data = {};
					data[name] = value;
				}
				//NOTE: data has no revision number thus update will fail
				this._update(data,true);
				this._client.sendCmd("userPropUpdate", data);
			}
		},
	
	
		/*
		 * Add the more critical properties which other
		 * methods and the framework itself depend on
		 */
		_rev: {
			value: null,
			configurable: true,
			writable: true
		},
		_events: {
			value: {},
			writable: true
		},
		_client: {
			value: client
		},
		pubid: {
			value: pipe.pubid
		},
		channels: {
			value: {},
			writable: true
		},
		
		/*
		 * Bind event and logging related functions straight from the client,
		 * effectively saving a whole lot of code :)
		 */
		on: {
			value: client.on.bind(this)
		},
		trigger: {
			value: client.trigger.bind(this)
		},
		log: {
			value: client.log.bind(client, "[CurrentUser]")
		}
	});
	
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
}
