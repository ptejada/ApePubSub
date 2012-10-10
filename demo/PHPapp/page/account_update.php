	<h1>Update</h1>
	
	<div class="report">
		<?php echo showMsg()?>
	</div>

	<form class="uf" method="post" action="ps/update.php">
		<label>Username:</label>
		<input name="username" type="text" value="<?php echo $user->data['username']?>">
		
		<input value="Update" type="submit">
	</form>
	
	<a href="?page=account">Back to my account</a>
