// This sketch draws a nose and two eyes on a human face. It is based on
// this "Hour of Code" Coding Train video by Daniel Shiffman: https://youtu.be/EA3-k9mnLHs
//
// This Sketch uses ml5js, a Machine Learning JavaScript library that
// works well with p5js. ml5js provides lots of interesting methods
// including pitch detection, human pose detection, sound classification, etc.
// Read more here: https://ml5js.org/
//
// This particular Sketch uses ml5js's PoseNet implementation for human pose tracking.
//
// Reference for the ml5js PoseNet implementation:
//  - https://ml5js.org/reference/api-PoseNet/
//
// Primary PoseNet library, which ml5js is using under the hood:
//  - Read this article: "Real-time Human Pose Estimation in the Browser with TensorFlow.js"
//    here: https://link.medium.com/7EBfMICUh2
//  - https://github.com/tensorflow/tfjs-models/tree/master/posenet
//
// Other ML JavaScript APIs:
//  - Face Rec: https://github.com/justadudewhohacks/face-api.js/
// 
// By Jon E. Froehlich
// http://makeabilitylab.io/

let video;
let poseNet;
let human = null;
let handpose = null;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.hide();
  
  // setup PoseNet. This can take a while, so we load it 
  // asynchronously (when it's done, it will call modelReady)
  poseNet = ml5.poseNet(video, onPoseNetModelReady); //call onModelReady when setup
  poseNet.on('pose', onPoseDetected); // call onPoseDetected when pose detected

  handpose = ml5.handpose(video, onHandPoseModelReady);

  // This sets up an event that fills the global variable "predictions"
  // with an array every time new hand poses are detected
  handpose.on("predict", results => {
    predictions = results;
  });
}

function onPoseNetModelReady() {
  print("The PoseNet model is ready...");
}

function onHandPoseModelReady() {
  print("The Handpose model is ready...");
}

function onPoseDetected(poses) {
  // poses can contain an array of bodies (because PoseNet supports
  // recognition for *multiple* human bodies at the same time
  // however, for this demo, we are interested in only one human body
  // which is at poses[0]
  human = poses[0];
}

function draw() {
  image(video, 0, 0); // draw the video to screen

  noStroke(); // turn off drawing outlines of shapes

  if (human != null) {
    
    // For keypoints, see:
    // https://github.com/tensorflow/tfjs-models/tree/master/posenet#keypoints
    // The arm keypoints are 5 - 10
    const pose = human.pose;
    for(let i = 5; i <= 10; i++){
      drawKeypoint(pose.keypoints[i]);
    }
  }

  function drawKeypoint(kp){
    //console.log(kp);
    fill(255, 0, 0, 220);
    ellipse(kp.position.x, kp.position.y, 10);
    text(kp.part, kp.position.x, kp.position.y);
    text(kp.score, kp.position.x, kp.position.y + 15);
  }

  /**
   * Draws a nose at the given x,y position
   * 
   * @param {number} x the x pos of the nose
   * @param {number} y the y pos of the nose
   */
  function drawNose(x, y) {
    fill(255, 0, 0);
    let noseWidth = 30;
    ellipse(x, y, noseWidth);
  }

  /**
   * Draws an eye at the given x,y position
   * 
   * @param {number} x the x pos of the eye
   * @param {number} y the y pos of the eye
   */
  function drawEye(x, y) {
    fill(255);
    let eyeWidth = 40;
    let pupilWidth = 15;
    ellipse(x, y, eyeWidth);

    fill(0);
    ellipse(x, y, pupilWidth);
  }
}