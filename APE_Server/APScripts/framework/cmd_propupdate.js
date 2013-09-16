Ape.registerCmd("userPropUpdate", true, function(params, info){
	info.user.update(params);
	return 1;
});