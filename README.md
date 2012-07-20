**------------Outdated - Pending edit---------**

What is it?
=====================

ApePubSub is an alternative event driven Pub/Sub framework to the official [APE_JSF](https://github.com/APE-Project/APE_JSF) for the [APE Server](https://github.com/APE-Project/APE_Server). It is written in plain javascript and is great for beginners, good for those small/simpler projects.

The client framework is based on @paraboul's next generation [APE_JSF](https://github.com/paraboul/APE-Client-JavaScript/tree/31dd239394af8a574667c8228ed8c004d6866973) draft and the server framework is a compilation of custom commads, hooks and rewrites from the official [framework](https://github.com/APE-Project/APE_Server/scripts/), the actual server binary do not requires modification.

Features
=====================

The framework provides a fail proof session system which can easily be toggle on and off at any time, even after initialization. You can also publish and send events directly to users.

Modular built so you could globaly add methods and properties to common objects such as user, channel and the client object via prototype. The objects for prototyping are as follows: `APS.user`, `APS.channel`, `APS` for the client.

A robust log() function is built-in the objects for debugging. For example if you call log() from a channel like `channel.log("Error here!");` you will see the following output in your browser's console `[APS][channel.name] Error here!`. Other useful debuging info in the browser console are outgoing commands and incoming events. The outgoing commands are noted as `<<<< NAME >>>>` and incoming data/event are noted as `>>>> NAME <<<<` where `NAME` is the actual command or event. Also event triggered/fired are log into the console. For example a *join* event trigered on a channel *music* will show up like this on the browser console `[APS][channel][music] {{{ join }}}`. All this output can be turned off at anytime `client.option.debug = false`


Overview
=========================

The whole client framework API is based on three simple objects: *user*, *channel* and the *client* itself. The *client* holds the *channels* and the *channels* the *users* the rest are just reference to either one of this type of objects.

The `on()` function is available in the *client* and *channel* objects to add event handlers. An event handler is simply the

**Sub()** => function which joins a channel and starts the connection to the server if it has not been started. You could also add **events** to the channel with this method and a callback for when the channel has been joined.
```
	Sub( CHANNEL_NAME);
					
	Sub( CHANNEL_NAME , EVENTS );
					
	Sub( CHANNEL_NAME , EVENT_NAME , CALLBACK );
```

**Pub()** => sends a string or object through a channel. The strings and objects will be automatically routed to different events, *message* and *data* respectively.
```
	Pub( CHANNEL_NAME , STRING || OBJECT);
```


**onChan()** => add events to channels, even if they have not been subscribed to yet, making it an anytime/anywhere channels event handler.
```
	onChan( CHANNEL_NAME , EVENTS );
					
	onChan( CHANNEL_NAME , EVENT_NAME , FUNCTION );
```

**onClient()** => add events to the client. You could also add [channel events](#channel-events) which will affect all channels including existing and future ones, something like global channel events.
```
	onClient( EVENTS );
					
	onClient( EVENT_NAME , FUNCTION );
```

**getChan()** => An utility function which **returns** existing channel or *false*. This is usefull to have access to the channels\`s methods and properties. So you could do something like `getChan("music").leave()` to quit a channel.
```
	getChan( CHANNEL_NAME )
```

**NOTE:** All *ApePubSub* global functions are bound to the `APS.client` object.

Events List
=========================

## Channel events
* **join**		==> Triggered when a user joins a channel
* **left**		==> Triggered when a user leaves a channel
* **message**	==> Triggered when a string/text is recieved throught the channel
* **data**		==> Triggered when a object/array is recieved throught the channel

## Client events
* **ready**	==> Triggered when
* **newChannel**	==> Triggered when a new `APS.Channel` object is created and inserted in the channels stack.

Getting Started
=====================

If you dont have an APE server instance running check this wiki to get started, [APE Setup](http://www.ape-project.org/wiki/index.php/Setup_1.0), i personally prefer the binary installation. I will refer to the binary installation throughout this file too.

Complementing the client side API, there is a script/module you need to install in the APE server. The easiest way to do this is to merge the [scripts/](https://github.com/ptejada/ApePubSub/tree/master/APE_SERVER/scripts/) directory located in the [APE_SERVER/](https://github.com/ptejada/ApePubSub/tree/master/APE_SERVER) with the *scripts/* directory of your **APE** installation. it will only overwrite the `main.ape.js` file. After that just restart the APE server.

Once the module/script is installed you could dig in the demos. Im really bad making standalone documentation, so i left a bunch of useful comments in the demo's source code. By default the demos will use my APE server so you could try the demos out of the box without having to install anything nor run your own server. To use the demos with your APE server update the file [demo/config.js](https://github.com/ptejada/ApePubSub/tree/master/demo/config.js).

TODOs
=====================
* Reinplement sessions...
* Create additional demos to furhter illustrates the usage of the project
* Reconsider the use of global functions and their name conventions
* Keep working on the files in [php/](https://github.com/ptejada/ApePubSub/tree/master/php/) to create a PHP link between the APE server and the client framework for tighter PHP applications intregrration ( Been consider for separate project)
* Keep testing...
