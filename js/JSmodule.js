function JSmodule(ModuleID){
	//save scope
	var scope = this;
	
	//debug function
	function debug(data){
		if(!opts.debug) return {};
		console.log("["+opts.app+"] >> ",data);
		return this;
	}	
	
	/*
	 * Object constructor
	 */
	 function constructor(methodOrOptions){
		if(methods[methodOrOptions]){
			//strip first argument and covert to true array
			var args = Array.prototype.slice.call( arguments, 1 );
			
			//execute function before method || Cancel execution if returned false
			if(constructor.beforeHook(methodOrOptions, args) === false) return;
			
			//Execute method
			var returnVal = methods[ methodOrOptions ].apply( this, args);
			
			//Smart return value
			if(typeof returnVal != 'undefined') 
				return returnVal;
			return this; 

		} else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
			// Default to "init"
			if(constructor.beforeHook("init", methodOrOptions) === false);
			return methods.init.apply( this, arguments );
		} else {
			throw new Error('['+opts.app+'] >>	Method `' + methodOrOptions + '` does not exists' );
		}
	};
	
	//Global hidden options
	var opts = {};	
	
	//Global hidden hooks
	var hooks = {};
	
	//Global hidden data
	var data = {};
	
	//Default methods
	var methods = {
		init: function(options, callback){
			if(options && typeof(options) == 'object'){
				opts = Merge( opts, options );
			}
			
			if(typeof callback == 'function'){
				callback.apply(this, [options]);
			}
			//Call hooks
			constructor.afterHook("init", options);			
		}		
	}
	
	
	//Private functions
	function applyHook(when, args){
		if(typeof args == 'undefined')
			var args = [];
		
		args = Array.prototype.slice.call( args );
		
		var funcName = args.shift();
		
		var func = opts.app + "::" + when +"_"+funcName; //function name
		//All arguments but the first=function name
		//var args = Array.prototype.slice.call( arguments, 2 );	
		
		//exit if no callback
		if(!hooks[func]){
			//debug("No " + func + " hooks");
			return;
		}
		
		debug("Applying "+when+" hook function[" + func +"] to ["+funcName+"]");
		var cont;
		
		//Apply function
		for(var i in hooks[func]){
			cont = hooks[func][i].apply(this,args);
			
			debug("Hook "+func+"()["+i+"] returned: "+cont);
			if(cont === false) return false; //Return false to cancel further execution when before_call
		}
				
	}
	

	//Add debugging function to constructor
	constructor.debug = debug;
	
	/*
	 * Public function to register hooks
	 */
	constructor.registerHook = function(when, funcName, callback){
		var hook = opts.app +"::"+ when +"_" + funcName;
		
		if(!hooks[hook]) 
			hooks[hook] = [];
			
		hooks[hook].push(callback);
		
		$.iD.debug("++++++Adding hook: "+hook);
		$.iD.debug(callback);
	}
	
	/*
	 * Public function to clear hook stacks
	 */
	constructor.clearHooks = function(when, funcName){
		var func = opts.app +"::"+ when +"_" + funcName;
		
		debug("Clearing ["+func+"] hooks");
		
		hooks[func] = [];
	}
	
	/*
	 * Functions to apply hooks 
	 * To be use and plugins and other enviroments
	 */
	constructor.beforeHook = function(){
		return applyHook.call(this, "before", arguments);
	}	
	constructor.afterHook = function(){
		return applyHook.call(this, "after", arguments);
	}		
	
	//Extra method right on object
	constructor.extend = function(name, func){
		if(typeof name == 'object'){
			methods = Merge( methods, name );
		}else{
			methods[name] = func;
		}
	}
	
	constructor.get = function(name, index){
		switch(name){
			case "options":
				return opts;
				break;
				
			case "option":
				return opts[index];
				break;
				
			case "methods":
				return methods;
				break;
						
			case "method":
				return methods[index];
				break;
				
			case "data":
				if(typeof index == 'undefined'){
					return data;
				}else{
					return data[index];					
				}
				break;
				
			case "hooks":
				return hooks;
				break;			
		}
	}
	
	constructor.set = function(name, index, val){
		switch(name){
			case "options":
				opts = Merge( opts, index);
				break;
				
			case "option":
				return opts[index] = val;
				break;
				
			case "method":
				this.extend(index, val);
				break;
				
			case "data":
				data[index] = val;
				break;	
		}
	}
	
	
	
	//Default options
	opts = {
		app: ModuleID || "Obj",
		debug: false
	}
	
	/*
	 * Required object merger function
	 */
	function Merge(obj1, obj2, callback){
		var obj3 = {};
		
		for(var i in obj1){
			obj3[i] = obj1[i];
		}
		
		for(var i in obj2){
			obj3[i] = obj2[i];
		}
		
		if(typeof callback == 'function')
			callback();
		
		return obj3;
	}
	
	return constructor;
}