<?php
	/*
	 * Start Builder
	 * - Concat the dev files in one
	 */
	 
	include "php/lib/jsmin.php";
	 
	$path = "js/src/";
	$sufix = ".js";
	$files = array("utilities","client", "onMessage", "transport", "user", "channel", "session");
	
	$date = date("Y-m-d \@ h:i");
	$pre = "/**
 * @author Pablo Tejada
 * @repo https://github.com/ptejada/ApePubSub
 * Built on {$date}
 */\n\n"
 ;
	function build($list, $output){
		global $path, $sufix, $pre;
		
		
		$res = $pre;
		foreach($list as $file){
			$res .= file_get_contents($path . $file . $sufix);
			$res .= "\n\n";
		}
		
		file_put_contents($output, $res);
		return $res;
	}
	
	$min = JSMin::minify(build($files, "js/ApePubSub.js"));
	file_put_contents("js/ApePubSub.min.js", str_replace("\n", "", $pre.$min));
	
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
