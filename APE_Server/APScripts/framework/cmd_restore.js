/*
 * Restore a user session
 */
Ape.registerCmd("RESTORE", true, function(params, info){
	/*
	 * Since this is the first request the Server will 
	 * automatically sent the user user IDENT and LOGIN raws
	 */

	/*
	 * Trigger the restored events on user's channels
	 */
	for(var name in info.user.channels){
		var channel = info.user.channels[name];
		Ape.triggerChannelEvent(channel, "restored", [info.user, channel]);
	}
	return 1;
});