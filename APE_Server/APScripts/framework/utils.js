/*
 * Global variables
 */
var userlist = {};

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
	Apelog("\n\r");
}

/*
 * Globalize Some Ape methods
 */
setTimeout = Ape.setTimeout;
setInterval = Ape.setInterval;
clearTimeout = Ape.clearTimeout;
clearInterval = Ape.clearInterval;

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

/*
 * Official bind polyfill at developer.mozilla.org
 */ 
if(!Function.prototype.bind){
	Function.prototype.bind = function(oThis){
	if(typeof this !== "function"){
		// closest thing possible to the ECMAScript 5 internal IsCallable function
		throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
	}

	var aArgs = Array.prototype.slice.call(arguments, 1), 
		fToBind = this, 
		fNOP = function(){},
		fBound = function(){
			return fToBind.apply(this instanceof fNOP
								 ? this
								 : oThis || window,
								 aArgs.concat(Array.prototype.slice.call(arguments)));
		};

	fNOP.prototype = this.prototype;
	fBound.prototype = new fNOP();

	return fBound;
	};
}