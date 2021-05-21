// This sketch demonstrates how to 
// 
// TODO:
//
// By Jon E. Froehlich
// http://makeabilitylab.io/

let pHtmlMsg;

let mapShapeTypeToShapeName = {
  0: "Circle",
  1: "Square",
  2: "Triangle"
};

let curShapeType = 0;
let curShapeSize = 10;

const MIN_SHAPE_SIZE = 10;
const MAX_SHAPE_MARGIN = 10;
let MAX_SHAPE_SIZE = -1;

let serialOptions = { baudRate: 115200  };

function setup() {
  createCanvas(640, 480);

  // Setup Web Serial using serial.js
  serial = new Serial();
  serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // If we have previously approved ports, attempt to connect with them
  serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);

  MAX_SHAPE_SIZE = min(width, height) - MAX_SHAPE_MARGIN;

  // Add in a lil <p> element to provide messages. This is optional
  pHtmlMsg = createP("Click anywhere on this page to open the serial connection dialog");
}

/**
 * Callback function by serial.js when there is an error on web serial
 * 
 * @param {} eventSender 
 */
function onSerialErrorOccurred(eventSender, error) {
  console.log("onSerialErrorOccurred", error);
  pHtmlMsg.html(error);
}

/**
 * Callback function by serial.js when web serial connection is opened
 * 
 * @param {} eventSender 
 */
function onSerialConnectionOpened(eventSender) {
  console.log("onSerialConnectionOpened");
  pHtmlMsg.html("Serial connection opened successfully");
}

/**
 * Callback function by serial.js when web serial connection is closed
 * 
 * @param {} eventSender 
 */
function onSerialConnectionClosed(eventSender) {
  console.log("onSerialConnectionClosed");
  pHtmlMsg.html("onSerialConnectionClosed");
}

/**
 * Callback function serial.js when new web serial data is received
 * 
 * @param {*} eventSender 
 * @param {String} newData new data received over serial
 */
function onSerialDataReceived(eventSender, newData) {
  console.log("onSerialDataReceived", newData);
  pHtmlMsg.html("onSerialDataReceived: " + newData);
}

async function serialWriteShapeData(shapeType, shapeSize) {

  if (serial.isOpen()) {
    //console.log("serialWriteShapeData ", shapeType, shapeSize);

    let shapeSizeFraction = (shapeSize - MIN_SHAPE_SIZE) / (MAX_SHAPE_SIZE - MIN_SHAPE_SIZE);

    // Format the text string to send over serial. nf simply formats the floating point
    // See: https://p5js.org/reference/#/p5/nf
    let strData = shapeType + ", " + nf(shapeSizeFraction, 1, 2);
    console.log("Writing to serial: ", strData);
    serial.writeLine(strData);
  }
}

/**
 * Called automatically by p5js. Call frameRate(<num>) to change how often this
 * function is called
 */
function draw() {

  background(100);

  fill(250);
  noStroke();
  let xCenter = width / 2;
  let yCenter = height / 2;
  let halfShapeSize = curShapeSize / 2;
  switch(curShapeType){
    case 0:
      circle(xCenter, yCenter, curShapeSize);
      break;
    case 1:
      rectMode(CENTER);
      square(xCenter, yCenter, curShapeSize);
      break;
    case 2:
      let x1 = xCenter - halfShapeSize;
      let y1 = yCenter + halfShapeSize;

      let x2 = xCenter;
      let y2 = yCenter - halfShapeSize;

      let x3 = xCenter + halfShapeSize;
      let y3 = y1;
     
      triangle(x1, y1, x2, y2, x3, y3)
  }
}

function mousePressed(){
  curShapeType++;
  if(curShapeType >= Object.keys(mapShapeTypeToShapeName).length){
    curShapeType = 0;
  }

  serialWriteShapeData(curShapeType, curShapeSize);
}

function mouseMoved(){
  let lastShapeSize = curShapeSize;
  curShapeSize = map(mouseX, 0, width, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE);
  curShapeSize = constrain(curShapeSize, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE);

  if(lastShapeSize != curShapeSize){
    serialWriteShapeData(curShapeType, curShapeSize);
  }
  //console.log(mouseX, width, curShapeSize, MAX_SHAPE_SIZE);
}

function mouseClicked() {
  if (!serial.isOpen()) {
    serial.connectAndOpen(null, serialOptions);
  }
}
