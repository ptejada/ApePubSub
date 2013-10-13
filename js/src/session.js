/*
 * Prototype in the session object
 * The object current multiple cookies
 * handlers to save session related data
 * as well as other persistent information
 * require by the framework.
 *
 * The session object currently uses cookies
 * to store the required information but in
 * the future i would like to implement the
 * SessionStorage API with a fallback to
 * cookies.
 */
APS.prototype.session = {
	_client: {},
	_data: {},
	store: {},

	init: function(client){
		this._client = client;
		this.store = new APS.Store(client.identifier + '_');
		client.chl = this.getChl() || 0;
	},

	/**
	 * Gets the current session ID
	 * @returns {*}
	 */
	getID: function(){
		return this.store.get('sid');
	},
	/**
	 * Get the current frequency number
	 * @returns {*}
	 */
	getFreq: function(){
		return this.store.get('freq');
	},
	/**
	 * Get the current frequency number
	 * @returns {*}
	 */
	getChl: function(){
		return this.store.get('chl');
	},

	/**
	 * Saves all the values required for persistent session
	 */
	save: function(id){
		if(!this._client.option.session) return;

		this.store.set('sid', id);
		this.saveChl();
	},

	/**
	 * Increments the challenge number by one and saves it
	 */

	saveChl: function(){
		if(!this._client.option.session) return;

		this._client.chl++;
		this.store.set('chl',this._client.chl);
	},

	/**
	 * Increments the frequency number by one and saves it
	 */
	saveFreq: function(){
		if(!this._client.option.session) return;

		var current = parseInt(this.store.get('freq') || 0);
		this.store.set('freq',++current);
	},

	/**
	 * Destroys the session and all its data/cookies
	 * @param Keepfreq Flag whether to keep the frequency cookie
	 */
	destroy: function(Keepfreq){
		if(!this._client.option.session) return;

		this.store.remove('sid');
		this.store.remove('chl');

		if(!Keepfreq)
			this.store.set('freq',0);

		this._data = {};
	},

	/**
	 * Get a value from the session
	 * @param key The key of the value to get
	 * @returns {*}
	 */
	get: function(key){
		return this._data[key];
	},

	/**
	 * Assign value to a session key
	 * @param key The value key, identifier
	 * @param val The value to store in session
	 */
	set: function(key, val){
		var obj = {};
		if ( typeof key == 'object' )
		{
			obj = key;
		}
		else
		{
			obj[key] = val;
		}
		this._client.sendCmd('SESSION_SET', obj);

		this._update(obj);
	},

	/**
	 * Used to updates the internal session storage cache _data
	 * @param updates
	 * @private
	 */
	_update: function(updates){
		for ( var key in updates)
		{
			this._data[key] = updates[key];
		}
	},

	/**
	 * Restores all the the necessary values from cookies to restore a session
	 * @returns {*}
	 */
	restore: function(){
		var client = this._client;
		
		//Initial frequency value
		if( ! this.store.get('freq') ) this.store.set('freq','0');

		var sid = this.store.get('sid');
		
		if(typeof sid != "string" || sid.length !== 32){
			return false;
		}
		
		//Restoring session state == 2
		client.state = 2;

		// return data
		return {sid: sid};
	}
}

/**
 * A persistent storage object
 * @param _prefix the store identifier
 * @constructor
 */
APS.Store = function(_prefix){
	if (typeof _prefix == 'undefined' )
	{
		_prefix = '';
	}

	if ( 'Storage' in window )
	{
		// Use the HTML5 storage

		/**
		 * Get a value from the store
		 * @param key The value key
		 * @returns {*}
		 */
		this.get = function(key){
			key = _prefix + key;
			return localStorage.getItem(key);
		}

		/**
		 * Set value to a store key
		 * @param key The value key
		 * @param value The key value
		 */
		this.set = function(key, value){
			key = _prefix + key;
			localStorage.setItem(key, value);
		}

		/**
		 * Removes a key and its value from the store
		 * @param key
		 */
		this.remove = function(key){
			key = _prefix + key;
			localStorage.removeItem(key);
		}
	}
	else
	{
		// Use cookies as a storage

		/**
		 * Get a value from the store
		 * @param key The value key
		 * @returns {*}
		 */
		this.get = function(key){
			key = _prefix + key;
			var nameEQ = key + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		}

		/**
		 * Set value to a store key
		 * @param key The value key
		 * @param value The key value
		 */
		this.set = function(key, value){
			key = _prefix + key;

			document.cookie = key+"="+value+"; path=/";

		}

		/**
		 * Removes a key and its value from the store
		 * @param key
		 */
		this.remove = function(key){
			key = _prefix + key;

			var date = new Date();
			date.setTime(date.getTime()-1);
			var expires = "; expires="+date.toGMTString();

			document.cookie = key+"= "+expires+"; path=/";
		}
	}
}