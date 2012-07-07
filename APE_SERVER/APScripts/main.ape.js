Ape.addEvent("init", function() {
	/*
	 * APS framework essentials
	 */
	include("framework/utils.js");
	include("framework/cmd_frame.js");
	include("framework/cmd_pub.js");
	include("framework/cmd_inlinepub.js");
	include("framework/cmd_restore.js");
	include("framework/hook_connect.js");
	include("framework/hook_events.js");
	
	/*
	 * Pending usefull objects rewrite
	 */
	//include("framework/Http.js");
	//include("framework/http_auth.js");
	
	/*
	 * User defined scripts below
	 */
	//include("cmd/myCommand.js");
	//include("hoook/myHook.js");
	
});
