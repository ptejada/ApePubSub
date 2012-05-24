APE.prototype.onMessage = function(data){
	//var data = data;
	try { 
		data = JSON.parse(data)
	}catch(e){
		this.check();
	}
	
	var cmd, args, pipe;
	for(var i in data){
		cmd = data[i].raw;
		args = data[i].data;
		pipe = null;
		clearTimeout(this.poller);
		
		APE.log('>>>> ', cmd , " <<<< ", args);

		switch(cmd){
			case 'LOGIN':
				this.state = 1;
				this.user.sessid = this.session.id = args.sessid;
				this.trigger('ready');
				this.poll();
			break;
			case 'CHANNEL':
				pipe = new APE.channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				var user;
				
				//import users from channel to client
				for(var i = 0; i < u.length; i++){
					user = this.pipes[u[i].pubid]
					if(!user){
						user = new APE.user(u[i], this);
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
				if(pipe.name in this.events._queue){
					var queue = this.events._queue[pipe.name];
					var ev, fn;
					for(var i in queue){
						ev = queue[i][0];
						fn = queue[i][1];
						
						pipe.on(ev,fn);
					}
				}
				
				pipe.trigger('joined',this.user, pipe);
				this.trigger('newChannel', pipe);
				
			break;
			case "PUBDATA":
				var user = this.pipes[args.from.pubid];
				pipe = this.pipes[args.pipe.pubid];
				
				pipe.trigger(args.type, [args.content, user, pipe]);
			break;
			case 'JOIN':
				var user = this.pipes[args.user.pubid];
				pipe = this.pipes[args.pipe.pubid];

				if(!user){
					user = new APE.user(args.user, this);
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
			case 'IDENT':
				this.user = new APE.user(args.user, this);
				this.user.sessid = this.session.id;
				this.pipes[this.user.pubid] = this.user;
				
				this.session.save();
				
				//this.poll(); //This call is under observation
			break;
			case 'NOSESSION':
				this.session.destroy();
				this.session.connect();
				
			break;
			case 'ERR' :
				if(this.transport.id == 0 && cmd == 'ERR' &&(args.code > 100 || args.code == "001")){
					this.check();
				}else if(cmd == 'ERR' && args.code < 100){
					clearTimeout(this.poller);
					this.trigger("dead", args)
				}
				this.trigger("error",args);
				this.trigger("error"+args.code,args);
			break;
			default:
				//trigger custom commands
				this.trigger(cmd, [args, raw])
		}

		if(this.transport.id == 0 && cmd != 'ERR' && this.transport.state == 1){
			this.check();
		}
	}
}
