APE.prototype.log = function($obj){
	if(!this.options.debug) return;
	
	var args =  Array.prototype.slice.call(arguments);
	args.unshift("[APE]");
	
	window.console.log.apply(console, args);
};

APE.prototype.info = function($obj){
	if(!this.options.debug) return;
	
	var args =  Array.prototype.slice.call(arguments);
	args.unshift("[APE]");
	
	window.console.info.apply(null, args);
};

//Generate a random string
function randomString(l){
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = l;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}
