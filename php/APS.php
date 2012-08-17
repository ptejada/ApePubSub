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
			
			//$this->cmd = json_encode(array($this->data));
			
			$url = $protocol . $this->server . "/0/?";
			
			switch($this->data->cmd){
				case "CONNECT":
					
					break;
				case "JOIN":
					$this->response = $this->cmd;
					
					break;
				case "Event":
					$inline = array(
						"cmd" 		=> "inlinepush",
						"params"	=> array(
								"passkey"	=> $this->passkey,
								"raw"		=> "EVENT",
								"data"		=> $this->data->params,
								"from"		=> $this->data->params->pipe
						)
					);
					$this->cmd = json_encode(array($inline));
					$response = $this->post_curl($url);
					$this->response = $response;
					break;
			}
			
			return $this;
		}
		
		function respond(){
			if(empty($this->response))
				$this->push();
			
			ignore_user_abort(true);
			header("Connection: close");
			header("Content-Length: " . mb_strlen($this->response));
			echo $this->response;
			flush();
		}
		
		function post_curl($url) {
			$ch = curl_init($url);
			curl_setopt($ch, CURLOPT_HEADER, 0);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $this->cmd);
			$retdata = curl_exec($ch);
			curl_close($ch);
			return $retdata;
		}
		
	}
?>