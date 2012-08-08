APS.prototype.onMessage = function(data, push){
	//var data = data;
	try { 
		data = JSON.parse(data)
	}catch(e){
		this.log("JSON", e, data);
		this.trigger("dead", [e]);
		return this.transport.close();
	}
	
	var cmd, args, pipe;
	var check = true;
	
	//Clear the timeout;
	clearTimeout(this.poller);
	
	for(var i in data){
		cmd = data[i].raw;
		args = data[i].data;
		pipe = null;
		
		this.log('>>>> ', cmd , " <<<< ", args);

		switch(cmd){
			case 'LOGIN':
				check = false;
				
				this.state = this.state == 0 ? 1 : this.state;
				this.session.id = args.sessid;
				//this.poll();
				this.session.save();
			break;
			case 'IDENT':
				check = false;
				
				var user = new APS.user(args.user, this);
				this.pipes[user.pubid] = user;
				
				user.events = {};
				user.client = this;
				user.on = this.on.bind(user);
				user.trigger = this.trigger.bind(user);
				user.log = this.log.bind(this, "[user]");
				
				this.user = user;
				
				if(this.state == 1)
					this.trigger('ready');
				
				//this.poll(); //This call is under observation
			break;
			case 'RESTORED':
				check = true;
				//Session restored completed
				this.state = 1;
				if(this.trigger('restored') !== false)
					this.trigger('ready');
			break;
			case 'CHANNEL':
				//this.log(pipe, args);
				pipe = new APS.channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				var user;
				
				//import users from channel to client
				for(var i = 0; i < u.length; i++){
					user = this.pipes[u[i].pubid]
					if(!user){
						user = new APS.user(u[i], this);
						this.pipes[user.pubid] = user;
					}
					
					user.channels[pipe.name] = pipe;
					pipe.users[user.pubid] = user;
					
					//Add user's own pipe to channels list
					user.channels[user.pubid] = user;

					//No Need to trigger this event
					//this.trigger('join', [user, pipe]);
				}
				
				//Add events from queue
				var chanName = pipe.name.toLowerCase();
				if(typeof this.eQueue[chanName] == "object"){
					var queue = this.eQueue[chanName];
					var ev, fn;
					for(var i in queue){
						ev = queue[i][0];
						fn = queue[i][1];
						
						pipe.on(ev,fn);
					}
				}
				
				pipe.trigger('joined',[this.user, pipe]);
				this.trigger('newChannel', [pipe]);
				
			break;
			case "EVENT":
				var user = this.pipes[args.from.pubid];
				pipe = this.pipes[args.pipe.pubid];
				
				if(pipe instanceof APS.user)
					pipe = this.user;
				
				pipe.trigger(args.event, [args.data, user, pipe]);
			break;
			case 'JOIN':
				var user = this.pipes[args.user.pubid];
				pipe = this.pipes[args.pipe.pubid];

				if(!user){
					user = new APS.user(args.user, this);
					this.pipes[user.pubid] = user;
				}
				
				//Add user's own pipe to channels list
				user.channels[pipe.pubid] = user;
				
				//Add user to channel list
				pipe.addUser(user);
				
				pipe.trigger('join', [user, pipe]);
			break;
			case 'LEFT':
				pipe = this.pipes[args.pipe.pubid];
				var user = this.pipes[args.user.pubid];
				
				delete user.channels[pipe.pubid];
				
				for(var i in user.channels){
					if(user.channels.hasOwnProperty(i)) delete this.pipes[user.pubid];
					break;
				}
				
				pipe.trigger('left', [user, pipe]);
			break;
			case 'ERR' :
				check = false;
				switch(args.code){
					case "001":
					case "002":
					case "003":
						clearTimeout(this.poller);
						this.trigger("dead", args);
						break;
					case "004":
					case "250":
						this.state = 0;
						if(this.option.session)
							this.session.connect();
						break;
					default:
						this.check();
				}
				this.trigger("error",args);
				this.trigger("error"+args.code,args);
			break;
			default:
				//trigger custom commands
				this.trigger(cmd, args);
				//this.check();
		}
	}
	
	if(check && this.transport.id == 0 && this.transport.state == 1){
		this.check();
	}
}
