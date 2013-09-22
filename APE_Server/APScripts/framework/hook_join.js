Ape.registerHookCmd("JOIN", function(params, cmd){
	
	if(typeof params.channels == "object"){
		for(var i in params.channels){
			var channel = Ape.getChannelByName(params.channels[i]);
			
			if(!channel){
				/*
				 * Channel has not been created yet create a dummy object to
				 * successful trigger the beforejoin event
				 */
				channel = {
					name: params.channels[i],
					prop: function(){
						return this.name;
					}
				}
			}
			
			var res = Ape.triggerChannelEvent(channel, "beforeJoin", [params, cmd]);
			
			if(res === false){
				/*
				 * An event handler has determine the user can't join the channel
				 * Let the client know user can't join one of the channels it requested
				 * to join
				 */
				cmd.sendResponse("NOJOIN", params);
				return -2; //Cancel the JOIN command
			}
		}
	}
	
	return 1;
});