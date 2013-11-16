/**
 * Address to APE Server
 * @type {string}
 */
var ServerDomain = "ape.ptejada.com";

/**
 * Toggle the debugging features
 * @type {boolean}
 */
var EnableDebug = false;

/**
 * Toggle whether to use user session
 * By default it is enable unless the
 * 'nosession' hash is present in url
 * @type {boolean}
 */
var EnableSession = window.location.hash.search('nosession') < 0;