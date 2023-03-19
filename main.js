var server = "mqtt.home";
var hatopic = "homeassistant";
var flictopic = "homeassistant/flic";

var buttonManager = require("buttons");

var mqtt = require("./mqtt").create(server);

buttonManager.on("buttonSingleOrDoubleClickOrHold", function(obj) {
	var button = buttonManager.getButton(obj.bdaddr);
	var clickType = obj.isSingleClick ? "click" : obj.isDoubleClick ? "double_click" : "hold";
	var sn = button.serialNumber;
	
	var btntopic = flictopic+"/"+sn;

	mqtt.publish(btntopic + "/action", clickType);
	console.log("Sent "+clickType+" to "+btntopic+"/action");
	mqtt.publish(btntopic + "/action", "ok");
	mqtt.publish(btntopic + "/battery", button.batteryStatus+"%");
	console.log("Sent "+button.batteryStatus+" to "+btntopic+"/battery");
});

mqtt.on('connected', function(){
	//Register known buttons - might need to do this more regularly, not just on startup!
	var buttons = buttonManager.getButtons();
	for (var i = 0; i < buttons.length; i++) {
		var button = buttons[i];
		console.log(JSON.stringify(button));	

		var configtopic = hatopic+"/sensor/"+button.serialNumber;
		var buttontopic = flictopic+"/"+button.serialNumber;
		var obj = {};
		
		obj.device = { 
			name: button.name,
			identifiers: [button.serialNumber],
			manufacturer: "Flic",
			model: "Button"
		};

		//obj.hello = "goodbye";
		//delete obj.hello;
		
		//Setup config and destination for button press
		obj.name = button.name+" Flic Button";
		obj.state_topic = buttontopic+"/action";
		//obj.unique_id = "Flic.Action."+button.serialNumber;

		payload = JSON.stringify(obj);
		console.log("Sending "+payload+" to "+configtopic+"/action/config");
		mqtt.publish(configtopic+"/action/config", payload, {retain: true } );
		
		//Setup config and destination for battery level report
		obj.name = button.name+" Flic Button Battery Level";
		obj.state_topic = buttontopic+"/battery";
		//obj.unique_id = "Flic.Battery."+button.serialNumber;
		obj.device_class = "battery";
		payload = JSON.stringify(obj);
		console.log("Sending "+payload+" to "+configtopic + "/battery/config");
		mqtt.publish(configtopic + "/battery/config", payload, {retain: true } );
	}
});

mqtt.connect();



