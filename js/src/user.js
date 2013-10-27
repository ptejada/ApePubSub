/**
 * The user object constructor
 * @param {object} pipe - The pip object as sent by the server
 * @param {APS} client - Instance of the client for internal reference
 * @constructor
 * @memberOf module:Client~
 */
APS.User = function(pipe, client){
	Object.defineProperties(this, {
	
		/**
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are different. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes 
		 *
		 * @memberOf module:Client~APS.User#
		 * @method _update
		 * @private
		 *
		 * @param {object} updates - Value key paired of values to update the object
		 */
		_update: {
			value: function(updates){
				if( !! updates)
				{
					updates._rev = parseInt(updates._rev);
					if(updates._rev > this._rev){
						for(var i in updates){
							if(this[i] != updates[i]){
								this[i] = updates[i];
								client.trigger("user"+i+"Update",[updates[i], this]);
								client.trigger("userUpdate",[i, updates[i], this]);
							}
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
		/**
		 * The user publisher id
		 * Note this property is not enumerable.
		 *
		 * @memberOf module:Client~APS.User#
		 * @property pubid
		 */
		pubid: {
			value: pipe.pubid
		},
		
		/*
		 * Bind event and logging related functions straight from the client,
		 * effectively saving a whole lot of code :)
		 */
		/**
		 * Publishes/sends anything to the user, a string, object, array or integer
		 *
		 * @param {*} data - Data to send to the channel
		 * @param {bool} sync - Whether to to synchronize the event across the user session
		 * @param {function} callback - Function called after the event is sent
		 *
		 * @memberOf module:Client~APS.User#
		 * @method pub
		 */
		pub: {
			value: client.pub.bind(client, pipe.pubid)
		},
		/**
		 * Alias for {@link APS.User#pub}
		 *
		 * @memberOf module:Client~APS.User#
		 * @method publish
		 * @see APS.User#pub
		 */
		publish: {
			value: client.pub.bind(client, pipe.pubid)
		},
		/**
		 * Sends a custom event to the user
		 *
		 * @memberOf module:Client~APS.User#
		 * @method send
		 *
		 * @param {string} $event -  The name of the event to send
		 * @param {*} data - The data to send with the event
		 * @param {bool} sync - Weather to sync event across the user's session or not
		 * @param {function} callback - Function to call after the event has been sent
		 *
		 * @return {APS} client or parent object reference
		 */
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

/**
 * The special current user object constructor
 * @param {object} pipe - The pip object as sent by the server
 * @param {APS} client - Instance of the client for internal reference
 * @constructor
 * @memberOf module:Client~
 */
APS.CUser = function(pipe, client){
	Object.defineProperties(this, {

		/**
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are different. This method triggers
		 * properties specific events which can be ise observe/watch
		 * property changes
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @method _update
		 * @private
		 *
		 * @param {object} updates - Value key paired of values to update the object
		 */
		_update: {
			value: function(updates, force){
				if( !! updates)
				{
					if ( !force )
						updates._rev = parseInt(updates._rev);

					if(updates._rev > this._rev || !!force){
						for(var i in updates){
							if(this[i] != updates[i]){
								this[i] = updates[i];
								this.trigger("user"+i+"Update",[updates[i], this]);
								this.trigger("userUpdate",[i, updates[i], this]);
							}
						}
					}
				}
			}
		},

		/**
		 * Change or update a property in the object and send it to the
		 * server for propagation. In order for this method to work
		 * properly the option {@link APS.option.autoUpdate} should be enabled
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @method update
		 *
		 * @param {string} name -  The name of the property to update
		 * @param {*} value - The data to set the property to
		 */
		update: {
			value: function(name, value){
				if(typeof name == "object"){
					var data = name;
				}else{
					var data = {};
					data[name] = value;
				}

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
		/**
		 * The user publisher id.
		 * Note this property is not enumerable.
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @property pubid
		 */
		pubid: {
			value: pipe.pubid
		},
		/**
		 * The channels the user is a member of, every item
		 * is an instance of {@link APS.Channel}.
		 * Note this property is not enumerable.
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @property channels
		 */
		channels: {
			value: {},
			writable: true
		},
		
		/*
		 * Bind event and logging related functions straight from the client,
		 * effectively saving a whole lot of code :)
		 */
		/**
		 * Add event handler(s) to the channel
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @method on
		 *
		 * @param {string} ev - Name of the event handler to add, not case sensitive
		 * @param {function} fn - Function to handle the event
		 *
		 * @return {bool|APS.CUser} False if wrong parameters are passed, otherwise the channel object
		 */
		on: {
			value: client.on.bind(this)
		},
		/**
		 * Trigger event handlers on the user
		 *
		 * @memberOf module:Client~APS.CUser#
		 * @method trigger
		 * @see APS#trigger
		 */
		trigger: {
			value: client.trigger.bind(this)
		},
		/**
		 * Logs data to the console
		 * It is specified in the out from the call originated from the current user object
		 * @memberOf module:Client~APS.CUser#
		 * @method log
		 * @see APS#log
		 */
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
