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

	/*
     * Send the session information only if it has content
     * TODO: When the the bug of the subuser is fixed send raw only to subuser
	 */
	if ( Object.keys(info.user.sessionData).length !== 0)
	{
		info.user.pipe.sendRaw('SESSION_UPDATE', info.user.sessionData);
	}
	return 1;
});