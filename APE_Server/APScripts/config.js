/*
 * Add user includes here
 * Try to keep all your custom scripts in one folder
 * for example custom/
 *
 * Ex: include('custom/myScript.js')
 */

/*
 * Configure some aspects of the framework
 */
APS.config({
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

});
