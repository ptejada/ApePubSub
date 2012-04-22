What is it?
=====================

ApePubSub is an [APE_JSF](https://github.com/APE-Project/APE_JSF) wrapper which provides an alternative and simpler  Pub/Sub like API for the [APE Server](https://github.com/APE-Project/APE_Server).

Features
=====================

The main goal of this project is to reduce the time you spent coding on the server so you could focus on your actual application. After all, everything most developers want is just send/Pub and recieve/Sub information in realtime not build an the application in the comet server itself.


Getting Started
=====================

If you dont have an APE server instance running check this wiki to get started, [APE Setup](http://www.ape-project.org/wiki/index.php/Setup_1.0), i personally prefer the binary installation. I will refer to the binary installation throughout this file too.

Complementing the client side API, there are a few scripts/modules to install in the server. The easiest way to do this is to merge the [scripts/](https://github.com/ptejada/ApePubSub/tree/master/APE_SERVER/) directory located in the [APE_SERVER/](https://github.com/ptejada/ApePubSub/tree/master/APE_SERVER) with the *scripts/* directory of your **APE** installation. After that just restart the server.

Once the modules/scripts are installed you could dig in the demos. Im really bad making separate documentation, so i left a bunch of useful comments in the demo's source code. By default the demos will fetch the APE_JSF from GitHub and use my APE server via the JSONP transport so you could try demos without having to install anything nor run your own server. To use the demos with your APE server update the file [demo/config.js](https://github.com/ptejada/ApePubSub/tree/master/demo/config.js).
