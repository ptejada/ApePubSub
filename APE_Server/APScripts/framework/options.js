/*
 * Configure some aspects of the framework
 */
var APS = {
	option: {
		/*
		 * Maximum number of characters in a user's name
		 */
		userNameMaxLength: 16,

		/*
		 * Regular Expression to test the user's name against,
		 * it must be true to be a valid name
		 */
		userNameRegex: /[_a-zA-Z0-9]/i,

		/*
		 * An array of IPs to limit connections to
		 * Only connections from the listed IPs will be accepted
		 * NOTE: if have a front end server hosted the same machine
		 * as the APE server the IP might always be 127.0.0.1
		 */
		limitConnectionToIp: []
	},
	config: function( name, value ){
		if( typeof name == 'object'){
			for( var i in name ){
				this.option[i] = name[i];
			}
		}else{
			this.option[name] = value;
		}
	}
}