/*
 * Export and bind functions
 */
for(func in APE.PubSub.fn){
	window[func] = APE.PubSub.fn[func].bind(APE.PubSub);
}
delete func;

//Debug Function for Browsers console
APE.debug = function($obj){
	if(!this.PubSub.debug) return;
	
    var pre = "[APE] ";
    if(typeof $obj == "string"){
        window.console.log(pre+$obj);
    }else{
    	window.console.log(pre+"[Object]");
    	window.console.log($obj);
    }
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
