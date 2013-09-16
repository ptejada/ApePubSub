<?php
	//If user is not signed in redirect
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
	
	
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>
	
	<!-- Load APS Client -->
	<script type="text/javaScript" src="../../js/ApePubSub.min.js"></script>
	<script type="text/javaScript" src="../global.js"></script>

	<script type="text/javaScript" src="chat.js"></script>