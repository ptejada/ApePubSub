<?php
	include("APS.php");
	
	/*
	 * The JS APS client framework sends an ajax request with two request parameters 'cmd' and 'from'
	 * Both parameters are parsed upon constructing the object below.
	 */
	$c = new APS("ape.crusthq.com:45138");
	
	/*
	 * This option toggles wheater to use HTTPs or HTTP
	 */
	$c->secured = false;
	
	switch($c->event){
		case "message":
			/*
			 * You may parse or edit the the event data itself 
			 */
			//$c->eventData = "[PHP] " . $c->eventData;
			/*
			 * You can go as far as overwriting the event name itselft
			 */
			//$c->event = "data";
			break;
	}

	
	/*
	 * This method pushes the event to the APE server using inlinepush
	 * echoes the response from the APE server and closes the connection
	 * 
	 * Please note that the connection is closed to speed up the push proccess
	 * Even thought the connection is close you can still do things in this script
	 * after the ->respond() method is called. For instance you could store the 
	 * event message in a database and the user experience would not be affected 
	 * because they would've already recieved their response.
	 * 
	 * NOTE: If you want to play around editing this script please enable the debugging mode
	 * to avoid closing the connection after a ->respond(). Ex: $c->debug = true;
	 */
	$c->respond();
?>