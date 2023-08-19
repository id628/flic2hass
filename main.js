var server = "mqtt.home";
var hatopic = "homeassistant";
var flictopic = "flic";
var username = "";
var password = "";
var mqtt = require("./mqtt").create(server,{'username':username,'password':password});

var buttonManager = require("buttons");
var myButtons = {}; //Dictionary of Button objects

//This runs when a button is added via Flic's interface
buttonManager.on("buttonAdded", function(obj){
	var button = buttonManager.getButton(obj.bdaddr);
	
	console.log("\nNew button Added! "+button.serialNumber+" "+button.name);
    console.log("\nRAW obj info: " + JSON.stringify(obj, null, 4) + "\n");
	console.log("\nRAW button info: " + JSON.stringify(button, null, 4) + "\n");
	
	if (button.serialNumber == null || button.name == null) {
		return;
	}
	
	if (button.serialNumber) {
		register_button(button);
	}
});


//This runs when a button is added via Flic's interface
buttonManager.on("buttonConnected", function(obj){
	var button = buttonManager.getButton(obj.bdaddr);

	console.log("\nNew button Connected! "+button.serialNumber+" "+button.name);
    console.log("\nRAW obj info: " + JSON.stringify(obj, null, 4) + "\n");
	console.log("\nRAW button info: " + JSON.stringify(button, null, 4) + "\n");

	
	if (button.serialNumber == null || button.name == null) {
		return;
	}
	
	if (button.serialNumber) {
		register_button(button);
	}
});

//This runs when a button is added via Flic's interface
buttonManager.on("buttonReady", function(obj){
	var button = buttonManager.getButton(obj.bdaddr);

	console.log("\nNew button Ready! "+button.serialNumber+" "+button.name);
    console.log("\nRAW obj info: " + JSON.stringify(obj, null, 4) + "\n");
	console.log("\nRAW button info: " + JSON.stringify(button, null, 4) + "\n");
	
	if (button.serialNumber == null || button.name == null) {
		return;
	}
	
	if (button.serialNumber) {
		register_button(button);
	}
	
});

//This runs when a button is deleted via Flic's interface
buttonManager.on("buttonDeleted", function(obj){
	//Well crap. If it's deleted, it doesn't have an object anymore.
	//So that means I have to save it by address, not ID so I can delete it from MQTT later
	console.log("\nDeleting button "+obj.bdaddr);
    console.log("\nRAW obj info: " + JSON.stringify(obj, null, 4) + "\n");
	
	var configtopic = hatopic+"/sensor/"+myButtons[obj.bdaddr].serialNumber;
	mqtt.publish(configtopic+"/action/config", null, {retain: false } );
	if (myButtons[obj.bdaddr]) {
		delete myButtons[obj.bdaddr];
		//myButtons.delete[obj.bdaddr];
	}
});

buttonManager.on("buttonSingleOrDoubleClickOrHold", function(obj) {
	//This runs when a button is clicked.

	var button = buttonManager.getButton(obj.bdaddr);
    console.log("\nRAW obj info: " + JSON.stringify(obj, null, 4) + "\n");
	console.log("\nRAW button info: " + JSON.stringify(button, null, 4) + "\n");
	
	var clickType = obj.isSingleClick ? "click" : obj.isDoubleClick ? "double_click" : "hold";
	var sn = button.serialNumber;

	if (!myButtons[button.bdaddr]) {
		console.log("**** Found an unregistered button. It must be new! ***")
		register_button(button);
	}
	
	if (myButtons[button.bdaddr].name!=button.name) {
		console.log("*Name changed from "+myButtons[button.bdaddr].name+" to "+button.name);
		register_button(button);
	}
	
	var btntopic = flictopic+"/"+sn;

	mqtt.publish(btntopic + "/action", clickType);
	console.log(btntopic+"/action:   \t"+clickType);
	mqtt.publish(btntopic + "/action", "ok");
	mqtt.publish(btntopic + "/battery", button.batteryStatus+""); //NOW it seems to just want text, no decoration!
	console.log(btntopic+"/battery:  \t"+button.batteryStatus);
});

buttonManager.on("buttonUp", function(obj) {
    var button = buttonManager.getButton(obj.bdaddr);
    console.log("\nButton Released! " + button.serialNumber + " " + button.name);
    publishButtonState(button, "released");
});

buttonManager.on("buttonDown", function(obj) {
    var button = buttonManager.getButton(obj.bdaddr);
    console.log("\nButton Pressed! " + button.serialNumber + " " + button.name);
    publishButtonState(button, "pressed");
});

function publishButtonState(button, state) {
    var sn = button.serialNumber;
    var statetopic = flictopic + "/" + sn + "/state";
    mqtt.publish(statetopic, state);
    console.log(statetopic + ":   \t" + state);
}

function register_button(button) {
    //Register one button
    //This sets up the MQTT Discovery topics to publish the Flic button
	
	//NOTE: When a button is added via the Flic interface, it gets named 
	//a bit late. So the API returns null for the name.
	//What's worse, it continues to return null until you restart the 
	//Javascript app running in the Hub. I have no idea how to get the 
	//new name without crashing the app and relying on the 
	//"Restart after crash" flag - and I'm not willing to do that.
	//TL;DR - new buttons are named "null" until the Hub is rebooted.

    console.log("\nRAW device info: " + JSON.stringify(button, null, 4) + "\n");

    if (button.serialNumber == null) {
        console.log("**Error registering button, still no serialNumber")
        return;
    }

    var configtopic = hatopic + "/sensor/" + button.serialNumber;
    var buttontopic = flictopic + "/" + button.serialNumber;
    var obj = {};

    obj.device = {
        name: button.name,
        identifiers: [button.serialNumber],
        manufacturer: "Flic",
        model: "Button"
    };

    //Setup config and destination for button press
    obj.name = button.name + " Button Action";
    obj.state_topic = buttontopic + "/action";
    obj.unique_id = "Flic_" + button.serialNumber + "_action";

    payload = JSON.stringify(obj, null, 4);
    console.log(configtopic + "/action/config:\t" + payload);
    mqtt.publish(configtopic + "/action/config", payload, {
        retain: true
    });

	// Setup config and destination for button state
	obj.name = button.name + " Button State";
	obj.state_topic = buttontopic + "/state";
	obj.unique_id = "Flic_" + button.serialNumber + "_state";

	payload = JSON.stringify(obj, null, 4);
	console.log(configtopic + "/state/config:\t" + payload);
	mqtt.publish(configtopic + "/state/config", payload, {
		retain: true
	});

    //Setup config and destination for battery level report
    obj.name = button.name + " Battery Level";
    obj.state_topic = buttontopic + "/battery";
    obj.unique_id = "Flic_" + button.serialNumber + "_battery";
    obj.device_class = "battery";
	obj.entity_category = "diagnostic";
    //obj.unit_of_measurement = "%"; //It doesn't seem to actually like this.

    payload = JSON.stringify(obj, null, 4);
    console.log(configtopic + "/battery/config:\t" + payload);
    mqtt.publish(configtopic + "/battery/config", payload, {
        retain: true
    });
    myButtons[button.bdaddr] = {
        name: button.name,
        serialNumber: button.serialNumber
    };

    console.log("\nmyButtons: " + JSON.stringify(myButtons, null, 4) + "\n");

}

//This sets up the MQTT Discovery topics to publish all the Flic buttons
function register_allbuttons(){
	var buttons = buttonManager.getButtons();
	for (var i = 0; i < buttons.length; i++) {
		register_button(buttons[i]);
	}
}

//This runs on startup, it performs the actual "discovery" announcement for 
//HomeAssistant to add the device to its inventory
mqtt.on('connected', function(){
	register_allbuttons();
});

// Added by heroash88 to reconnect if MQTT server goes down
mqtt.on('disconnected', function() {
	mqtt.connect();
});

mqtt.on('error', function () {
	setTimeout(function () {
		throw new Error("Crashed")
	}, 1000);
});

mqtt.connect();
