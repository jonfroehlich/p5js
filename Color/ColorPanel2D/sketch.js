let pFrameRate;
let selectedColor;
let rgbColorPickerPanel;

function setup() {
  createCanvas(500, 100);

  pFrameRate = createP('Framerate');
  selectedColor = color(0);

  rgbColorPickerPanel = new RgbColorPickerPanel(0, 0, width, height);
}

function draw() {
  background(0);

  rgbColorPickerPanel.draw();
  pFrameRate.html(nfc(frameRate(), 1) + " fps");
}

function setSelectedColor(c){
  selectedColor = c;
  rgbColorPickerPanel.setSelectedColor(c);
}

function mousePressed(){
  let colorPanelAtMouse = rgbColorPickerPanel.getColorPanelAtCoords(mouseX, mouseY);
  if(colorPanelAtMouse){
    let c = colorPanelAtMouse.getColorForPixel(mouseX, mouseY, true);
    setSelectedColor(c);
  }
}

function mouseMoved(){
  let colorPanelAtMouse = rgbColorPickerPanel.getColorPanelAtCoords(mouseX, mouseY);
  if(colorPanelAtMouse){
    let c = colorPanelAtMouse.getColorForPixel(mouseX, mouseY, true);
    //setHoverColor(c);
    rgbColorPickerPanel.setHoverColor(c);
  }
}