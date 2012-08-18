<?php
	include("APS.php");
	
	$c = new APS("ape.crusthq.com:45138");
	
	$c->secured == false;
	
	$c->respond();
?>