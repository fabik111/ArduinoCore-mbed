const connectButton = document.getElementById('connect');
const batteryLevelElement = document.getElementById('battery-level');
const batteryLabel = document.getElementById('battery-label');

const serviceUuid = '19b10000-0000-537e-4f6c-d104768a1214';
let pollIntervalID;
let peripheralDevice;

let data = {
    "batteryPercentage": {
        "name": "Battery Percentage",
        "value": 0,
        "unit": "%",
        "characteristic": null,
        "characteristicUUID": "19b10000-1001-537e-4f6c-d104768a1214",
        "extractData": function(dataView) {
            return dataView.getInt8(0);
        }
    },
    "batteryVoltage": {
        "name": "Battery Voltage",
        "value": 0,
        "unit": "V",
        "characteristic": null,
        "characteristicUUID": "19b10000-1002-537e-4f6c-d104768a1214",
        "extractData": function(dataView) {
            return dataView.getFloat32(0, true);
        }
    },
    "batteryChargeLevel": {
        "name": "Battery Charge Level",
        "value": 0,
        "unit": "",
        "characteristic": null,
        "characteristicUUID": "19b10000-1003-537e-4f6c-d104768a1214",
        "extractData": function(dataView) {
            return dataView.getInt8(0);
        },
        "getColor": function(value) {
            // Red to green range with 5 steps and white for the unknown state
            const colors = ["#ffffff", "#ff2d2d", "#fc9228", "#ffea00", "#adfd5c", "#00c600"];
            return colors[value];
        }
    }
};

function onDisconnected(event) {
    let device = event.target;
    connectButton.disabled = false;
    connectButton.style.opacity = 1;
    if(pollIntervalID) clearInterval(pollIntervalID);
    console.log(`Device ${device.name} is disconnected.`);

    // Reset the battery level display
    batteryLevelElement.style.width = "0px";
    batteryLabel.textContent = "";
}

async function connectToPeripheralDevice(usePolling = false, pollInterval = 5000){
    if (peripheralDevice && peripheralDevice.gatt.connected) {
        console.log("Already connected");
        return;
    }
   
    peripheralDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [serviceUuid] }]
    });
    peripheralDevice.addEventListener('gattserverdisconnected', onDisconnected);

    const server = await peripheralDevice.gatt.connect();
    console.log("Connected to: " + peripheralDevice.name);
    const service = await server.getPrimaryService(serviceUuid);

    await Promise.all(
        Object.keys(data).map(async (key) => {
            let item = data[key];
            const characteristic = await service.getCharacteristic(item.characteristicUUID);
            item.characteristic = characteristic;
    
            if (!usePolling) {
                characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);
                characteristic.readValue(); // Perform an initial read
                await characteristic.startNotifications();
            }
        })
    );

    if (usePolling) {
        pollIntervalID = setInterval(readCharacteristicsData, pollInterval);
        await readCharacteristicsData();
    }
}

connectButton.addEventListener('click', async () => {
   try {
       await connectToPeripheralDevice(true);
       connectButton.disabled = true;
       connectButton.style.opacity = 0.5;
    } catch (error) {
        if(error.message === "User cancelled the requestDevice() chooser."){
           return;
        }
            
        console.error('Error:', error);
        connectButton.style.backgroundColor = "red";
    }
});

function displayBatteryLevel() {
    const batteryPercentage = data.batteryPercentage.value;
    const batteryVoltage = data.batteryVoltage.value;
    const regulatedVoltage = (batteryVoltage / batteryPercentage * 100).toFixed(2);
    
    // Map the range from 0-5 to 0-100
    const batteryPercentageMapped = data.batteryChargeLevel.value * 20;    
    batteryLevelElement.style.width = `${batteryPercentageMapped * 0.56}px`; // Scale the battery level to the width of the battery div
    batteryLevelElement.style.backgroundColor = data.batteryChargeLevel.getColor(data.batteryChargeLevel.value);
    batteryLabel.textContent = `${batteryVoltage.toFixed(2)}V (${batteryPercentage}% of ${regulatedVoltage}V)`;
}

async function readCharacteristicsData() {
    await Promise.all(
        Object.keys(data).map(async (key) => {
            let item = data[key];
            console.log("Requesting " + item.name + "...");
            item.value = item.extractData(await item.characteristic.readValue());
            console.log(item.name + ": " + item.value + item.unit);
        })
    );
    displayBatteryLevel();
}

function handleCharacteristicChange(event) {
    // Find the characteristic that changed in the data object by matching the UUID
    let dataItem = Object.values(data).find(item => item.characteristicUUID === event.target.uuid);    
    let dataView = event.target.value;
    dataItem.value = dataItem.extractData(dataView);

    console.log(dataItem.name + " changed: " + dataItem.value + dataItem.unit);
    displayBatteryLevel();
}
