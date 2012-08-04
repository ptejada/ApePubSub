<?php
	include("../../php/APS.php");
	
	$c = new APS("ape.crusthq.com:45138");
	
	$c->secured == false;
	
	if($c->connect){
		//Get user parameters and update
		/*
		$c->user = array(
			"name" => "idk"
		);
		*/
	}
	
	$c->push()->respond();
?>