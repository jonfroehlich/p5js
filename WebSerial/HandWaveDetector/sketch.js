// This sketch detects a hand wave and angle using the Handpose implementation in ml5js
// and spits this information out on Web Serial. For the non-web serial version of this
// project, see: 
// https://github.com/makeabilitylab/p5js/tree/master/ml5js/Handpose/HandWaveDetector
//
// Or, for a live demo, see:  
// https://makeabilitylab.github.io/p5js/ml5js/Handpose/HandWaveDetector/
//
// Handpose implementation in ml5js
// https://learn.ml5js.org/#/reference/handpose
//
// ml5js is a Machine Learning JavaScript library that provides an easy-to-use API
// for machine learning. See: https://ml5js.org/
// 
// By Jon E. Froehlich
// http://makeabilitylab.io/
//

let handposeModel;
let video;
let curHandpose = null;

// For approximate hand wave estimation, we simply examine the angle of an open palm hand
// If the user moves their hand across a left angle threshold and a right angle threshold
// then a hand wave detected
const leftAngleWaveThreshold = -75; // in degrees
const rightAngleWaveThreshold = -100; // in degrees

let lastHandWaveAngleThresholdExceeded = null; // stores the last hand wave angle exceeded
let overallHandWaveCount = 0;
let contiguousHandWaveCount = 0;

let HandWaveStateEnum = {
  INITIAL: 1,
  HAND_WAVE_LEFT_THRESHOLD_EXCEEDED: 2,
  HAND_WAVE_RIGHT_THRESHOLD_EXCEEDED: 3,
};

let handWaveState = HandWaveStateEnum.INITIAL;

// For debugging
let contiguousHandPoseDetections = 0;
let timestampFirstContiguousHandPoseDetection = -1;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  // video.size(width, height);

  handposeModel = ml5.handpose(video, onHandposeModelReady);

  // Call onNewHandposePrediction every time a new handpose is predicted
  handposeModel.on("predict", onNewHandposePrediction);

  // Hide the video element, and just show the canvas
  video.hide();
}

function onHandposeModelReady() {
  console.log("Handpose model ready!");
  document.getElementById("status").style.display = "none";
}

function onNewHandposePrediction(predictions) {
  if (predictions && predictions.length > 0) {
    curHandpose = predictions[0];
    // console.log(curHandpose);
    if (contiguousHandPoseDetections == 0) {
      timestampFirstContiguousHandPoseDetection = millis();
    }
    contiguousHandPoseDetections++;
  } else {
    curHandpose = null;
    contiguousHandPoseDetections = 0;
  }
}

function draw() {

  // Draw the video to the screen
  image(video, 0, 0, width, height);

  // Draw debug info
  fill(255);
  noStroke();

  const yTextHeight = 15;
  let yDebugText = 15;
  let xDebugText = 6;
  text("fps: " + nfc(frameRate(), 1), xDebugText, yDebugText);

  yDebugText += yTextHeight;
  if (!curHandpose) {
    text("Hand detected: false", xDebugText, yDebugText);
  } else {
    text("Hand detected: true", xDebugText, yDebugText);
    yDebugText += yTextHeight;
    let handPoseDetectionsPerSecond = contiguousHandPoseDetections / (millis() - timestampFirstContiguousHandPoseDetection) * 1000;
    text("Hand detections / sec: " + nfc(handPoseDetectionsPerSecond, 1), xDebugText, yDebugText);
  }

  drawHand(curHandpose);
}

async function serialWriteHandWaveDetected(handWaveAngle) {

  // // let remappedAngle = //-70, 
  if(serialWriter){
    console.log("Writing to serial: ", src.value.toString());
    let rv = await serialWriter.write(src.value.toString() + "\n");
    console.log("Writing finished.");
  }
}

async function serialWriteHandWaveAngle(handWaveAngle) {

  // // let remappedAngle = //-70, 
  let remappedAngle = handWaveAngle + 180;
  if(serialWriter){
    console.log("Writing to serial: ", remappedAngle.toString());
    let rv = await serialWriter.write(remappedAngle + "\n");
    console.log("Writing finished.");
  }
}

// A function to draw ellipses over the detected keypoints
function drawHand(handpose) {
  if (!handpose) {
    return;
  }

  // The handpose data is in this format, see: https://learn.ml5js.org/#/reference/handpose?id=predict
  // {
  //   handInViewConfidence: 1, // The probability of a hand being present.
  //   boundingBox: { // The bounding box surrounding the hand.
  //     topLeft: [162.91, -17.42],
  //     bottomRight: [548.56, 368.23],
  //   },
  //   landmarks: [ // The 3D coordinates of each hand landmark.
  //     [472.52, 298.59, 0.00],
  //     [412.80, 315.64, -6.18],
  //     ...
  //   ],
  //   annotations: { // Semantic groupings of the `landmarks` coordinates.
  //     thumb: [
  //       [412.80, 315.64, -6.18]
  //       [350.02, 298.38, -7.14],
  //       ...
  //     ],
  //     ...
  //   }

  // Draw landmarks
  // Find tight bounding box
  const tightBoundingBox = drawKeypoints(handpose);
  drawSkeleton(handpose);

  // Draw tight bounding box
  noFill();
  stroke(255, 0, 0);
  const tightBoundingBoxWidth = tightBoundingBox.right - tightBoundingBox.left;
  const tightBoundingBoxHeight = tightBoundingBox.bottom - tightBoundingBox.top;
  rect(tightBoundingBox.left, tightBoundingBox.top, tightBoundingBoxWidth, tightBoundingBoxHeight);

  // Draw hand pose bounding box
  const bb = handpose.boundingBox;
  const bbWidth = bb.bottomRight[0] - bb.topLeft[0];
  const bbHeight = bb.bottomRight[1] - bb.topLeft[1];
  rect(bb.topLeft[0], bb.topLeft[1], bbWidth, bbHeight);

  // Check if in hand wave position
  const handWavePosition = isInHandWavePosition(handpose);

  // Hand angle
  const a = handpose.annotations;
  stroke(0, 0, 255, 200);
  const palmBaseVector = createVector(a.palmBase[0][0], a.palmBase[0][1]);
  const middleFingerVector = createVector(a.middleFinger[a.middleFinger.length - 1][0], a.middleFinger[a.middleFinger.length - 1][1]);

  // draw hand angle
  let lineSegment = new LineSegment(palmBaseVector, middleFingerVector);
  lineSegment.strokeColor = color(0, 0, 255, 200);
  lineSegment.draw();

  if (handWavePosition) {
    
    const handWaveAngle = degrees(lineSegment.getHeading());
    serialWriteHandWaveAngle(handWaveAngle);
    if (handWaveAngle > leftAngleWaveThreshold) {
      // hand wave angle just exceeded left angle wave threshold
      if (handWaveState == HandWaveStateEnum.HAND_WAVE_RIGHT_THRESHOLD_EXCEEDED) {
        overallHandWaveCount++;
        contiguousHandWaveCount++;
        //serialWriteHandWaveDetected(handWaveAngle);
      }

      handWaveState = HandWaveStateEnum.HAND_WAVE_LEFT_THRESHOLD_EXCEEDED;
      lastHandWaveAngleThresholdExceeded = handWaveAngle;
    } else if (handWaveAngle < rightAngleWaveThreshold) {
      // hand wave angle just exceeded right angle wave threshold
      if (handWaveState == HandWaveStateEnum.HAND_WAVE_LEFT_THRESHOLD_EXCEEDED) {
        overallHandWaveCount++;
        contiguousHandWaveCount++;
        //serialWriteHandWaveDetected(handWaveAngle);
      }

      handWaveState = HandWaveStateEnum.HAND_WAVE_RIGHT_THRESHOLD_EXCEEDED;
      lastHandWaveAngleThresholdExceeded = handWaveAngle;
    }
  } else {
    contiguousHandWaveCount = 0;
    handWaveState = HandWaveStateEnum.INITIAL;
    lastHandWaveAngleThresholdExceeded = null;
  }

  // Draw confidence
  fill(255, 0, 0);
  noStroke();
  const yTextHeight = 12;
  let yTextPos = tightBoundingBox.top - yTextHeight;
  text(nfc(handpose.handInViewConfidence, 2), tightBoundingBox.left, yTextPos);

  yTextPos -= yTextHeight;
  text("Wave count: " + contiguousHandWaveCount, tightBoundingBox.left, yTextPos);

  yTextPos -= yTextHeight;
  text("Is hand in 'handwave' position: " + handWavePosition, tightBoundingBox.left, yTextPos);

  // draw rotated bounding box
  push();
  noFill();
  rectMode(CENTER)
  translate(tightBoundingBox.left + tightBoundingBoxWidth / 2.0, tightBoundingBox.top + tightBoundingBoxHeight / 2.0);
  rotate(lineSegment.heading - PI / 2);
  rect(0, 0, tightBoundingBoxWidth, tightBoundingBoxHeight);
  pop();

  // Draw tiny circles where the max extent finger points are
  stroke(255);
  fill(255);
  const maxFingerPtSize = 3;
  ellipse(tightBoundingBox.furthestLeftPoint.x, tightBoundingBox.furthestLeftPoint.y, maxFingerPtSize);
  ellipse(tightBoundingBox.furthestRightPoint.x, tightBoundingBox.furthestRightPoint.y, maxFingerPtSize);
  ellipse(tightBoundingBox.mostTopPoint.x, tightBoundingBox.mostTopPoint.y, maxFingerPtSize);
  ellipse(tightBoundingBox.mostBottomPoint.x, tightBoundingBox.mostBottomPoint.y, maxFingerPtSize);

  // Draw minimum distance lines to those points
  // TODO: in future consider drawing a bounding box using these projections
  const op1 = lineSegment.getOrthogonalProjection(tightBoundingBox.furthestRightPoint);
  line(op1.x, op1.y, tightBoundingBox.furthestRightPoint.x, tightBoundingBox.furthestRightPoint.y);

  const op2 = lineSegment.getOrthogonalProjection(tightBoundingBox.furthestLeftPoint);
  line(op2.x, op2.y, tightBoundingBox.furthestLeftPoint.x, tightBoundingBox.furthestLeftPoint.y);
}

function drawKeypoints(handpose) {
  if (!handpose) {
    return;
  }

  let boundingBoxLeft = handpose.landmarks[0][0];
  let boundingBoxTop = handpose.landmarks[0][1];
  let boundingBoxRight = boundingBoxLeft;
  let boundingBoxBottom = boundingBoxTop;

  let furthestLeftPoint = createVector(boundingBoxLeft, boundingBoxTop);
  let furthestRightPoint = createVector(boundingBoxLeft, boundingBoxTop);
  let mostTopPoint = createVector(boundingBoxLeft, boundingBoxTop);
  let mostBottomPoint = createVector(boundingBoxLeft, boundingBoxTop);

  // draw keypoints
  for (let j = 0; j < handpose.landmarks.length; j += 1) {
    const landmark = handpose.landmarks[j];
    fill(0, 255, 0, 200);
    noStroke();
    ellipse(landmark[0], landmark[1], 10, 10);
    if (landmark[0] < boundingBoxLeft) {
      boundingBoxLeft = landmark[0];
      furthestLeftPoint.x = landmark[0];
      furthestLeftPoint.y = landmark[1];
    }

    if (landmark[0] > boundingBoxRight) {
      boundingBoxRight = landmark[0];
      furthestRightPoint.x = landmark[0];
      furthestRightPoint.y = landmark[1];
    }

    if (landmark[1] < boundingBoxTop) {
      boundingBoxTop = landmark[1];
      mostTopPoint.x = landmark[0];
      mostTopPoint.y = landmark[1];
    }

    if (landmark[1] > boundingBoxBottom) {
      boundingBoxBottom = landmark[1];
      mostBottomPoint.x = landmark[0];
      mostBottomPoint.y = landmark[1];
    }
  }

  // return the bounding box
  return {
    left: boundingBoxLeft,
    right: boundingBoxRight,
    top: boundingBoxTop,
    bottom: boundingBoxBottom,

    furthestLeftPoint: furthestLeftPoint,
    furthestRightPoint: furthestRightPoint,
    mostTopPoint: mostTopPoint,
    mostBottomPoint: mostBottomPoint,
  };
}

/**
 * Uses a basic heuristic to determine if hand is in hand pose position
 * @param {ml5js handpose} handpose 
 */
function isInHandWavePosition(handpose) {
  if (!handpose) {
    return false;
  }

  // Loop through all the skeletons detected
  const a = handpose.annotations;

  // Check to see if the palm base is lower than the index, middle, ring, and pinky bases
  // Note that we purposefully don't check the thumb here as that base can be lower than the palm
  // when waving
  if (a.palmBase[0][1] < a.indexFinger[0][1] ||
    a.palmBase[0][1] < a.middleFinger[0][1] ||
    a.palmBase[0][1] < a.ringFinger[0][1] ||
    a.palmBase[0][1] < a.pinky[0][1]) {
    return false;
  }

  // For every finger skeleton, check to make sure the points are ordered
  // If not, probably not in a waving position
  for (let i = 0; i < a.thumb.length - 1; i++) {
    if (a.thumb[i][1] < a.thumb[i + 1][1]) {
      return false;
    }
  }

  for (let i = 0; i < a.indexFinger.length - 1; i++) {
    if (a.indexFinger[i][1] < a.indexFinger[i + 1][1]) {
      return false;
    }
  }

  for (let i = 0; i < a.middleFinger.length - 1; i++) {
    if (a.middleFinger[i][1] < a.middleFinger[i + 1][1]) {
      return false;
    }
  }

  for (let i = 0; i < a.ringFinger.length - 1; i++) {
    if (a.ringFinger[i][1] < a.ringFinger[i + 1][1]) {
      return false;
    }
  }

  for (let i = 0; i < a.pinky.length - 1; i++) {
    if (a.pinky[i][1] < a.pinky[i + 1][1]) {
      return false;
    }
  }

  return true;
}

// A function to draw the skeletons
function drawSkeleton(handpose) {
  if (!handpose) {
    return;
  }

  stroke(0, 255, 0, 200);
  noFill();

  // Loop through all the skeletons detected
  const a = handpose.annotations;

  // For every skeleton, loop through all body connections
  for (let i = 0; i < a.thumb.length - 1; i++) {
    line(a.thumb[i][0], a.thumb[i][1], a.thumb[i + 1][0], a.thumb[i + 1][1]);
  }

  for (let i = 0; i < a.indexFinger.length - 1; i++) {
    line(a.indexFinger[i][0], a.indexFinger[i][1], a.indexFinger[i + 1][0], a.indexFinger[i + 1][1]);
  }

  for (let i = 0; i < a.middleFinger.length - 1; i++) {
    line(a.middleFinger[i][0], a.middleFinger[i][1], a.middleFinger[i + 1][0], a.middleFinger[i + 1][1]);
  }

  for (let i = 0; i < a.ringFinger.length - 1; i++) {
    line(a.ringFinger[i][0], a.ringFinger[i][1], a.ringFinger[i + 1][0], a.ringFinger[i + 1][1]);
  }

  for (let i = 0; i < a.pinky.length - 1; i++) {
    line(a.pinky[i][0], a.pinky[i][1], a.pinky[i + 1][0], a.pinky[i + 1][1]);
  }

  line(a.palmBase[0][0], a.palmBase[0][1], a.thumb[0][0], a.thumb[0][1]);
  line(a.palmBase[0][0], a.palmBase[0][1], a.indexFinger[0][0], a.indexFinger[0][1]);
  line(a.palmBase[0][0], a.palmBase[0][1], a.middleFinger[0][0], a.middleFinger[0][1]);
  line(a.palmBase[0][0], a.palmBase[0][1], a.ringFinger[0][0], a.ringFinger[0][1]);
  line(a.palmBase[0][0], a.palmBase[0][1], a.pinky[0][0], a.pinky[0][1]);
}