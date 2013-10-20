<?php
	/*
	 * Start Builder
	 * - Concat the dev files in one
	 */
	 
	$path = "js/src/";
	$sufix = ".js";
	$files = array("utilities","client", "onMessage", "transport", "user", "channel", "session");

	$version = file_get_contents('VERSION');
	
	$date = date("Y-m-d \@ h:i");
	$pre = "/**
 * @author Pablo Tejada
 * @repo https://github.com/ptejada/ApePubSub
 * @version {$version}
 * Built on {$date}
 */\n"
 ;
	function build($list, $output){
		global $path, $sufix, $pre, $version;
		
		
		$res = $pre . "\n";
		foreach($list as $file){
			$res .= file_get_contents($path . $file . $sufix);
			$res .= "\n\n";
		}

		$res = str_replace("{{VERSION}}", $version, $res);
		
		file_put_contents($output, $res);
		return $res;
	}
	
	$content = build($files, "js/ApePubSub.js");
	
	/*
	 * Closure Compiler request
	 */
	$cOption = array(
		"js_code" 			=> $content,
		"compilation_level" => "SIMPLE_OPTIMIZATIONS",
		"output_format"		=> "text",
		"output_info"		=> "compiled_code"
	);
	
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($cOption));
	curl_setopt($ch, CURLOPT_URL, 'http://closure-compiler.appspot.com/compile');
	curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		'Content-Type: application/x-www-form-urlencoded'
	));
	
	$contentMin = curl_exec($ch);
	file_put_contents("js/ApePubSub.min.js", $pre.$contentMin);

	/*
	 * Change the version on conf.json
	 */
	$conf = file_get_contents('conf.json');
	$conf = preg_replace('/Version [\.\d]{3,5}/',"Version $version",$conf);
	file_put_contents('conf.json',$conf);

	
?>
<center>
	<h1>Build Succeed!</h1>
	<ul>
		<li>js/ApePubSub.js</li>
		<li>js/ApePubSub.min.js</li>
	</ul>
</center>
