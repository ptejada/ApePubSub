<?php
	/*
	 * ApePubSub PHP client 
	 * 		- mostly used to proccess and relay mesages from the javasript APS client to the APE server
	 * 		- since is just a PHP class it can also be used along with your user auth system to authenticate communication to the APE server
	 * 		- PHP cUrl is a required dependency
	 * 		- Note: this class only handles a single event at a time and consequently a single response
	 */
	class APS{
		
		var $server, $cmd, $secured, $debug;
		
		public function __construct($server, $parse=true){
			$this->server = $server;
			
			if(!$parse) return $this;
			
			$this->cmd = $_REQUEST['cmd'];
			if(get_magic_quotes_gpc()){
				$this->cmd = stripslashes($this->cmd);
			}
			
			$this->data = json_decode($this->cmd);
			$this->data = $this->data[0];
			
			if($this->data->cmd == "Event"){
				$this->event =& $this->data->params->event;
				$this->eventData =& $this->data->params->data;
				$this->from = $_REQUEST['from'];
			}else{
				//CMD/Event not yet supported
				$this->error("003", "BAD_CMD");
			}
		}
		
		private function push(){
			$inline = array(
				"cmd" 		=> "eventpush",
				"params"	=> (array)$this->data->params,
				"sessid"	=> $this->data->sessid
			);
			
			$this->cmd = json_encode(array($inline));
			
			/*
			$this->response = $this->cmd;
			return $this->respond();
			*/
			$this->postToAPE();
			
			return $this;
		}
		
		public function sendCmd($name, $data){
			$cmd = array(
				'cmd' => $name,
				'params' => $data
			);
			
			$this->cmd = json_encode(array($cmd));
			$this->postToAPE();
			
			return $this;
		}
		
		public function error($code = 303, $message="Message could not be delivered"){
			$data = array(
				"raw" 	=> "ERR",
				"data"	=> array(
					"code"	=> $code,
					"value"	=> $message
				)
			);
			
			$this->response = json_encode(array($data));
		}
		
		public function respond(){
			if(empty($this->response)){
				$this->push();
			}
			
			ignore_user_abort(true);
			
			//Close the connection
			if(empty($this->debug)){
				header("Connection: close");
				header("Content-Length: " . mb_strlen($this->response));
			}
			
			echo $this->response;
			flush();
		}
		
		private function postToAPE(){
			if(empty($this->secured)){
				$protocol = "http://";
			}else{
				$protocol = "https://";
			}
			
			$url = $protocol . $this->server . "/0/?";
			
			$ch = curl_init($url);
			curl_setopt($ch, CURLOPT_HEADER, 0);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $this->cmd);
			$this->response = curl_exec($ch);
			curl_close($ch);
			
			return $this->response;
		}
		
	}
?>