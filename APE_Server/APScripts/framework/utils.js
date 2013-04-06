/*
 * Initialize Userlist
 */
Ape.userlist = {};

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
var setTimeout = Ape.setTimeout;
var setInterval = Ape.setInterval;
var clearTimeout = Ape.clearTimeout;
var clearInterval = Ape.clearInterval;

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

Ape.user.sendEvent = Ape.subuser.sendEvent = Ape.channel.sendEvent = function(bodyParams, options){
	if(typeof options == "object"){
		this.pipe.sendRaw("EVENT", bodyParams, options);
	}else{
		this.pipe.sendRaw("EVENT", bodyParams);
	}
}

Ape.getUserByName = function(name){
	name = name.toLowerCase();
	return Ape.userlist[name] || false;
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