<?php
	include("../core/config.php");
	
	//Proccess Login
	if($user->signed){
		$data = array(
			"sessid" => $user->data["ape_session"],
			"user" => array(
				"name" => $user->data["username"],
				"id" => $user->data["user_id"],
				"avatar" => md5($user->username)
			)
		);
		echo json_encode($data);
	}
?>
