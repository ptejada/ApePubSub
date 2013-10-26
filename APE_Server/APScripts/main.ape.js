/*
 * DO NOT INCLUDE YOUR SCRIPTS ON THIS FILE
 * USE THE config.js FILE INSTEAD
 */
Ape.addEvent("init", function() {
	/*
	 * APS framework essentials
	 */
	include("framework/utils.js");
	include("framework/Request.js");
	include("framework/cmd_frame.js");
	include("framework/cmd_eventpush.js");
	include("framework/cmd_restore.js");
	include("framework/cmd_event.js");
	include("framework/cmd_propupdate.js");
	include("framework/cmd_session_set.js");
	include("framework/hook_join.js");
	include("framework/hook_connect.js");
	include("framework/hook_events.js");
	include("framework/options.js");

	/*
	 * User framework configuration
	 */
	include("config.js");
});
