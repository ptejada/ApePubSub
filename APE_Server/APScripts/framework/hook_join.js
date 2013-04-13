Ape.registerHookCmd("JOIN", function(params, cmd){
	
	if(typeof params.channels == "object"){
		for(var i in params.channels){
			var channel = Ape.getChannelByName(params.channels[i]);
			
			if(!channel){
				/*
				 * Channel has not been created yet
				 * create a dummy object to succesfully
				 * trigger the beforejoin event
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
				 * An event handeler has determine user can't join the channel
				 * Let the client knows use can't one of the channels it requested
				 */
				cmd.sendResponse("NOJOIN", params);
				return -2; //Cancel the JOIN command
			}
		}
	}
	
	return 1;
});