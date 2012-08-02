/*
 * Global variables
 */
var userlist = {};
var inlinePass = Ape.config("inlinepub.conf", "password");

/*
 * Enchance Ape.log function
 */
Apelog = Ape.log;

Ape.log = function(data){
	switch(typeof data){
		case "object":
		//case "array":
			Apelog(data.toSource());
			break;
		default:
			Apelog(data);
	}
}

/*
 * Built-in object modifications
 */
Ape.user.prop = Ape.channel.prop = function(index, value){
	if(typeof index == 'string' && typeof value != 'undefined'){
		return this.setProperty(index, value);
	}
	
	if(typeof index == 'string' && typeof value == 'undefined'){
		return this.getProperty(index) || false;
	}
	
	return this.pipe.toObject().properties;
}