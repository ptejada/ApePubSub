//Pub Command
Ape.registerCmd("RESTORE", true, function(params, info){
	info.sendResponse("RESTORED", {data:1});
	return 1;
});