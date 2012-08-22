<?php
	function p($data){
		print_r($data);
		echo "<br>";
	}
	
	class APS{
		
		var $server, $cmd, $secured, $connect, $debug;
		
		function __construct($server){
			$this->server = $server;
			
			$this->cmd = $_REQUEST['cmd'];
			
			$this->data = json_decode($this->cmd);
			$this->data = $this->data[0];
			
			if($this->data->cmd == "Event"){
				$this->event = &$this->data->params->event;
				$this->eventData = &$this->data->params->data;
				$this->from = $_REQUEST['from'];
			}else{
				/*
				 * Event/CMD not supported respond with error
				 * Work in progress... pending error
				 */
			}
		}
		
		function push(){
			$inline = array(
				"cmd" 		=> "inlinepush",
				"params"	=> array(
						"raw"		=> "EVENT",
						"data"		=> array("event" => $this->data->params->event, "data" => $this->data->params->data),
						"to"		=> $this->data->params->pipe,
						"from"		=> $this->from,
						"sessid"	=> $this->data->sessid
				)
			);
			
			if(empty($this->secured)){
				$protocol = "http://";
			}else{
				$protocol = "https://";
			}
			
			$url = $protocol . $this->server . "/0/?";
			$this->cmd = json_encode(array($inline));
			$response = $this->post_curl($url);
			$this->response = $response;
			
			return $this;
		}
		
		function respond(){
			if(empty($this->response))
				$this->push();
			
			ignore_user_abort(true);
			
			if(empty($this->debug)){
				header("Connection: close");
				header("Content-Length: " . mb_strlen($this->response));
			}
			
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