<?php
	include("APS.php");
	
	$c = new APS("ape.crusthq.com:45138");
	
	$c->secured == false;
	$c->passkey = 'p@s$w0rd';
	
	if($c->connect){
		//Get user parameters and update
		/*
		$c->user = array(
			"name" => "idk"
		);
		 */
	}
	
	$c->respond();
?>