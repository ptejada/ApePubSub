APS.prototype.onMessage = function(data){
	try { 
		data = JSON.parse(data)
	}catch(e){
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
			break;
			case 'IDENT':
				check = false;
				
				var user = new APS.cUser(args.user, this);
				this.pipes[user.pubid] = user;
				
				this.user = user;
				
				if(this.state == 1)
					this.trigger('ready');
				
				this.session.save();
				//this.poll(); //This call is under observation
			break;
			case 'RESTOREND':
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
						this.pipes[u[i].pubid] = new APS.user(u[i], this);
						user = this.pipes[u[i].pubid];
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
			case "SYNC":
				var user = this.user;
				
				pipe = pipe = this.pipes[args.chanid];
				
				pipe.trigger(args.event, [args.data, user, pipe]);
				//console.log(args.event, [args.data, user, pipe]);
			break;
			case "EVENT":
				var user = this.pipes[args.from.pubid];
				
				pipe = this.pipes[args.pipe.pubid];
				pipe.update(args.pipe.properties);
				
				pipe.trigger(args.event, [args.data, user, pipe]);
			break;
			case 'JOIN':
				var user = this.pipes[args.user.pubid];
				pipe = this.pipes[args.pipe.pubid];

				if(!user){
					this.pipes[args.user.pubid] = new APS.user(args.user, this);
					user = this.pipes[args.user.pubid];
				}
				
				//Add user's own pipe to channels list
				user.channels[args.user.pubid] = user;
				
				//Add user to channel list
				pipe.addUser(user);
				
				//Update channel
				pipe.update(args.pipe.properties);
				
				pipe.trigger('join', [user, pipe]);
			break;
			case 'LEFT':
				pipe = this.pipes[args.pipe.pubid];
				var user = this.pipes[args.user.pubid];
				
				delete pipe.users[args.user.pubid];
				
				//Update channel
				pipe.update(args.pipe.properties);
				
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
						this.session.destroy();
						
						if(this.option.session){
							this.reconnect();
						}
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
