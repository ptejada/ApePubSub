APS.prototype.onMessage = function(data){
	try { 
		data = JSON.parse(data)
	}catch(e){
		//Temporary FIX for malformed JSON with scaped single quotes 
		data = data.replace(/\\'/g, "'");
		try {
			data = JSON.parse(data);
		}catch(e){
			e.type = "close";
			this.trigger("dead", [e]);
			return this.transport.close();
		}
	}
		
	var raw, args, pipe, check = true;
	
	for(var i in data){
		if(!data.hasOwnProperty(i)) continue;
		
		raw = data[i].raw;
		args = data[i].data;
		pipe = null;
		
		this.log('>>>> ', raw , " <<<< ", args);
		
		switch(raw){
			case 'LOGIN':
				check = false;
				
				this.state = this.state == 0 ? 1 : this.state;
				this.session.id = args.sessid;
				this.trigger("login", [args.sessid]);
				
			break;
			case 'IDENT':
				check = false;
				
				var user = new APS.cUser(args.user, this);
				this.pipes[user.pubid] = user;
				
				this.user = user;
				
				if(this.state == 1)
					this.trigger('ready');
				
				this.session.save();
				
			break;
			case 'RESTORED':
				if(this.state == 1){
					check = false;
					return;
				};
				check = true;
				//Session restored completed
				this.state = 1;
				if(this.trigger('restored') !== false)
					this.trigger('ready');
				
			break;
			case 'CHANNEL':
				pipe = new APS.channel(args.pipe, this);
				this.pipes[pipe.pubid] = pipe;
				this.channels[pipe.name] = pipe;
				
				var u = args.users;
				
				if(!!u){
					var user;
					//import users from channel to client if any
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
					}
				}
				
				//Add events from queue
				var chanName = pipe.name.toLowerCase();
				if(typeof this.eQueue[chanName] == "object"){
					var queue = this.eQueue[chanName];
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
				//Raw that synchronizes events accross multiple client instances
				var user = this.user;
				
				pipe = this.pipes[args.chanid];
				
				//Decode the message data string
				if(args.event == "message")
					args.data = decodeURIComponent(args.data);
				
				pipe.trigger(args.event, [args.data, user, pipe]);
				
			break;
			case "EVENT":
				var user = this.pipes[args.from.pubid];
				
				if(typeof user == "undefined" && !!args.from){
					//Create user it doesn't exists
					user = client.pipe[args.from.pubid] = new APS.user(args.from)
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
				var info = [args.code, args.value, args];
				
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
				var info = new Array();
				for(var i in args){
					if(!args.hasOwnProperty(i)) continue;
					info.push(args[i]);
				}
				this.trigger("raw"+raw, info);
		}
	}
	
	if(check && this.transport.id == 0 && this.transport.state == 1){
		this.check();
	}
}
