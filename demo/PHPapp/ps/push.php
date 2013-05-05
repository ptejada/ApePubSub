<?php
	include("../../../php/lib/APS.php");
	
	/*
	 * The JS APS client framework sends an ajax request with two request parameters 'cmd' and 'from'
	 * Both parameters are parsed upon constructing the object below.
	 */
	$c = new APS("ape.ptejada.com:45138");
	
	/*
	 * This option toggles whether to use HTTPs or HTTP
	 */
	$c->secured = false;
	
	switch($c->event){
		case "message":
			/*
			 * You may parse or edit the the event data itself
			 * For example below a PHP tag will be appended to message to indicate that it was parsed by PHP
			 */
			//$c->eventData .= "<spam style='background: #ccc; color: red; font-size: 0.45em; float: right; padding: 4px;'>[PHP]</span> ";
			/*
			 * You can go as far as overwriting the event name itselft
			 */
			//$c->event = "data";
			break;
	}

	
	/*
	 * This method pushes the event to the APE server using eventPush and
	 * echoes the response from the APE server and closes the connection
	 * 
	 * Please note that the connection is closed to speed up the push proccess
	 * Even thought the connection is close you can still do things in this PHP 
	 * script after the ->respond() method is called. For instance you could 
	 * store the event message in a database and the user experience will not 
	 * be affected because they would've already recieved their response.
	 * 
	 * NOTE: If you want to play around editing this script please enable the debugging mode
	 * to avoid closing the connection after a ->respond(). Ex: $c->debug = true;
	 */
	$c->respond();
?>