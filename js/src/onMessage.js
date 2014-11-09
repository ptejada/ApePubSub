/*
 * The function parses all incoming information from the server.
 * Is the magical function, it takes the raw information 
 * and convert into useful dynamic data and objects. It is
 * also responsible for triggering most of the events in the
 * framework
 */
APS.prototype.onMessage = function(data){
	try {
		data = JSON.parse(data)
	}catch(e){
		//Temporary FIX for malformed JSON with escape single quotes
		data = data.replace(/\\'/g, "'");
		try {
			data = JSON.parse(data);
		}catch(e){
			e.type = "close";
			this.trigger("dead", [e]);
			return this.transport.close();
		}
	}
	
	//Initiate variables to be used in the loop below
	var raw, args, pipe, info, isIdent = false, check = true;
	
	for(var i in data){
		if(!data.hasOwnProperty(i)) continue;
		
		//Assign RAW paramenters to the variable for easy access
		raw = data[i].raw;
		args = data[i].data;
		pipe = null;
		
		//Log the name of the incoming RAW
		this.log('>>>> ', raw , " <<<< ", args);
		
		/*
		 * Filter the actions to be taking according to the 
		 * type of RAW recived
		 */
		switch(raw){
			case 'LOGIN':
				check = false;
				
				/*
				 * User has logged in the server
				 * Store its session ID
				 */
				this.state = this.state == 0 ? 1 : this.state;
				this.session.save(args.sessid);
				this.trigger("login", [args.sessid]);
				
			break;
			case 'IDENT':
				check = false;
				isIdent = true; //Flag to trigger the restored event
				
				/*
				 * Following the LOGIN raw this raw brings the user
				 * object and all its properties
				 * 
				 * Initiate and store the current user object
				 */
				var user = new APS.CUser(args.user, this);
				this.pipes[user.pubid] = user;
				
				this.user = user;
				
				/*
				 * Trigger the ready event only if the state of the
				 * client is 1 -> connected
				 */
				if(this.state == 1)
					this.trigger('ready');

			break;
			case 'CHANNEL':
				//The pipe is the channel object
				pipe = new APS.Channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				
				/*
				 * Below, the user objects of the channels subscribers
				 * get initiated and stored in the channel object, as
				 * well as in the client general pipes array
				 */
				if(!!u){
					//import users from channel to client if any
					for(var i = 0; i < u.length; i++){
						user = pipe.addUser(u[i]);
					}
				}
				
				//Add events to channel from queue
				var name = pipe.name.toLowerCase();
				if(typeof this.eQueue[name] == "object"){
					var queue = this.eQueue[name];
					var ev, fn;
					for(var i in queue){
						if(!queue.hasOwnProperty(i)) continue;
						ev = queue[i][0];
						fn = queue[i][1];
						
						pipe.on(ev,fn);
					}
				}
				
				pipe.trigger('joined',[this.user, pipe]);
				this.trigger('newChannel', [pipe]);
				
			break;
			case "SYNC":
				/*
				 * Synchronizes events across multiple client instances
				 */
				user = this.user;
				
				pipe = this.pipes[args.chanid];
				
				//Decode the message data string
				if(args.event == "message")
					args.data = decodeURIComponent(args.data);
				
				if(pipe instanceof APS.User){
					user.trigger(args.event, [args.data, user, pipe]);
				}else{
					pipe.trigger(args.event, [args.data, user, pipe]);
				}
				
			break;
			case "EVENT-X":
				/*
				 * Handle events without a sender, recipient and sender
				 * will be same in this case of events
				 */
				pipe = this.pipes[args.pipe.pubid];
				
				//Trigger event on target
				pipe.trigger(args.event, [args.data, pipe, pipe]);
				
			break;
			case "EVENT":
				/*
				 * Parses and triggers an incoming Event
				 */
				user = this.pipes[args.from.pubid];

				if(typeof user == "undefined" && !!args.from){
					//Create user it doesn't exists
					this.pipes[args.from.pubid] = new APS.User(args.from, this);
					user = this.pipes[args.from.pubid];
				}
				
				pipe = this.pipes[args.pipe.pubid];
				
				if(pipe.pubid == user.pubid){
					pipe = this.user;
				}
				
				//Decode the message data string
				if(args.event == "message")
					args.data = decodeURIComponent(args.data);
				
				//Trigger event on target
				pipe.trigger(args.event, [args.data, user, pipe]);
				
			break;
			case "NOJOIN":
				this.trigger("notjoined", [args])
			break;
			case 'JOIN':
				/*
				 * A new user has join a channel
				 * Parse the raw and trigger the corresponding
				 * events
				 */
				//pipe is the channel object
				pipe = this.pipes[args.pipe.pubid];
				//Add user to channel list
				user = pipe.addUser(args.user);
				
				pipe.trigger('join', [user, pipe]);
				
			break;
			case 'LEFT':
				/*
				 * A user as left a channel
				 * Parse event to trigger the corresponding events
				 * and delete the user references from channel but
				 * keep user object in the client in case is being 
				 * use by another channel
				 */
				pipe = this.pipes[args.pipe.pubid];
				user = this.pipes[args.user.pubid];
				
				delete pipe.users[args.user.pubid];
				
				pipe.trigger('left', [user, pipe]);
				
			break;
			case "UPDATE":

				if(this.option.autoUpdate){
					pipe = this.pipes[args.pipe.pubid];
					pipe._update(args.pipe.properties);
				}

			break;
			case "SESSION_UPDATE":

				this.session._update(args);

			break;
			case 'CLOSE':
				/*
				 * Required by the longPolling protocol to avoid
				 * a racing effect with AJax requests
				 */
				check = false
			break;
			case 'ERR' :
				/*
				 * Parses default server errors,
				 * Handle them and trigger the API
				 * friendly events
				 */
				check = false;
				info = [args.code, args.value, args];
				
				switch(args.code){
					case "001":
					case "002":
					case "003":
						clearTimeout(this.poller);
						this.trigger("dead", info);
						break;
					case "004":
					case "250":
						this.state = 0;
						this.session.destroy(true);
						
						if(this.option.session){
							this.reconnect();
						}
						break;
					default:
						this.check();
				}
				this.trigger("error", info);
				this.trigger("error"+args.code, info);
				
			break;
			default:
				//trigger custom raws
				info = [];
				for(var i in args){
					if(!args.hasOwnProperty(i)) continue;
					info.push(args[i]);
				}
				this.trigger("raw"+raw, info);
		}
	}
	
	/*
	 * Handle The Session restored
	 * callback event triggers
	 */
	if(isIdent && this.state != 1){
		check = true;
		
		//Session restored completed
		this.state = 1;
		if(this.trigger('restored') !== false)
			this.trigger('ready');
	}
	
	/*
	 * Conditionally called the check() method for the long polling method
	 */
	if(this.transport.id == 0 && check && this.transport.state == 1){
		this.check();
	}
}
