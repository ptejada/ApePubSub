**update**: this project went from been a wrapper to a full/standalone framework. There are some features pending for implementation, like sessions... based on @paraboul's the next generation [APS_JSF](https://github.com/paraboul/APS-Client-JavaScript/tree/31dd239394af8a574667c8228ed8c004d6866973) draft.

What is it?
=====================

ApePubSub is an alternative lightweight JavaScript framework to the official [APS_JSF](https://github.com/APS-Project/APS_JSF) for the [APS Server](https://github.com/APS-Project/APS_Server). Great for beginners, good for those small/simpler projects.

Features
=====================

The main goal of this project is to reduce the time spent coding on the server so you could focus on your actual application. After all, everything most developers want is just send/Pub and recieve/Sub information in realtime, not build an the application in the comet server itself.

Simple implementation of sessions, simply set `APS.session` to **true** or **false**

Centralized user support, add all your user's information in `APS.client.user`. For example add your user's username in `APS.client.user.name`. Please note that the `APS.client.user` object is only sent to the server when starting a new session. When restoring a session the information in `APS.client.user` will be overwritten with the infomation from the server\`s session.

Develper mode, toggle debug mode by setting `APS.debug` to **true** or **false**. When **true** the wrapper will log information to the browser's console. When **false** no information will be written to the browser\`s console. To keep this feature with your application you are encorage to use `APS.log()` instead of `console.log()`. Outgoing commands will show like this `<<<<<<COMMAND>>>>>` in the browser\`s console and incoming raw like `>>>>>>>RAW<<<<<<<`. Triggered events could be seen as `{{{ EVENT }}}`.

Global API reference
=========================

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

If you dont have an APS server instance running check this wiki to get started, [APS Setup](http://www.ape-project.org/wiki/index.php/Setup_1.0), i personally prefer the binary installation. I will refer to the binary installation throughout this file too.

Complementing the client side API, there is a script/module you need to install in the APS server. The easiest way to do this is to merge the [scripts/](https://github.com/ptejada/ApePubSub/tree/master/APS_SERVER/scripts/) directory located in the [APS_SERVER/](https://github.com/ptejada/ApePubSub/tree/master/APS_SERVER) with the *scripts/* directory of your **APS** installation. it will only overwrite the `main.ape.js` file. After that just restart the APS server.

Once the module/script is installed you could dig in the demos. Im really bad making standalone documentation, so i left a bunch of useful comments in the demo's source code. By default the demos will use my APS server so you could try the demos out of the box without having to install anything nor run your own server. To use the demos with your APS server update the file [demo/config.js](https://github.com/ptejada/ApePubSub/tree/master/demo/config.js).

TODOs
=====================
* Reinplement sessions...
* Create additional demos to furhter illustrates the usage of the project
* Reconsider the use of global functions and their name conventions
* Keep working on the files in [php/](https://github.com/ptejada/ApePubSub/tree/master/php/) to create a PHP link between the APS server and the client framework for tighter PHP applications intregrration ( Been consider for separate project)
* Keep testing...
