//Pub Command
Ape.registerCmd("RESTORE", true, function(params, info){
	/*
	 * Since this is the first request the Server will 
	 * automatically sent the user user IDENT and LOGIN raws
	 */
	return 1;
});