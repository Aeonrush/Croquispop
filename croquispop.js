// Initialize croquis
var croquis = new Croquis();
croquis.lockHistory();
croquis.setCanvasSize(640, 480);
croquis.addLayer();
croquis.fillLayer('#fff');
croquis.addLayer();
croquis.selectLayer(1);
croquis.setTool('brush');
croquis.setToolSize(40);
croquis.setToolColor('#000');
croquis.setToolStabilizeLevel(10);
croquis.setToolStabilizeWeight(0.5);
croquis.setBrushSpacing(0);
croquis.unlockHistory();
var croquisDOMElement = croquis.getDOMElement();
var canvasArea = document.getElementById('canvas-area');
canvasArea.appendChild(croquisDOMElement);
function canvasMouseDown(e) {
    var mousePosition = getRelativePosition(e.clientX, e.clientY);
    canvasArea.style.setProperty('cursor', 'none');
    croquis.down(mousePosition.x, mousePosition.y);
    document.addEventListener('mousemove', canvasMouseMove);
}
function canvasMouseMove(e) {
    var mousePosition = getRelativePosition(e.clientX, e.clientY);
    croquis.move(mousePosition.x, mousePosition.y);
}
function canvasMouseUp(e) {
    var mousePosition = getRelativePosition(e.clientX, e.clientY);
    canvasArea.style.setProperty('cursor', 'crosshair');
    croquis.up(mousePosition.x, mousePosition.y);
    document.removeEventListener('mousemove', canvasMouseMove);
}
function getRelativePosition(absoluteX, absoluteY) {
    var rect = croquisDOMElement.getBoundingClientRect();
    return {x: absoluteX - rect.left, y: absoluteY - rect.top};
}
croquisDOMElement.addEventListener('mousedown', canvasMouseDown);
document.addEventListener('mouseup', canvasMouseUp);

//clear & fill button ui
var clearButton = document.getElementById('clear-button');
clearButton.onclick = function () {
    croquis.clearLayer();
}
var fillButton = document.getElementById('fill-button');
fillButton.onclick = function () {
    var rgb = tinycolor(croquis.getToolColor()).toRgb();
    croquis.fillLayer(tinycolor({r: rgb.r, g: rgb.g, b: rgb.b,
        a: croquis.getToolOpacity()}).toRgbString());
}

//brush images
var circleBrush = document.getElementById('circle-brush');
var brushImages = document.getElementsByClassName('brush-image');
var currentBrush = circleBrush;

Array.prototype.map.call(brushImages, function (brush) {
    brush.addEventListener('mousedown', brushImageMouseDown);
});

function brushImageMouseDown(e) {
    var image = e.currentTarget;
    currentBrush.className = 'brush-image';
    image.className = 'brush-image on';
    currentBrush = image;
    if (image == circleBrush)
        image = null;
    croquis.setBrushImage(image);
    updatePointer();
}

//brush pointer
var brushPointerContainer = document.createElement('div');
brushPointerContainer.className = 'brush-pointer';

croquisDOMElement.addEventListener('mouseover', function () {
    croquisDOMElement.addEventListener('mousemove', croquisMouseMove);
    document.body.appendChild(brushPointerContainer);
});
croquisDOMElement.addEventListener('mouseout', function () {
    croquisDOMElement.removeEventListener('mousemove', croquisMouseMove);
    brushPointerContainer.remove();
});

function croquisMouseMove(e) {
    var x = e.clientX + window.pageXOffset;
    var y = e.clientY + window.pageYOffset;
    brushPointerContainer.style.setProperty('left', x + 'px');
    brushPointerContainer.style.setProperty('top', y + 'px');
}

function updatePointer() {
    var image = currentBrush;
    var threshold;
    if (currentBrush == circleBrush)
    {
        image = null;
        threshold = 0xff;
    }
    else {
        threshold = 0x30;
    }
    var brushPointer = Croquis.createBrushPointer(
        image, croquis.getToolSize(), threshold, true);
    brushPointer.style.setProperty('margin-left',
        '-' + (brushPointer.width * 0.5) + 'px');
    brushPointer.style.setProperty('margin-top',
        '-' + (brushPointer.height * 0.5) + 'px');
    brushPointerContainer.innerHTML = '';
    brushPointerContainer.appendChild(brushPointer);
}
updatePointer();

//color picker
var colorPickerHueSlider =
    document.getElementById('color-picker-hue-slider');
var colorPickerSb = document.getElementById('color-picker-sb');
var colorPickerSaturate = document.getElementById('color-picker-saturate');
var colorPickerThumb = document.getElementById('color-picker-thumb');
colorPickerHueSlider.value = tinycolor(croquis.getToolColor()).toHsv().h;

function setColor() {
    var halfThumbRadius = 7.5;
    var sbSize = 150;
    var h = colorPickerHueSlider.value;
    var s = parseFloat(
        colorPickerThumb.style.getPropertyValue('margin-left'));
    var b = parseFloat(
        colorPickerThumb.style.getPropertyValue('margin-top'));
    s = (s + halfThumbRadius) / sbSize;
    b = 1 - ((b + halfThumbRadius + sbSize) / sbSize);
    croquis.setToolColor(tinycolor({h: h, s:s, v: b}).toRgbString());
    var a = croquis.getToolOpacity();
    var color = tinycolor({h: h, s:s, v: b, a: a});
    colorPickerColor.style.backgroundColor = color.toRgbString();
    colorPickerColor.textContent = color.toHexString();
}

colorPickerHueSlider.onchange = function () {
    var hue = colorPickerHueSlider.value;
    colorPickerSaturate.style.setProperty('background-image',
        'linear-gradient(to right, hsla(' +
        hue + ', 100%, 50%, 0), hsl(' + hue + ', 100%, 50%))');
    setColor();
}

function colorPickerMouseDown(e) {
    document.addEventListener('mousemove', colorPickerMouseMove);
    colorPickerMouseMove(e);
}
function colorPickerMouseUp(e) {
    document.removeEventListener('mousemove', colorPickerMouseMove);
}
function colorPickerMouseMove(e) {
    var boundRect = colorPickerSb.getBoundingClientRect();
    var x = (e.clientX - boundRect.left);
    var y = (e.clientY - boundRect.top);
    pickColor(x, y);
}
function minmax(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function pickColor(x, y) {
    var halfThumbRadius = 7.5;
    var sbSize = 150;
    colorPickerThumb.style.setProperty('margin-left',
        (minmax(x, 0, sbSize) - halfThumbRadius) + 'px');
    colorPickerThumb.style.setProperty('margin-top',
        (minmax(y, 0, sbSize) - (sbSize + halfThumbRadius)) + 'px');
    colorPickerThumb.style.setProperty('border-color',
        (y < sbSize * 0.5)? '#000' : '#fff');
    setColor();
}
colorPickerSb.addEventListener('mousedown', colorPickerMouseDown);
document.addEventListener('mouseup', colorPickerMouseUp);

var backgroundCheckerImage;
(function () {
    backgroundCheckerImage = document.createElement('canvas');
    backgroundCheckerImage.width = backgroundCheckerImage.height = 20;
    var backgroundImageContext = backgroundCheckerImage.getContext('2d');
    backgroundImageContext.fillStyle = '#fff';
    backgroundImageContext.fillRect(0, 0, 20, 20);
    backgroundImageContext.fillStyle = '#ccc';
    backgroundImageContext.fillRect(0, 0, 10, 10);
    backgroundImageContext.fillRect(10, 10, 20, 20);
})();

var colorPickerChecker = document.getElementById('color-picker-checker');
colorPickerChecker.style.backgroundImage = 'url(' +
    backgroundCheckerImage.toDataURL() + ')';
var colorPickerColor = document.getElementById('color-picker-color');

pickColor(0, 150);

//stabilizer shelf
var toolStabilizeLevelSlider =
    document.getElementById('tool-stabilize-level-slider');
var toolStabilizeWeightSlider =
    document.getElementById('tool-stabilize-weight-slider');
toolStabilizeLevelSlider.value = croquis.getToolStabilizeLevel();
toolStabilizeWeightSlider.value = croquis.getToolStabilizeWeight() * 100;

//brush shelf
var selectEraserCheckbox =
    document.getElementById('select-eraser-checkbox');
var brushSizeSlider = document.getElementById('brush-size-slider');
var brushOpacitySlider = document.getElementById('brush-opacity-slider');
var brushFlowSlider = document.getElementById('brush-flow-slider');
var brushSpacingSlider = document.getElementById('brush-spacing-slider');
brushSizeSlider.value = croquis.getToolSize();
brushOpacitySlider.value = croquis.getToolOpacity() * 100;
brushFlowSlider.value = croquis.getBrushFlow() * 100;
brushSpacingSlider.value = croquis.getBrushSpacing() * 100;

toolStabilizeLevelSlider.onchange = function () {
    croquis.setToolStabilizeLevel(toolStabilizeLevelSlider.value);
    toolStabilizeLevelSlider.value = croquis.getToolStabilizeLevel();
}
toolStabilizeWeightSlider.onchange = function () {
    croquis.setToolStabilizeWeight(toolStabilizeWeightSlider.value * 0.01);
    toolStabilizeWeightSlider.value = croquis.getToolStabilizeWeight() * 100;
}

selectEraserCheckbox.onchange = function () {
    croquis.setTool(selectEraserCheckbox.checked? 'eraser' : 'brush');
}
brushSizeSlider.onchange = function () {
    croquis.setToolSize(brushSizeSlider.value);
    updatePointer();
}
brushOpacitySlider.onchange = function () {
    croquis.setToolOpacity(brushOpacitySlider.value * 0.01);
    setColor();
}
brushFlowSlider.onchange = function () {
    croquis.setBrushFlow(brushFlowSlider.value * 0.01);
}
brushSpacingSlider.onchange = function () {
    croquis.setBrushSpacing(brushSpacingSlider.value * 0.01);
}

// Platform variables
var mac = navigator.platform.indexOf('Mac') >= 0;

//keyboard
document.addEventListener('keydown', documentKeyDown);
function documentKeyDown(e) {
    if (mac ? e.metaKey : e.ctrlKey) {
        switch (e.keyCode) {
        case 89: //ctrl + y
            croquis.redo();
            break;
        case 90: //ctrl + z
            croquis[e.shiftKey ? 'redo' : 'undo']();
            break;
        }
    }
}
