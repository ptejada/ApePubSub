PLEASE READ!
======================

Due to how the APE Server works and to take sessions support to the next level, the ApePubSub framework has recently been updated to implement frequency. If you have use the official [APE_JSF](https://github.com/APE-Project/APE_JSF) you should be familiar with it. It basically changes the the server hostname on every page load. For example if server is `ape.crusthq.com` it will become:

	1.ape.crusthq.com
	2.ape.crusthq.com
	3.ape.crusthq.com
	4.ape.crusthq.com
	...
	59.ape.crusthq.com
	...
	75.ape.crusthq.com
	...

An extra step in the installation proccess is required to add the domain name wildcard `*.ape.crusthq.com`. _The wiki should be update soon to add the extra step_. Note that if you don't use `sessions` this changes will not apply, no frequency will be added to requests so the server address will always be `ape.crusthq.com`.

A new feature that the improved session support brings is call _sync_. _sync_ is implemented as a simple paramater. It is used to keep many intances of a client under the same session syncronised. It basically allows a user to publish a message/data and allows the sender to recieve his own message in the current window and any other window in the same session. To visually test this feature open two tabs of any [demo](http://crusthq.com/script/ApePubSub/demo/), send multiple messages on one tab and the other tab should reflect the messages that you just sent.

This is also been intgrated with the [eventPush](https://github.com/ptejada/ApePubSub/wiki/Routing-events-for-php-processing) feature. So now you are able to route your messages to a PHP script, parsed the messages, change it or whatever and then get back the updated messages as it is published. Test it [here](http://crusthq.com/script/ApePubSub/demo/eventPush)

For the ultimate visual example open this [demo](http://crusthq.com/script/ApePubSub/demo/eventPush) in one tab and this other [demo](http://crusthq.com/script/ApePubSub/demo/singleChannel) in another tab. You should be same user in both. They both subscribe to the same channel, one publishes directly to the APE Server and the other is routed via a PHP script. Both tabs should mirror the same info, messages sent.

The wiki should be updated soon to reflect the API changes

The old scheme looked `client.pub( channel_name , message , callback)`
 
The new scheme looks `client.pub( channel_name , message , sync , callback)` where _sync_ is a boolean which if **true** will sync the message accross the user session.

Users and channels objects are currently been updated from every event. Soon an `update()` method will allow the current user to updated and add its public properties on the server.

### For more information, documention and API reference check the [wiki](https://github.com/ptejada/ApePubSub/wiki)
Checkout the [live demos](http://crusthq.com/script/ApePubSub/demo/)

**NOTE:** when updating make sure that you update the server scripts as well, you can tell if the server scripts need updating if the the folder **APE_Server** has been changed in the commit or recently.
***

What is it?
=====================

ApePubSub is an alternative event driven pub/sub framework to the official [APE_JSF](https://github.com/APE-Project/APE_JSF) for the [APE Server](https://github.com/APE-Project/APE_Server). It is written in plain javascript and is great for beginners, good for those small/simpler projects.

The client framework is based on @paraboul's next generation [APE_JSF](https://github.com/paraboul/APE-Client-JavaScript/tree/31dd239394af8a574667c8228ed8c004d6866973) draft and the server framework is a compilation of custom commads, hooks and rewrites from the official [framework](https://github.com/APE-Project/APE_Server/scripts/), the actual server binary do not requires modification.
