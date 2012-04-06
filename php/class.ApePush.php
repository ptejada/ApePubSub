<?php

class ApePubSub{
	var $server = "http://ape2.crusthq.com";
	var $password = "testpasswd";
	var $from;
	var $fromType;
	var $to;
	var $toType;
	var $raw = "DATA";
	
	var $data;
	var $cmd;
	var $params = false;
	
	function __construct($params=false){
		$this->params = $params;
	}
	
	function build(){
		$params = $this->params ? $this->params : array(
			  'from'		=> $this->from,
			  'fromType'	=> $this->fromType,
			  'to'			=> $this->to,
			  'toType'		=> $this->toType,
			  'data'      	=> $this->data
		);
		
		$params["password"] = $this->password;
		$params["raw"] = $this->raw;
		
		
		$cmd = array(array(
		  'cmd' => 'pushpub',
		  'params' =>  $params
		));		   
		
		$cmd = rawurlencode(json_encode($cmd));
		
		$this->cmd = $cmd;
		
		return $cmd;
	}
	
	function send(){		
		$url = $this->server . "/?" . $this->build();
		
		//$res = $this->post_curl($this->cmd);
		$res = file_get_contents($url);
		
		$res = json_decode($res);
		
		if(@$res[0]->data->status == 'ok'){
			$output['sent'] = true;
		}else{
			$output['sent'] = false;
		}
		
		$output['raw'] = $res;
		
		$this->reponse = $output;
		
		return $output;		
	}
	
	function post_curl($postdata) {
		$ch = curl_init($this->server);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
		$retdata = curl_exec($ch);
		curl_close($ch);
		return $retdata;
	}
}

?>