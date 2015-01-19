<?php
	include("../core/config.php");
	
	//Proccess Login
	if($user->isSigned()){
		$u = $user->table->getRow(array("ID" => $user->ID));
		$data = array(
			"sessid" => $u->ape_session,
			"user" => array(
				"name" => $u->Username,
				"id" => $u->ID,
				"avatar" => md5($u->Username)
			)
		);
		echo json_encode($data);
	}
?>
