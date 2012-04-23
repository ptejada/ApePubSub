What is it?
=====================

ApePubSub is an [APE_JSF](https://github.com/APE-Project/APE_JSF) wrapper which provides an alternative and simpler  Pub/Sub like API for the [APE Server](https://github.com/APE-Project/APE_Server). Great for beginners, good for those small/simpler projects and yet fully compatible with all the advance features of the Oficcial Framework.

Features
=====================

The main goal of this project is to reduce the time spent coding on the server so you could focus on your actual application. After all, everything most developers want is just send/Pub and recieve/Sub information in realtime, not build an the application in the comet server itself.

Simple implementation of sessions, simply set `APE.PubSub.session` to **true** or **false**

Centralized user support, add all your users information in `APE.PubSub.user`. For example add your user's username in `APE.PubSub.user.name`. Please note that the `APE.PubSub.user` object is only sent to server when starting a new session. When restoring a session the information in `APE.PubSub.user` will be overwritten with the infomation from the server\`s session.

Develper mode, toggle debug mode by setting `APE.PubSub.debug` to **true** or **false**. When **true** the wrapper will log information to the browser's console. When **false** no information will be written to the browser\`s console. To keep this feature with your application you are encorage to use `APE.debug()` instead of `console.log()`. Outgoing commands will show like this `<<<<<<COMMAND>>>>>` in the browser\`s console and incoming raw like `>>>>>>>RAW<<<<<<<`.

A global **Sub()** function which joins a channel and starts the connection to the server if it has not been started. You could also add **events** to the channel with this method and a callback for when the channel has been joined.
```
	Sub( CHANNEL_NAME);
					
	Sub( CHANNEL_NAME , EVENTS );
					
	Sub( CHANNEL_NAME , EVENT_NAME , CALLBACK );
```

A global unified **Pub()** fuction to send strings or objects through a channel. The strings and objects will be automatically routed to different events, *message* and *data* respectively.
```
	Pub( CHANNEL_NAME , STRING || OBJECT);
```


A global **onChan()** function to add events to channels, even if they have not been subscribed to yet, making it an anytime/anywhere channels event handler.
```
	onChan( CHANNEL_NAME , EVENTS );
					
	onChan( CHANNEL_NAME , EVENT_NAME , FUNCTION );
```

A global **onAllChan()** function to add events to all channels, including existing and future ones. This function also has some exclusive events of its own(Check the [Events list](#events)).
```
	onAllChan( CHANNEL_NAME , EVENTS );
					
	onAllChan( CHANNEL_NAME , EVENT_NAME , FUNCTION );
```

A global **getChan()** utility function which **returns** existing channel's pipe or *false*. This is usefull to have access to the pipe\`s default methods as detailed in the [APE_JSF doc](http://www.ape-project.org/docs/client/pipe/). So you could do something like `getChan("music").oCmd("SEND", ...)`
```
	getChan( CHANNEL_NAME )
```

It also handles the *BAD SESSION* error which by default instantly kills the client. This is taken care of by deleting the default RAW for this error and making a custom handler which restarts the connection by creating a new session while keeping the user's information and channels.

Just a handful of events are implmented, the ones that seem to be more useful.

**NOTE:** All *ApePubSub* global functions are bound to the `APE.PubSub` object.

<a name="events" />
Events List
=====================

General events
* **join**		==> Triggered when a user joins a channel
* **left**		==> Triggered when a user leaves a channel
* **message**	==> Triggered when a string/text is recieved throught the channel
* **data**		==> Triggered when a object/array is recieved throught the channel

*onAllChan()* specific events
* **connected**	==> Triggered once, when the clients initially connects to the APE server
* **reconnect**	==> Triggered when the client loses its connection/session with the server and tries to reconnect.
* **reconnected**	==> Triggered when the client has reconnected to the APE server after losing its connection.

Getting Started
=====================

If you dont have an APE server instance running check this wiki to get started, [APE Setup](http://www.ape-project.org/wiki/index.php/Setup_1.0), i personally prefer the binary installation. I will refer to the binary installation throughout this file too.

Complementing the client side API, there are a few scripts/modules to install in the server. The easiest way to do this is to merge the [scripts/](https://github.com/ptejada/ApePubSub/tree/master/APE_SERVER/) directory located in the [APE_SERVER/](https://github.com/ptejada/ApePubSub/tree/master/APE_SERVER) with the *scripts/* directory of your **APE** installation. After that just restart the server.

Once the modules/scripts are installed you could dig in the demos. Im really bad making separate documentation, so i left a bunch of useful comments in the demo's source code. By default the demos will fetch the APE_JSF from GitHub and use my APE server via the JSONP transport so you could try demos without having to install anything nor run your own server. To use the demos with your APE server update the file [demo/config.js](https://github.com/ptejada/ApePubSub/tree/master/demo/config.js).

TODOs
=====================
* Create additional demos to furhter illustrates the usage of the projet
* Add events to handle the [006] BAD_NICK error
* Reconsider the use of global functions and their name conventions
* Keep working on the files in [php/](https://github.com/ptejada/ApePubSub/tree/master/php/) to create a PHP link between the APE server and the client framework for tighter PHP applications intregrration ( Been consider for separate project)
* Keep testing...
