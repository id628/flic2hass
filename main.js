//GITHUB URL: https://github.com/id628/flic2hass

//CONFIGURATION - UPDATE AS NEEDED
var server = "mqtt.home";
var hatopic = "homeassistant";
var flictopic = "flic";

//CODE STARTS HERE. OPEN SOURCE LICENSE, USE OR CHANGE AS NEEDED

var buttonManager = require("buttons");

var mqtt = require("./mqtt").create(server);

//This runs when a button is clicked.
buttonManager.on("buttonSingleOrDoubleClickOrHold", function(obj) {
	var button = buttonManager.getButton(obj.bdaddr);
	var clickType = obj.isSingleClick ? "click" : obj.isDoubleClick ? "double_click" : "hold";
	var sn = button.serialNumber;
	
	var btntopic = flictopic+"/"+sn;

	mqtt.publish(btntopic + "/action", clickType);
	console.log(btntopic+"/action:   \t"+clickType);
	mqtt.publish(btntopic + "/action", "ok");
	mqtt.publish(btntopic + "/battery", button.batteryStatus+"%");
	console.log(btntopic+"/battery:  \t"+button.batteryStatus);
});

//This runs on startup, it performs the actual "discovery" announcement for 
//HomeAssistant to add the device to its inventory
mqtt.on('connected', function(){
	//Register known buttons - might need to do this more regularly, not just on startup!
	var buttons = buttonManager.getButtons();
	for (var i = 0; i < buttons.length; i++) {
		var button = buttons[i];
		console.log("\nRAW device info: "+JSON.stringify(button, null, 4)+"\n");	

		var configtopic = hatopic+"/sensor/"+button.serialNumber;
		var buttontopic = flictopic+"/"+button.serialNumber;
		var obj = {};
		
		obj.device = { 
			name: button.name,
			identifiers: [button.serialNumber],
			manufacturer: "Flic",
			model: "Button"
		};

		//Setup config and destination for button press
		obj.name = button.name+" Flic Button";
		obj.state_topic = buttontopic+"/action";
		obj.unique_id = "Flic_"+button.serialNumber+"_action";

		payload = JSON.stringify(obj, null, 4);
		console.log(configtopic+"/action/config:\t"+payload);
		mqtt.publish(configtopic+"/action/config", payload, {retain: true } );
		
		//Setup config and destination for battery level report
		obj.name = button.name+" Flic Button Battery Level";
		obj.state_topic = buttontopic+"/battery";
		obj.unique_id = "Flic_"+button.serialNumber+"_battery";
		obj.device_class = "battery";
		//obj.unit_of_measurement = "%"; //It doesn't seem to actually like this.
		
		payload = JSON.stringify(obj, null, 4);
		console.log(configtopic + "/battery/config:\t"+payload);
		mqtt.publish(configtopic + "/battery/config", payload, {retain: true } );
	}
});

mqtt.connect();

