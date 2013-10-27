/**
 * Channel object
 *
 * Creates a channel object, the constructor is meant to be used internally only
 *
 * @param {object} pipe The server pipe object
 * @param {APS} client The client instance for internal reference
 * @constructor
 * @memberOf module:Client~
 */
APS.Channel = function(pipe, client) {
	Object.defineProperties(this, {
		/**
		 * Internal channel updater method
		 *
		 * Update function to update properties object
		 * This function is used internally to update objects
		 * when the autoUpdate option is enabled. The function
		 * checks for a revision number in the object. Properties
		 * are only updated if they are different. This method triggers
		 * properties specific events which can be observe/watch
		 * property changes
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method _update
		 * @private
		 *
		 * @param {object} updates Value key paired of values to update the object
		 */
		_update: {
			value: function(updates){
				if ( !! updates )
				{
					updates._rev = parseInt(updates._rev);
					if(updates._rev > this._rev){
						for(var i in updates){
							if(this[i] != updates[i]){
								this[i] = updates[i];
								this.trigger("channel"+i+"Update",[updates[i], this]);
								this.trigger("channelUpdate",[i, updates[i], this]);
							}
						}
					}
				}
			}
		},
		/**
		 * Makes the current user leave the channel
		 *
		 * The function makes a user exit/unsubsribe from a channel
		 * no parameters are required for this method
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method leave
		 */
		leave: {
			value: function(){
				this.trigger("unsub", [client.user, this]);
				
				client.sendCmd('LEFT', {"channel": pipe.properties.name});
				
				this.log("Unsubscribed");
				
				delete client.channels[this.name];
			
				//Delete the Event Queue in case the channel is created again
				delete client.eQueue[this.name];
			}
		},
		
		/*
		 * Add the more critical properties which other
		 * methods and the framework itself depend on
		 */
		/**
		 * Holds the channel object revision number
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property _rev
		 * @type {number}
		 * @private
		 * @ignore
		 */
		_rev: {
			value: null,
			configurable: true,
			writable: true
		},
		/**
		 * Stack of all the channel events
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property _events
		 * @private
		 * @ignore
		 */
		_events: {
			value: {},
			writable: true
		},
		/**
		 * Stack of all the channel events
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property _events
		 * @type {APS}
		 * @private
		 * @ignore
		 */
		_client: {
			value: client
		},
		/**
		 * The unique channel publisher id hash
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property pubid
		 * @type {string}
		 * @private
		 */
		pubid: {
			value: pipe.pubid
		},

		/**
		 * Add event handler(s) to the channel
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method on
		 *
		 * @param {string} ev Name of the event handler to add, not case sensitive
		 * @param {function} fn Function to handle the event
		 *
		 * @return {bool|APS.Channel} False if wrong parameters are passed, otherwise the channel object
		 */
		on: {
			value: client.on.bind(this)
		},
		/**
		 * Trigger event handlers on the channel
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method trigger
		 * @see APS#trigger
		 */
		trigger: {
			value: client.trigger.bind(this)
		},
		/**
		 * Logs data to the console
		 * It is specified in the out from which channel the call originated from
		 * @memberOf module:Client~APS.Channel#
		 * @method log
		 * @see APS#log
		 */
		log: {
			value: client.log.bind(client, "[channel]", "["+pipe.properties.name+"]")
		}
	});
	
	/*
	 * Add all public properties to the root of the object
	 * for easy access
	 */
	for(var i in pipe.properties){
		this[i] = pipe.properties[i]
	}
	
	/*
	 * The following block filters some methods that only apply
	 * to interactive channels. All channels are consider interactive
	 * but the ones which name's starts with the asterisk(*) character
	 */
	if( this.name.indexOf("*") !== 0 )
	{
		Object.defineProperties(this, {
		//Methods and prop for interactive channels
		/**
		 * The collection of all users that are in the channel
		 *
		 * Every item in the collection is an instance of {@link APS.User}
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @property users
		 * @type {object}
		 */
		users: {
			value: {},
			writable: true
		},
		/**
		 * Adds a use the channel {@link APS.Channel#users} stack
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method addUser
		 * @private
		 */
		addUser: {
			value: function(u){
				var user = client.getPipe(u.pubid);
				if(!user){
					/*
					 * User object does not exists in the client
					 * Initiate user object and store it
					 */
					client.pipes[u.pubid] = new APS.User(u, client);
					user = client.pipes[u.pubid];
					
					//Add user's own pipe to channels list
					user.channels[user.pubid] = user;
				}else{
					/*
					 * User object exists
					 * Update object if autoUpdate is enabled
					 */
					if(client.option.autoUpdate)
						user._update(u.properties);
				}
				
				//Add channel reference to the user
				user.channels[this.name] = this;
				
				this.users[u.pubid] = user;
				return user;
			}
		},
		/**
		 * Sends an event with data to the channel
		 *
		 * @param {string} $event The name of the event to send
		 * @param {*} data The data to send with the event
		 * @param {bool} [sync=false] Weather to sync event across the user's session or not
		 * @param {function} [callback] Function to call after the event has been sent
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method send
		 *
		 * @return {APS.Channel}
		 */
		send: {
			value: client.send.bind(client, this.pubid)
		},
		/**
		 * Sends data to the channel
		 *
		 * The method determines which event to send to the channel,
		 * if the **data** is a string on integer a _message_ will be sent
		 * but if is an array of object than a _data_ event will be sent
		 *
		 * @param {*} data The data to send with the event
		 * @param {bool} [sync=false] Weather to sync event across the user's session or not
		 * @param {function} [callback] Function to call after the event has been sent
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method pub
		 *
		 * @return {APS.Channel}
		 */
		pub: {
			value: client.pub.bind(client, this.name)
		},
		/**
		 * Alias for {@link APS.Channel#pub}
		 *
		 * @memberOf module:Client~APS.Channel#
		 * @method publish
		 *
		 * @see APS.Channel#pub
		 */
		publish: {
		    value: client.pub.bind(client, this.name)
		}
		})
	}
	
}
