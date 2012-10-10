<?php
	if($user->signed) redirect(".");
	
	$d = @$_SESSION["regData"];
	unset($_SESSION["regData"]);
?>
	<h1>Register</h1>
	
	<div class="report">
		<?php echo showMsg()?>
	</div>

	<form class="uf" method="post" action="ps/register.php">
		<label>Username:</label><span class="required">*</span>
		<input name="username" type="text" value="<?php echo @$d['username']?>">
		
		<label>Password:</label><span class="required">*</span>
		<input name="password" type="password" value="<?php echo @$d['password']?>">
		
		<label>Re-enter Password:</label><span class="required">*</span>
		<input name="password2" type="password" value="<?php echo @$d['password2']?>">
		
		<input value="Register" type="submit">
	</form>
	
	<a href="/login/">Login</a>
