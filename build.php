<?php
	/*
	 * Start Builder
	 * - Concat the dev files in one
	 */
	 
	include "php/lib/jsmin.php";
	 
	$path = "js/dev/";
	$sufix = ".js";
	$files = array("utilities","client", "onMessage", "transport", "user", "channel", "session");
	
	function build($list, $output){
		global $path, $sufix;
		
		$date = date("Y-m-d \@ h:i");
		$res = "/**
 * @author Pablo Tejada
 * Built on {$date}
 */\n\n"
 ;
	
		foreach($list as $file){
			$res .= file_get_contents($path . $file . $sufix);
			$res .= "\n\n";
		}
		
		file_put_contents($output, $res);
		return $res;
	}
	
	$min = JSMin::minify(build($files, "js/ApePubSub.js"));
	file_put_contents("js/ApePubSub.min.js", $min);
	
	/*
	 * Global API
	 */
	/*
	$files[] = "globals";
	
	$min = JSMin::minify(build($files, "js/ApePubSub.js"));
	file_put_contents("js/ApePubSub.min.js", $min);
	*/
?>
<center>
	<h1>Build Succeed!</h1>
	<ul>
		<li>js/ApePubSub.js</li>
		<li>js/ApePubSub.min.js</li>
	</ul>
</center>
