# flic2hass
A Flic SDK utility to publish all Flic buttons to Home Assistant via MQTT

Utilizing https://hubsdk.flic.io/static/tutorial/

Your Flic Hub online IDE: https://hubsdk.flic.io/

Follow the tutorial steps above, substituting in main.js -- DON'T FORGET TO UPDATE IT TO USE YOUR OWN MQTT SERVER!

Requirements:
* Flic Hub
* Working MQTT system
* Enough know-how to get it to work - you will need to also follow the tutorial a bit (linked above)

Basic steps:
* Connect to your Flic Hub IDE
* Create a new module, name it MQTT
* Paste in the main.js and mqtt.js files
* Update the main.js variables server and hatopic.
* IF you use a username/password on your MQTT, set that up
* Start the "Module" in the IDE and watch the Console output - it'se extremely verbose right now

* IF it started right, set the "restart after crash" checkbox just in case

* IF it didn't start, try powercycling your Flic Hub and reconnect. Verify the Module saved properly and is running.
