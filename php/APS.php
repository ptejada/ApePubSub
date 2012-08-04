
<?php
	function p($data){
		print_r($data);
		echo "<br>";
	}
	
	class APS{
		
		var $server, $cmd, $secured, $connect, $user;
		
		function __construct($server){
			$this->server = $server;
			
			$this->cmd = $_REQUEST['cmd'];
			
			$this->data = json_decode($this->cmd);
			$this->data = $this->data[0];
			
			if(strtolower($this->data->cmd) == "connect"){
				$this->connect = true;
			}
		}
		
		function push(){
			if(empty($this->secured)){
				$protocol = "http://";
			}else{
				$protocol = "https://";
			}
			
			if($this->connect && $this->user){
				if(empty($this->data->params->user)){
					$user = $this->user;
				}else{
					$user = array_merge((array)$this->data->params->user, $this->user);
				}
				
				$this->data->params->user = $user;
			}
			
			$this->cmd = rawurlencode(json_encode(array($this->data)));
			
			$url = $protocol . $this->server . "/?" . $this->cmd;
			
			//$res = $this->post_curl($url);
			$cmd = file_get_contents($url);
			
			$data = json_decode($cmd);
			
			$this->result = $cmd;
			
			return $this;			
		}
		
		function respond(){
			echo $this->result;
		}
		
		function post_curl($url) {
			$ch = curl_init($this->server);
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $this->cmd);
			$retdata = curl_exec($ch);
			curl_close($ch);
			return $retdata;
		}
		
	}
?>