/*
 * Restore a user session
 */
Ape.registerCmd("SESSION_SET", true, function(params, info){
	for ( var key in params )
	{
		info.user.sessionData[key] = params[key];

		/*
		 * Send alpha updates of the session to all other subusers but the one make the updates
		 */
		info.user.pipe.sendRaw('SESSION_UPDATE', params,{restrict: info.subuser});
	}

	return 1;
});