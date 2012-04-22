/***
 * APE JSF Setup
 */

//The Path where you uploaded APE_JSF
APE.Config.baseUrl = 'http://ape.crusthq.com/js';

//Your APE server URL
APE.Config.server = 'ape.crusthq.com';

/**
 * The Method of communication with the server 
 *
 * 0 => long polling
 * 1 => XHRStreaming
 * 2 => JSONP (crossdmain)
 * 3 => SSE / JSONP
 * 4 => SSE / XHR
 */
APE.Config.transport = 2;
