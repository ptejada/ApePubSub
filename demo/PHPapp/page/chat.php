<?php
	//If user is not signed in refirect
	if(!$user->signed) redirect("./?page=login");	
?>
	<div id="chat">
		<h1>ApePubSub Chatter</h1>
		<div id="chat-messages"></div><div id="chat-userlist"></div>
		<div id="chat-footer">
			<form id="chat-form">
				<input disabled type="text" name="message" width="80%" /><input disabled type="submit" value="Send" width="20%" />
				<input type="hidden" name="channel" value="music" />
			</form>
			<img style="vertical-align: top; padding-top: 7px;" id="chat-user-icon" src="">
			<strong id="chat-user-name"></strong>
			
			<a id="chat-logout" href="#" title="logout">[x]</a>
		</div>
	</div>
	
	
	<script type="text/javaScript" src="../js/jquery-min.js"></script>
	
	<!-- Load APS Client -->
	<script type="text/javaScript" src="../../js/src/utilities.js"></script>
	<script type="text/javaScript" src="../../js/src/client.js"></script>
	<script type="text/javaScript" src="../../js/src/onMessage.js"></script>
	<script type="text/javaScript" src="../../js/src/transport.js"></script>
	<script type="text/javaScript" src="../../js/src/channel.js"></script>
	<script type="text/javaScript" src="../../js/src/user.js"></script>
	<script type="text/javaScript" src="../../js/src/session.js"></script>

	<script type="text/javaScript" src="chat.js"></script>