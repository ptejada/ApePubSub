//-------ApePubSub Starts--------//
APE.server = "ape2.crusthq.com";

APS = new APE(APE.server);

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
