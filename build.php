<?php
	/*
	 * Start Builder
	 * - Concat the dev files in one
	 */
	 
	 include "php/lib/jsmin.php";
	 
	$path = "js/dev/";
	$files = array("init","load", "fn", "utilities");
	
	$date = date("Y-m-d \@ h:i");
	
	$res = "/**
 * @author Pablo Tejada
 * Built on {$date}
 */
 
	";
	
	foreach($files as $file){
		$res .= file_get_contents($path . $file . ".js");
		$res .= "\n\n";
	}
	
	file_put_contents("js/ApePubSub.js", $res);
	
	//echo "<pre>";
	
	//$res = preg_replace("/[\t\n\r]/", "", $res);
	$min = JSMin::minify($res);
	file_put_contents("js/ApePubSub.min.js", $min);	
?>
<center>
	<h1>Build Succeed!</h1>
	<ul>
		<li>js/ApePubSub.js</li>
		<li>js/ApePubSub.min.js</li>
	</ul>
</center>
