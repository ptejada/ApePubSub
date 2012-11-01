<?php
	include("../core/config.php");
	
	//Proccess Login
	if($user->signed){
		$u = $user->getRow(array("user_id" => $user->id));
		$data = array(
			"sessid" => $u["ape_session"],
			"user" => array(
				"name" => $u["username"],
				"id" => $u["user_id"],
				"avatar" => md5($u["username"])
			)
		);
		echo json_encode($data);
	}
?>
