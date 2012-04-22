APE.Client.prototype.on = function($event, func){
	this.addEvent("on_"+$event, func);
}
//-------ApePubSub Starts--------//

APE.PubSub = {
	user: {},
	opts: {},
	channels: {},
	eventQueue: {},
	globalEventQueue: [],
	client: {},
	debug: true,
	session: false,
	state: 0,
	reconnect: 0,
	restoring: false,
	startOpt: {}
};
